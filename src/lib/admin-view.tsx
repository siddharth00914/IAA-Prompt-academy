import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { useAdminAccess } from '@/lib/admin';
import { authClient } from '@/lib/auth-client';

export type AdminViewMode = 'admin' | 'learner';

const STORAGE_PREFIX = 'iaa-admin-view:';

type AdminViewContextValue = {
  mode: AdminViewMode;
  setMode: (next: AdminViewMode) => void;
  isAuthorizedAdmin: boolean;
  /** Admin is browsing the learner academy experience. */
  isLearnerView: boolean;
  /** Admin is on the admin-facing surface (default). */
  isAdminView: boolean;
};

const AdminViewContext = createContext<AdminViewContextValue | null>(null);

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

function readStoredMode(uid: string | null): AdminViewMode {
  if (!uid || typeof window === 'undefined') return 'admin';
  try {
    return localStorage.getItem(storageKey(uid)) === 'learner' ? 'learner' : 'admin';
  } catch {
    return 'admin';
  }
}

function writeStoredMode(uid: string | null, mode: AdminViewMode): void {
  if (!uid || typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(uid), mode);
  } catch {
    // Ignore quota / private-mode failures; in-memory mode still works.
  }
}

/**
 * Shared IT Admin view preference (Academy ↔ Admin Dashboard).
 * Mount once under the router (Layout) so Navbar, guards, and hydrator stay in sync.
 */
export function AdminViewProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const { status } = useAdminAccess();
  const uid = session?.user?.id ?? null;
  const [modeByUid, setModeByUid] = useState<Record<string, AdminViewMode>>({});

  const mode: AdminViewMode = uid
    ? (modeByUid[uid] ?? readStoredMode(uid))
    : 'admin';

  useEffect(() => {
    if (!uid) return;
    setModeByUid((prev) => {
      if (prev[uid] !== undefined) return prev;
      return { ...prev, [uid]: readStoredMode(uid) };
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey(uid)) return;
      const next: AdminViewMode = event.newValue === 'learner' ? 'learner' : 'admin';
      setModeByUid((prev) => ({ ...prev, [uid]: next }));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [uid]);

  const setMode = useCallback(
    (next: AdminViewMode) => {
      if (uid) {
        setModeByUid((prev) => ({ ...prev, [uid]: next }));
        writeStoredMode(uid, next);
      }
    },
    [uid],
  );

  const isAuthorizedAdmin = status === 'authorized';
  const effectiveMode: AdminViewMode = isAuthorizedAdmin ? mode : 'admin';

  const value = useMemo<AdminViewContextValue>(
    () => ({
      mode: effectiveMode,
      setMode,
      isAuthorizedAdmin,
      isLearnerView: isAuthorizedAdmin && effectiveMode === 'learner',
      isAdminView: isAuthorizedAdmin && effectiveMode === 'admin',
    }),
    [effectiveMode, setMode, isAuthorizedAdmin],
  );

  return <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>;
}

function useAdminViewContext(): AdminViewContextValue {
  const ctx = useContext(AdminViewContext);
  if (!ctx) {
    throw new Error('useAdminViewMode must be used within AdminViewProvider');
  }
  return ctx;
}

/** Lets authorized IT Admins preview the learner academy without changing role. */
export function useAdminViewMode(): AdminViewContextValue {
  return useAdminViewContext();
}

/** Navigate helpers that flip view mode before routing. */
export function useAdminViewSwitcher() {
  const navigate = useNavigate();
  const { setMode, isAuthorizedAdmin, isLearnerView, isAdminView } = useAdminViewContext();

  const goLearnerAcademy = useCallback(() => {
    setMode('learner');
    navigate('/journey');
  }, [navigate, setMode]);

  const goAdminDashboard = useCallback(() => {
    setMode('admin');
    navigate('/admin');
  }, [navigate, setMode]);

  return {
    isAuthorizedAdmin,
    isLearnerView,
    isAdminView,
    goLearnerAcademy,
    goAdminDashboard,
  };
}
