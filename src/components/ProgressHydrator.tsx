import { useEffect, useRef, useState } from 'react';
import { useAdminAccess } from '@/lib/admin';
import { useAdminViewMode } from '@/lib/admin-view';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/components/Toast';
import {
  fetchServerProgress,
  hydrateWithOptionalLegacyImport,
  installProgressSaver,
  retryLegacyImport,
  retryProgressSave,
  setProgressConflictHandler,
} from '@/lib/progress-api';
import {
  beginServerHydration,
  clearProgressMemory,
  failServerHydration,
  getHydratedUserId,
  getLegacyImportStatus,
  getProgressSyncStatus,
  useLegacyImportStatus,
  useProgressSaveStatus,
} from '@/lib/progress';

/**
 * Loads GET /api/progress after sign-in, runs one-time legacy import before
 * ready/checkIn, clears in-memory progress on sign-out, and installs the
 * debounced PUT saver. Does not write localStorage while server-backed.
 */
export default function ProgressHydrator() {
  const { data: session, isPending, isSigningOut } = authClient.useSession();
  const { status: adminStatus } = useAdminAccess();
  const { isLearnerView } = useAdminViewMode();
  const { showToast } = useToast();
  const fetchGen = useRef(0);
  const saveStatus = useProgressSaveStatus();
  const legacyImportStatus = useLegacyImportStatus();
  const [importRetrying, setImportRetrying] = useState(false);
  const skipLearnerProgress = adminStatus === 'authorized' && !isLearnerView;

  useEffect(() => {
    installProgressSaver();
  }, []);

  useEffect(() => {
    setProgressConflictHandler(() => {
      showToast(
        'TOWER:',
        'Newer progress was loaded from the server. Your last change wasn’t saved over it.',
      );
    });
    return () => setProgressConflictHandler(null);
  }, [showToast]);

  useEffect(() => {
    if (isPending) return;

    if (isSigningOut || !session?.user?.id) {
      fetchGen.current += 1;
      clearProgressMemory();
      return;
    }

    if (adminStatus === 'loading') return;

    if (skipLearnerProgress) {
      fetchGen.current += 1;
      clearProgressMemory();
      return;
    }

    const userId = session.user.id;
    if (
      getHydratedUserId() === userId &&
      getProgressSyncStatus() === 'ready' &&
      getLegacyImportStatus() === 'done'
    ) {
      return;
    }

    const gen = ++fetchGen.current;
    beginServerHydration(userId);

    void (async () => {
      try {
        const data = await fetchServerProgress();
        if (fetchGen.current !== gen) return;
        await hydrateWithOptionalLegacyImport(userId, data);
      } catch {
        if (fetchGen.current !== gen) return;
        failServerHydration();
      }
    })();
  }, [isPending, session?.user?.id, adminStatus, isSigningOut, skipLearnerProgress]);

  const onRetryImport = async () => {
    if (!session?.user?.id || importRetrying) return;
    setImportRetrying(true);
    try {
      await retryLegacyImport(session.user.id);
    } finally {
      setImportRetrying(false);
    }
  };

  if (skipLearnerProgress) return null;

  if (legacyImportStatus === 'error') {
    return (
      <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-paper/90 px-6">
        <div
          className="pointer-events-auto w-full max-w-lg border border-signal-600 bg-tarmac-900 px-6 py-8 shadow-modal"
          role="alert"
        >
          <p className="label text-signal-500">HOLD SHORT</p>
          <h1 className="h2 mt-3 text-fog-100">Couldn’t import local progress</h1>
          <p className="small mt-3 text-fog-300">
            Your device still holds the previous flight plan. It wasn’t written to the tower
            yet — retry when the connection is clear. Nothing on this device was deleted.
          </p>
          <button
            type="button"
            className="btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRetryImport}
            disabled={importRetrying}
            aria-busy={importRetrying}
          >
            {importRetrying ? 'Retrying…' : 'Retry import'}
          </button>
        </div>
      </div>
    );
  }

  if (saveStatus !== 'error') return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[110] w-[min(92vw,360px)]">
      <div
        className="pointer-events-auto flex items-start gap-3 rounded-[2px] border border-signal-600 bg-tarmac-900 px-4 py-3 shadow-modal"
        role="alert"
      >
        <div className="min-w-0 flex-1">
          <p className="label text-signal-500">HOLD SHORT</p>
          <p className="small mt-1 text-fog-100">
            Progress didn’t reach the tower. Your work is still on this device — retry when ready.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-[2px] border border-line px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-fog-100 transition-colors hover:border-glow-amber hover:text-glow-amber"
          onClick={() => retryProgressSave()}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
