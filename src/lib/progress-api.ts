import {
  acceptServerProgress,
  applySuccessfulServerSave,
  beginServerHydration,
  canImportLegacyForUser,
  claimLegacyImportForUser,
  clearLegacyLocalProgress,
  failServerHydration,
  getHydratedUserId,
  getServerSavePayload,
  hydrateFromServer,
  markLegacyImportDone,
  markLegacyImportError,
  markLegacyImportPending,
  markProgressSaveError,
  markProgressSaveIdle,
  markProgressSaveSaving,
  peekLegacyLocalProgress,
  registerServerSaveHooks,
  type Progress,
} from '@/lib/progress';

const SAVE_DEBOUNCE_MS = 450;

type ProgressResponse = {
  state: Progress;
  revision: number;
};

type ConflictResponse = ProgressResponse & {
  error?: string;
};

type ImportLegacyResponse = ProgressResponse & {
  imported: boolean;
};

export type ProgressConflictHandler = () => void;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();
let epoch = 0;
let conflictHandler: ProgressConflictHandler | null = null;
let hooksInstalled = false;

export async function fetchServerProgress(): Promise<ProgressResponse> {
  const res = await fetch('/api/progress', { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Progress request failed (${res.status})`);
  }
  const data = (await res.json()) as ProgressResponse;
  if (!data?.state || typeof data.revision !== 'number') {
    throw new Error('Progress response was incomplete');
  }
  return data;
}

async function putServerProgress(
  state: Progress,
  expectedRevision: number,
): Promise<{ ok: true; data: ProgressResponse } | { ok: false; conflict?: ConflictResponse; status: number }> {
  const res = await fetch('/api/progress', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expectedRevision, state }),
  });

  let body: ConflictResponse | null = null;
  try {
    body = (await res.json()) as ConflictResponse;
  } catch {
    body = null;
  }

  if (res.status === 409 && body?.state && typeof body.revision === 'number') {
    return { ok: false, conflict: body, status: 409 };
  }

  if (!res.ok || !body?.state || typeof body.revision !== 'number') {
    return { ok: false, status: res.status };
  }

  return { ok: true, data: { state: body.state, revision: body.revision } };
}

function clearDebounceTimer(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

async function flushSave(runEpoch: number): Promise<void> {
  if (runEpoch !== epoch) return;

  const payload = getServerSavePayload();
  if (!payload) {
    markProgressSaveIdle();
    return;
  }

  const userId = getHydratedUserId();
  markProgressSaveSaving();

  try {
    const result = await putServerProgress(payload.state, payload.expectedRevision);
    if (runEpoch !== epoch || getHydratedUserId() !== userId) return;

    if (result.ok) {
      applySuccessfulServerSave(payload.state, result.data.state, result.data.revision);
      return;
    }

    if (result.status === 409 && result.conflict) {
      acceptServerProgress(result.conflict.state, result.conflict.revision);
      conflictHandler?.();
      return;
    }

    markProgressSaveError();
  } catch {
    if (runEpoch !== epoch) return;
    markProgressSaveError();
  }
}

function enqueueFlush(): void {
  const runEpoch = epoch;
  chain = chain.then(() => flushSave(runEpoch)).catch(() => {
    if (runEpoch === epoch) markProgressSaveError();
  });
}

function scheduleSave(): void {
  clearDebounceTimer();
  const runEpoch = epoch;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (runEpoch !== epoch) return;
    enqueueFlush();
  }, SAVE_DEBOUNCE_MS);
}

function cancelSave(): void {
  epoch += 1;
  clearDebounceTimer();
  chain = Promise.resolve();
}

/** Install debounced, serialized PUT scheduling (call once from ProgressHydrator). */
export function installProgressSaver(options?: { onConflict?: ProgressConflictHandler }): void {
  conflictHandler = options?.onConflict ?? null;
  if (hooksInstalled) return;
  registerServerSaveHooks({ schedule: scheduleSave, cancel: cancelSave });
  hooksInstalled = true;
}

export function setProgressConflictHandler(handler: ProgressConflictHandler | null): void {
  conflictHandler = handler;
}

/** Tear down hooks (tests / hot reload). Cancels in-flight save generation. */
export function uninstallProgressSaver(): void {
  cancelSave();
  registerServerSaveHooks(null);
  conflictHandler = null;
  hooksInstalled = false;
}

/** Immediate retry after a failed PUT (skips debounce). */
export function retryProgressSave(): void {
  clearDebounceTimer();
  enqueueFlush();
}

export async function postLegacyImport(
  state: Progress,
  expectedRevision: number,
): Promise<ImportLegacyResponse> {
  const res = await fetch('/api/progress/import-legacy', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expectedRevision, state }),
  });
  let body: (ImportLegacyResponse & { error?: string }) | null = null;
  try {
    body = (await res.json()) as ImportLegacyResponse & { error?: string };
  } catch {
    body = null;
  }
  if (!res.ok || !body?.state || typeof body.revision !== 'number') {
    throw new Error(`Legacy import failed (${res.status})`);
  }
  return {
    state: body.state,
    revision: body.revision,
    imported: Boolean(body.imported),
  };
}

/**
 * After GET /api/progress: optionally POST legacy localStorage once, then hydrate.
 * Skips the endpoint when no importable legacy exists (or claim blocks another account).
 * Removes localStorage only after the server confirms successful processing.
 */
export async function hydrateWithOptionalLegacyImport(
  userId: string,
  server: ProgressResponse,
): Promise<void> {
  markLegacyImportPending();

  const legacy = peekLegacyLocalProgress();
  if (!legacy || !canImportLegacyForUser(userId)) {
    hydrateFromServer(server.state, server.revision);
    markLegacyImportDone();
    return;
  }

  claimLegacyImportForUser(userId);

  try {
    const result = await postLegacyImport(legacy, server.revision);
    hydrateFromServer(result.state, result.revision);
    clearLegacyLocalProgress();
    markLegacyImportDone();
  } catch {
    markLegacyImportError();
  }
}

/** Re-run GET /api/progress for the current signed-in user (error retry). */
export async function retryProgressHydration(userId: string): Promise<void> {
  beginServerHydration(userId);
  try {
    const data = await fetchServerProgress();
    await hydrateWithOptionalLegacyImport(userId, data);
  } catch {
    failServerHydration();
  }
}

/** Retry a failed legacy import (fresh GET revision + same localStorage blob). */
export async function retryLegacyImport(userId: string): Promise<void> {
  markLegacyImportPending();
  try {
    const server = await fetchServerProgress();
    await hydrateWithOptionalLegacyImport(userId, server);
  } catch {
    markLegacyImportError();
  }
}
