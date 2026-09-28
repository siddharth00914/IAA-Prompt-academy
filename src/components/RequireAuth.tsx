import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { useAdminAccess } from '@/lib/admin';
import { useAdminViewMode } from '@/lib/admin-view';
import { authClient } from '@/lib/auth-client';
import { retryProgressHydration } from '@/lib/progress-api';
import { useLegacyImportStatus, useProgressSyncStatus } from '@/lib/progress';

/**
 * Guards authenticated routes. Unauthenticated visitors are sent to /login.
 * Learners wait for progress hydration. IT Admins skip that wait on the Admin
 * Dashboard; in Academy view they hydrate like learners.
 */
export default function RequireAuth() {
  const location = useLocation();
  const { data: session, isPending, isSigningOut } = authClient.useSession();
  const { status: adminStatus } = useAdminAccess();
  const { isLearnerView } = useAdminViewMode();
  const syncStatus = useProgressSyncStatus();
  const legacyImportStatus = useLegacyImportStatus();
  const [retrying, setRetrying] = useState(false);
  const isItAdmin = adminStatus === 'authorized';
  const skipLearnerProgress = isItAdmin && !isLearnerView;

  if (isSigningOut) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <TaxiwayLoader label="SIGNING OFF" />
      </div>
    );
  }

  if (session?.user && !skipLearnerProgress && legacyImportStatus === 'error') {
    return null;
  }

  if (
    isPending ||
    (session?.user && adminStatus === 'loading') ||
    (session?.user &&
      !skipLearnerProgress &&
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

  if (skipLearnerProgress) {
    return <Outlet />;
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
