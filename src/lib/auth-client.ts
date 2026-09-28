import { useSyncExternalStore } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureLearnerProfile } from '@/lib/user-profile';

type Session = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type AuthSnapshot = {
  data: Session | null;
  isPending: boolean;
  isSigningOut: boolean;
};

type AuthResult = {
  error: { message: string } | null;
};

const SIGN_IN_ERROR = 'Invalid credentials';
const SIGN_UP_ERROR = 'Unable to create that account. Check your details, then try again.';

let snapshot: AuthSnapshot = {
  data: null,
  isPending: true,
  isSigningOut: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function sessionFromUser(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
}): Session {
  return {
    user: {
      id: user.uid,
      name: user.displayName,
      email: user.email,
    },
  };
}

onAuthStateChanged(auth, (user) => {
  snapshot = {
    data: user ? sessionFromUser(user) : null,
    isPending: false,
    isSigningOut: snapshot.isSigningOut,
  };

  notify();
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function authErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof FirebaseError)) return fallback;
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid work email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use 8+ characters with upper, lower, number, and special character.';
    case 'auth/operation-not-allowed':
      return 'Account creation is not enabled for this project yet.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection, then try again.';
    default:
      return fallback;
  }
}

async function bootstrapLearnerProfile(
  user: Parameters<typeof ensureLearnerProfile>[0],
  input?: { firstName?: string; lastName?: string },
): Promise<void> {
  try {
    await ensureLearnerProfile(user, input);
  } catch (firstError) {
    try {
      await ensureLearnerProfile(user, input);
    } catch (retryError) {
      console.error('Failed to write learner profile', retryError ?? firstError);
    }
  }
}

export const authClient = {
  useSession() {
    return useSyncExternalStore(
      subscribe,
      () => snapshot,
      () => snapshot,
    );
  },

  signIn: {
    async email({ email, password }: { email: string; password: string }): Promise<AuthResult> {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Retry profile create if Auth exists but Firestore profile was never written.
        await bootstrapLearnerProfile(credential.user);
        return { error: null };
      } catch {
        return { error: { message: SIGN_IN_ERROR } };
      }
    },
  },

  signUp: {
    async email({
      firstName,
      lastName,
      email,
      password,
    }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }): Promise<AuthResult> {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const displayName = `${trimmedFirst} ${trimmedLast}`.trim();
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        snapshot = {
          data: sessionFromUser({
            uid: credential.user.uid,
            displayName: displayName || credential.user.displayName,
            email: credential.user.email,
          }),
          isPending: false,
          isSigningOut: false,
        };
        notify();
        await bootstrapLearnerProfile(credential.user, {
          firstName: trimmedFirst,
          lastName: trimmedLast,
        });
        return { error: null };
      } catch (error) {
        return { error: { message: authErrorMessage(error, SIGN_UP_ERROR) } };
      }
    },
  },

  async signOut() {
    snapshot = { ...snapshot, isSigningOut: true };
    notify();
    try {
      await firebaseSignOut(auth);
    } finally {
      snapshot = { ...snapshot, isSigningOut: false };
      notify();
    }
  },
};
