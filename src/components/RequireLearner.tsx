import { Navigate, Outlet } from 'react-router';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { useAdminAccess } from '@/lib/admin';
import { useAdminViewMode } from '@/lib/admin-view';
import { authClient } from '@/lib/auth-client';

/** Keeps IT Admin accounts off learner routes unless they chose Academy view. */
export default function RequireLearner() {
  const { isSigningOut } = authClient.useSession();
  const { status } = useAdminAccess();
  const { isLearnerView } = useAdminViewMode();

  if (isSigningOut) {
    return <Outlet />;
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <TaxiwayLoader label="VERIFYING CLEARANCE" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <section className="bg-paper">
        <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-start justify-center px-6 py-24">
          <p className="label text-signal-600">HOLD SHORT</p>
          <h1 className="h1 mt-4 text-ink-900">Couldn’t verify clearance</h1>
          <p className="body mt-4 text-ink-700">
            The tower didn’t confirm whether this account is an IT Admin. Refresh, then try again.
          </p>
        </div>
      </section>
    );
  }

  if (status === 'authorized' && !isLearnerView) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
