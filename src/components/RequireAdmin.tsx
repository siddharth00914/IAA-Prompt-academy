import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { useAdminAccess } from '@/lib/admin';
import { useAdminViewMode } from '@/lib/admin-view';
import { authClient } from '@/lib/auth-client';

/** Allows only active Firestore profiles with role=admin into /admin. */
export default function RequireAdmin() {
  const { isSigningOut } = authClient.useSession();
  const { status } = useAdminAccess();
  const { setMode } = useAdminViewMode();

  useEffect(() => {
    if (status === 'authorized') {
      setMode('admin');
    }
  }, [status, setMode]);

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

  if (status !== 'authorized') {
    return <Navigate to="/journey" replace />;
  }

  return <Outlet />;
}
