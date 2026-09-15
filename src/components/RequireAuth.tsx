import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { authClient } from '@/lib/auth-client';
import { retryProgressHydration } from '@/lib/progress-api';
import { useLegacyImportStatus, useProgressSyncStatus } from '@/lib/progress';

/**
 * Guards learner routes. Unauthenticated visitors are sent to /login with the
 * requested location preserved so login can return them after sign-in.
 * Authenticated visitors wait for GET /api/progress + legacy import before mount
 * (so Dashboard checkIn cannot race the import).
 */
export default function RequireAuth() {
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const syncStatus = useProgressSyncStatus();
  const legacyImportStatus = useLegacyImportStatus();
  const [retrying, setRetrying] = useState(false);

  // Import failure UI is owned by ProgressHydrator (keeps localStorage intact).
  if (session?.user && legacyImportStatus === 'error') {
    return null;
  }

  // Treat `anonymous` as loading when a session exists: ProgressHydrator's
  // effect hasn't called beginServerHydration yet on this paint.
  // Also wait through legacy import before mounting learner pages / checkIn.
  if (
    isPending ||
    (session?.user &&
      (syncStatus === 'loading' ||
        syncStatus === 'anonymous' ||
        legacyImportStatus === 'pending' ||
        legacyImportStatus === 'none'))
  ) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <TaxiwayLoader label="LOADING FLIGHT PLAN" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (syncStatus === 'error') {
    const onRetry = async () => {
      if (retrying) return;
      setRetrying(true);
      try {
        await retryProgressHydration(session.user.id);
      } finally {
        setRetrying(false);
      }
    };

    return (
      <section className="bg-paper">
        <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-start justify-center px-6 py-24">
          <p className="label text-signal-600">HOLD SHORT</p>
          <h1 className="h1 mt-4 text-ink-900">Couldn’t load your progress</h1>
          <p className="body mt-4 text-ink-700">
            The tower didn’t return your flight plan. Check your connection, then try again.
          </p>
          <button
            type="button"
            className="btn-primary mt-8 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRetry}
            disabled={retrying}
            aria-busy={retrying}
          >
            {retrying ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      </section>
    );
  }

  return <Outlet />;
}
