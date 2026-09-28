import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { sanitizeProgress } from '@/lib/admin-progress';
import { auth, db } from '@/lib/firebase';
import {
  ensureProgressHistoryBaseline,
  historyMetaRef,
  historyRevisionRef,
  setProgressHistoryInTransaction,
} from '@/lib/progress-history';
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
  type GateProgress,
  type LabScenarioProgress,
  type LegStatus,
  type MilesEvent,
} from '@/lib/progress';

const SAVE_DEBOUNCE_MS = 450;
const MAX_LEDGER = 100;
const MAX_LAB_MILE_REWARDS = 3;
const COLLECTION = 'learnerProgress';

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

type ProgressDoc = {
  state: Progress;
  revision: number;
  updatedAt?: unknown;
  legacyImportedAt?: unknown;
};

export type ProgressConflictHandler = () => void;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();
let epoch = 0;
let conflictHandler: ProgressConflictHandler | null = null;
let hooksInstalled = false;

function emptyProgress(): Progress {
  return {
    v: 1,
    gates: {},
    miles: 0,
    wings: [],
    lab: {},
    pledgeSigned: false,
    certifiedAt: null,
    ledger: [],
  };
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Not authenticated');
  }
  return uid;
}

function progressRef(uid: string): DocumentReference {
  return doc(db, COLLECTION, uid);
}

function normalizeDoc(data: Partial<ProgressDoc> | undefined): ProgressResponse {
  const state = (data?.state as Progress | undefined) ?? emptyProgress();
  const revision = typeof data?.revision === 'number' ? data.revision : 0;
  return {
    state: { ...emptyProgress(), ...state, v: 1 },
    revision,
  };
}

export async function fetchServerProgress(): Promise<ProgressResponse> {
  const uid = requireUid();
  const ref = progressRef(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const state = emptyProgress();
    await setDoc(ref, {
      state,
      revision: 0,
      updatedAt: serverTimestamp(),
    });
    return { state, revision: 0 };
  }

  const parsed = normalizeDoc(snap.data() as ProgressDoc);
  if (!parsed.state || typeof parsed.revision !== 'number') {
    throw new Error('Progress document was incomplete');
  }
  return parsed;
}

