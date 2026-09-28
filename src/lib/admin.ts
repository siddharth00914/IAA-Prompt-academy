import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { authClient } from '@/lib/auth-client';
import { db } from '@/lib/firebase';

export type UserProfile = {
  email: string | null;
  name: string | null;
  role: string | null;
  active: boolean;
};

export type AdminAccessStatus = 'loading' | 'authorized' | 'forbidden' | 'error';

export const IT_ADMIN_LABEL = 'IT Admin';

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function displayRoleLabel(role: string | null | undefined): string {
  if (isAdminRole(role)) return IT_ADMIN_LABEL;
  return role?.trim() || '—';
}

type AdminAccess = {
  status: AdminAccessStatus;
  profile: UserProfile | null;
};

type StoredAdminAccess = AdminAccess & {
  uid: string | null;
};

function normalizeProfile(data: Record<string, unknown>): UserProfile {
  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  const legacyName = typeof data.name === 'string' ? data.name.trim() : '';

  return {
    email: typeof data.email === 'string' ? data.email : null,
    name: combined || displayName || legacyName || null,
    role: typeof data.role === 'string' ? data.role : null,
    active: data.active === true || data.status === 'active',
  };
}

/**
 * Watches the signed-in user's Firestore profile at users/{uid}.
 * UI authorization is granted only when role=admin and active=true.
 * Firestore Security Rules remain the authoritative data-access boundary.
 */
export function useAdminAccess(): AdminAccess {
  const { data: session, isPending } = authClient.useSession();
  const uid = session?.user.id ?? null;
  const [access, setAccess] = useState<StoredAdminAccess>({
    uid: null,
    status: 'loading',
    profile: null,
  });

  useEffect(() => {
    if (!uid) return;
    const profileRef = doc(db, 'users', uid);

    return onSnapshot(
      profileRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setAccess({ uid, status: 'forbidden', profile: null });
          return;
        }

        const profile = normalizeProfile(snapshot.data());
        setAccess({
          uid,
          status: isAdminRole(profile.role) && profile.active ? 'authorized' : 'forbidden',
          profile,
        });
      },
      () => setAccess({ uid, status: 'error', profile: null }),
    );
  }, [uid]);

  if (isPending || (uid && access.uid !== uid)) {
    return { status: 'loading', profile: null };
  }

  if (!uid) {
    return { status: 'forbidden', profile: null };
  }

  return { status: access.status, profile: access.profile };
}
