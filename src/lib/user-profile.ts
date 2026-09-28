import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';

export type LearnerProfileInput = {
  firstName?: string;
  lastName?: string;
};

function splitDisplayName(value: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Creates users/{uid} for a new learner if it does not already exist.
 * Existing admin/learner profiles are left untouched. Role is always learner
 * and status is always active on create — Firestore rules reject anything else.
 */
export async function ensureLearnerProfile(
  user: User,
  input?: LearnerProfileInput,
): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const email = user.email?.trim() || '';
  const fromAuth = splitDisplayName(user.displayName);
  const firstName = input?.firstName?.trim() || fromAuth.firstName || email.split('@')[0] || '';
  const lastName = input?.lastName?.trim() || fromAuth.lastName || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();

  if (!firstName || !email || !displayName) {
    throw new Error('Name and email are required to create a learner profile');
  }

  await setDoc(ref, {
    firstName,
    lastName,
    displayName,
    email,
    role: 'learner',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