async function putServerProgress(
  state: Progress,
  expectedRevision: number,
): Promise<{ ok: true; data: ProgressResponse } | { ok: false; conflict?: ConflictResponse; status: number }> {
  const uid = requireUid();
  const ref = progressRef(uid);
  const sanitizedState = sanitizeProgress({ state });

  try {
    const data = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const metaRef = historyMetaRef(uid);
      const metaSnap = await tx.get(metaRef);
      const hasBaseline =
        metaSnap.exists() && typeof metaSnap.data()?.baselineRevision === 'number';

      if (!snap.exists()) {
        if (expectedRevision !== 0) {
          const err = new Error('revision_conflict') as Error & {
            conflict: ConflictResponse;
          };
          err.conflict = { error: 'revision_conflict', state: emptyProgress(), revision: 0 };
          throw err;
        }

        const baselineRef = historyRevisionRef(uid, 0);
        const nextRef = historyRevisionRef(uid, 1);
        const baselineSnap = await tx.get(baselineRef);
        const nextSnap = await tx.get(nextRef);

        if (progressStatesEqual(emptyProgress(), sanitizedState)) {
          if (!hasBaseline) {
            tx.set(metaRef, {
              uid,
              baselineRevision: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            if (!baselineSnap.exists()) {
              setProgressHistoryInTransaction(tx, {
                uid,
                revision: 0,
                state: emptyProgress(),
                source: 'baseline',
                isBaseline: true,
              });
            }
          }
          tx.set(ref, {
            state: sanitizedState,
            revision: 0,
            updatedAt: serverTimestamp(),
          });
          return { state: sanitizedState, revision: 0 };
        }

        if (!hasBaseline) {
          tx.set(metaRef, {
            uid,
            baselineRevision: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (!baselineSnap.exists()) {
            setProgressHistoryInTransaction(tx, {
              uid,
              revision: 0,
              state: emptyProgress(),
              source: 'baseline',
              isBaseline: true,
            });
          }
        }

        const nextRevision = 1;
        tx.set(ref, {
          state: sanitizedState,
          revision: nextRevision,
          updatedAt: serverTimestamp(),
        });
        if (!nextSnap.exists()) {
          setProgressHistoryInTransaction(tx, {
            uid,
            revision: nextRevision,
            state: sanitizedState,
            source: 'save',
            isBaseline: false,
          });
        }
        return { state: sanitizedState, revision: nextRevision };
      }

      const current = normalizeDoc(snap.data() as ProgressDoc);
      if (current.revision !== expectedRevision) {
        const err = new Error('revision_conflict') as Error & {
          conflict: ConflictResponse;
        };
        err.conflict = {
          error: 'revision_conflict',
          state: current.state,
          revision: current.revision,
        };
        throw err;
      }

      if (progressStatesEqual(current.state, sanitizedState)) {
        return { state: current.state, revision: current.revision };
      }

      const nextRevision = expectedRevision + 1;
      const baselineRevRef = historyRevisionRef(uid, current.revision);
      const nextRevRef = historyRevisionRef(uid, nextRevision);
      const baselineRevSnap = await tx.get(baselineRevRef);
      const nextRevSnap = await tx.get(nextRevRef);

      if (!hasBaseline) {
        tx.set(metaRef, {
          uid,
          baselineRevision: current.revision,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (!baselineRevSnap.exists()) {
          setProgressHistoryInTransaction(tx, {
            uid,
            revision: current.revision,
            state: current.state,
            source: 'baseline',
            isBaseline: true,
          });
        }
      }

      const existing = (snap.data() as ProgressDoc) ?? {};
      tx.set(ref, {
        ...existing,
        state: sanitizedState,
        revision: nextRevision,
        updatedAt: serverTimestamp(),
      });
      if (!nextRevSnap.exists()) {
        setProgressHistoryInTransaction(tx, {
          uid,
          revision: nextRevision,
          state: sanitizedState,
          source: 'save',
          isBaseline: false,
        });
      }
      return { state: sanitizedState, revision: nextRevision };
    });

    return { ok: true, data };
  } catch (e) {
    const conflict = (e as { conflict?: ConflictResponse })?.conflict;
    if (conflict?.state && typeof conflict.revision === 'number') {
      return { ok: false, conflict, status: 409 };
    }
    return { ok: false, status: 500 };
  }
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

/** Install debounced, serialized save scheduling (call once from ProgressHydrator). */
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

/** Immediate retry after a failed save (skips debounce). */
export function retryProgressSave(): void {
  clearDebounceTimer();
  enqueueFlush();
}

// ── Legacy merge (mirrors server/progress-merge.ts; kept local so UI/progress.ts stay untouched) ──

function emptyGate(): GateProgress {
  return { legs: {}, checkScore: null, checkAttempts: 0, mastered: false };
}

function mergeProgressStates(server: Progress, legacy: Progress): Progress {
  return {
    v: 1,
    gates: mergeGates(server.gates, legacy.gates),
    miles: Math.max(server.miles, legacy.miles),
    wings: mergeStringUnion(server.wings, legacy.wings),
    lab: mergeLab(server.lab, legacy.lab),
    pledgeSigned: server.pledgeSigned || legacy.pledgeSigned,
    certifiedAt: mergeCertifiedAt(server.certifiedAt, legacy.certifiedAt),
    ledger: mergeLedger(server.ledger, legacy.ledger),
  };
}

function mergeGates(
  server: Progress['gates'],
  legacy: Progress['gates'],
): Progress['gates'] {
  const out: Progress['gates'] = {};
  const ids = new Set([...Object.keys(server), ...Object.keys(legacy)]);
  for (const id of ids) {
    out[id] = mergeGate(server[id] ?? emptyGate(), legacy[id] ?? emptyGate());
  }
  return out;
}

function mergeGate(server: GateProgress, legacy: GateProgress): GateProgress {
  return {
    legs: mergeLegs(server.legs, legacy.legs),
    checkScore: mergeNullableMax(server.checkScore, legacy.checkScore),
    checkAttempts: Math.max(server.checkAttempts, legacy.checkAttempts),
    mastered: server.mastered || legacy.mastered,
  };
}

function mergeLegs(
  server: Record<string, LegStatus>,
  legacy: Record<string, LegStatus>,
): Record<string, LegStatus> {
  const out: Record<string, LegStatus> = {};
  const ids = new Set([...Object.keys(server), ...Object.keys(legacy)]);
  for (const id of ids) {
    out[id] = mergeLegStatus(server[id], legacy[id]);
  }
  return out;
}

function mergeLegStatus(a: LegStatus | undefined, b: LegStatus | undefined): LegStatus {
  if (a === 'done' || b === 'done') return 'done';
  if (a === 'open' || b === 'open') return 'open';
  if (a === 'locked' || b === 'locked') return 'locked';
  return 'open';
}

function mergeLab(
  server: Progress['lab'],
  legacy: Progress['lab'],
): Progress['lab'] {
  const out: Progress['lab'] = {};
  const ids = new Set([...Object.keys(server), ...Object.keys(legacy)]);
  for (const id of ids) {
    out[id] = mergeLabScenario(server[id], legacy[id]);
  }
  return out;
}

function mergeLabScenario(
  server: LabScenarioProgress | undefined,
  legacy: LabScenarioProgress | undefined,
): LabScenarioProgress {
  const a = server ?? { attempts: 0, bestScore: 0 };
  const b = legacy ?? { attempts: 0, bestScore: 0 };
  const rewarded = Math.max(a.rewardedAttempts ?? 0, b.rewardedAttempts ?? 0);
  const merged: LabScenarioProgress = {
    attempts: Math.max(a.attempts, b.attempts),
    bestScore: Math.max(a.bestScore, b.bestScore),
  };
  if (a.goldViewed || b.goldViewed) merged.goldViewed = true;
  if (a.rewardedAttempts !== undefined || b.rewardedAttempts !== undefined) {
    merged.rewardedAttempts = Math.min(rewarded, MAX_LAB_MILE_REWARDS);
  }
  return merged;
}

function mergeStringUnion(server: string[], legacy: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...server, ...legacy]) {
    if (!w || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

function mergeNullableMax(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

function mergeCertifiedAt(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;
  return ta <= tb ? a : b;
}

function mergeLedger(server: MilesEvent[], legacy: MilesEvent[]): MilesEvent[] {
  const byId = new Map<string, MilesEvent>();
  for (const event of [...server, ...legacy]) {
    if (!isValidLedgerEvent(event)) continue;
    const prev = byId.get(event.id);
    if (!prev || eventTime(event) >= eventTime(prev)) {
      byId.set(event.id, event);
    }
  }
  return [...byId.values()]
    .sort((x, y) => eventTime(y) - eventTime(x))
    .slice(0, MAX_LEDGER);
}

function isValidLedgerEvent(event: MilesEvent): boolean {
  return (
    typeof event?.id === 'string' &&
    event.id.length > 0 &&
    typeof event.at === 'string' &&
    event.at.length > 0 &&
    typeof event.amount === 'number' &&
    Number.isFinite(event.amount) &&
    typeof event.label === 'string'
  );
}

function eventTime(event: MilesEvent): number {
  const t = Date.parse(event.at);
  return Number.isNaN(t) ? 0 : t;
}

function progressStatesEqual(a: Progress, b: Progress): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function postLegacyImport(
  state: Progress,
  expectedRevision: number,
): Promise<ImportLegacyResponse> {
  const uid = requireUid();
  const ref = progressRef(uid);
  const legacy: Progress = {
    ...emptyProgress(),
    ...state,
    v: 1,
    ledger: (state.ledger ?? []).slice(0, MAX_LEDGER),
  };

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const metaRef = historyMetaRef(uid);
      const metaSnap = await tx.get(metaRef);
      const hasBaseline =
        metaSnap.exists() && typeof metaSnap.data()?.baselineRevision === 'number';

      if (!snap.exists()) {
        if (expectedRevision !== 0) {
          const err = new Error('revision_conflict') as Error & {
            conflict: ConflictResponse;
          };
          err.conflict = { error: 'revision_conflict', state: emptyProgress(), revision: 0 };
          throw err;
        }
        const merged = sanitizeProgress({ state: mergeProgressStates(emptyProgress(), legacy) });
        const histRef = historyRevisionRef(uid, 1);
        const histSnap = await tx.get(histRef);

        tx.set(ref, {
          state: merged,
          revision: 1,
          updatedAt: serverTimestamp(),
          legacyImportedAt: serverTimestamp(),
        });
        // No prior history: baseline is the imported state (no fake past events).
        if (!hasBaseline) {
          tx.set(metaRef, {
            uid,
            baselineRevision: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (!histSnap.exists()) {
            setProgressHistoryInTransaction(tx, {
              uid,
              revision: 1,
              state: merged,
              source: 'baseline',
              isBaseline: true,
            });
          }
        } else if (!histSnap.exists()) {
          setProgressHistoryInTransaction(tx, {
            uid,
            revision: 1,
            state: merged,
            source: 'legacy-import',
            isBaseline: false,
          });
        }
        return { state: merged, revision: 1, imported: true };
      }

      const raw = snap.data() as ProgressDoc;
      const current = normalizeDoc(raw);

      if (current.revision !== expectedRevision) {
        const err = new Error('revision_conflict') as Error & {
          conflict: ConflictResponse;
        };
        err.conflict = {
          error: 'revision_conflict',
          state: current.state,
          revision: current.revision,
        };
        throw err;
      }

      // Already imported — return existing state unchanged (idempotent).
      if (raw.legacyImportedAt != null) {
        return {
          state: current.state,
          revision: current.revision,
          imported: false,
        };
      }

      const merged = sanitizeProgress({ state: mergeProgressStates(current.state, legacy) });
      const stateChanged = !progressStatesEqual(current.state, merged);
      const nextRevision = stateChanged ? current.revision + 1 : current.revision;
      const histRef = historyRevisionRef(uid, nextRevision);
      const histSnap = await tx.get(histRef);

      if (!hasBaseline) {
        tx.set(metaRef, {
          uid,
          baselineRevision: nextRevision,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (!histSnap.exists()) {
          setProgressHistoryInTransaction(tx, {
            uid,
            revision: nextRevision,
            state: merged,
            source: 'baseline',
            isBaseline: true,
          });
        }
      } else if (stateChanged && !histSnap.exists()) {
        setProgressHistoryInTransaction(tx, {
          uid,
          revision: nextRevision,
          state: merged,
          source: 'legacy-import',
          isBaseline: false,
        });
      }

      tx.set(ref, {
        ...raw,
        state: merged,
        revision: nextRevision,
        updatedAt: serverTimestamp(),
        legacyImportedAt: serverTimestamp(),
      });

      return { state: merged, revision: nextRevision, imported: true };
    });
  } catch (e) {
    const conflict = (e as { conflict?: ConflictResponse })?.conflict;
    if (conflict) {
      throw new Error(`Legacy import failed (409)`);
    }
    throw e instanceof Error ? e : new Error('Legacy import failed');
  }
}

/**
 * After loading Firestore progress: optionally merge legacy localStorage once, then hydrate.
 * Skips import when no importable legacy exists (or claim blocks another account).
 * Removes localStorage only after successful processing.
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
    void ensureProgressHistoryBaseline(userId, server.state, server.revision).catch((error) => {
      console.error('progress history baseline failed', error);
    });
    return;
  }

  claimLegacyImportForUser(userId);

  try {
    const result = await postLegacyImport(legacy, server.revision);
    hydrateFromServer(result.state, result.revision);
    clearLegacyLocalProgress();
    markLegacyImportDone();
    void ensureProgressHistoryBaseline(userId, result.state, result.revision).catch((error) => {
      console.error('progress history baseline failed', error);
    });
  } catch {
    markLegacyImportError();
  }
}

/** Re-load Firestore progress for the current signed-in user (error retry). */
export async function retryProgressHydration(userId: string): Promise<void> {
  beginServerHydration(userId);
  try {
    const data = await fetchServerProgress();
    await hydrateWithOptionalLegacyImport(userId, data);
  } catch {
    failServerHydration();
  }
}

/** Retry a failed legacy import (fresh Firestore revision + same localStorage blob). */
export async function retryLegacyImport(userId: string): Promise<void> {
  markLegacyImportPending();
  try {
    const server = await fetchServerProgress();
    await hydrateWithOptionalLegacyImport(userId, server);
  } catch {
    markLegacyImportError();
  }
}
