import {
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type SessionStatus = 'active' | 'ended';

function activityRef(uid: string): DocumentReference {
  return doc(db, 'learnerActivity', uid);
}

function sessionRef(uid: string, sessionId: string): DocumentReference {
  return doc(db, 'learnerActivity', uid, 'sessions', sessionId);
}

function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Ensure the summary doc exists without clobbering an existing total.
 */
export async function ensureActivitySummary(uid: string): Promise<void> {
  const ref = activityRef(uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return;
    tx.set(ref, {
      uid,
      totalActiveSeconds: 0,
      lastActiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function createActivitySession(input: {
  uid: string;
  currentRoute: string;
  gateId: string | null;
}): Promise<string> {
  await ensureActivitySummary(input.uid);
  const sessionId = newSessionId();
  await setDoc(sessionRef(input.uid, sessionId), {
    uid: input.uid,
    startedAt: serverTimestamp(),
    lastHeartbeatAt: serverTimestamp(),
    endedAt: null,
    activeSeconds: 0,
    status: 'active',
    currentRoute: input.currentRoute,
    gateId: input.gateId,
  });
  return sessionId;
}

export async function heartbeatActivitySession(input: {
  uid: string;
  sessionId: string;
  deltaSeconds: number;
  currentRoute: string;
  gateId: string | null;
}): Promise<void> {
  const delta = Math.max(0, Math.floor(input.deltaSeconds));
  const sRef = sessionRef(input.uid, input.sessionId);
  const aRef = activityRef(input.uid);

  await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sRef);
    const summarySnap = await tx.get(aRef);
    if (!sessionSnap.exists() || !summarySnap.exists()) return;
    const session = sessionSnap.data();
    if (session.status === 'ended') return;

    if (delta > 0) {
      tx.update(sRef, {
        activeSeconds: increment(delta),
        lastHeartbeatAt: serverTimestamp(),
        currentRoute: input.currentRoute,
        gateId: input.gateId,
        status: 'active',
        endedAt: null,
      });
      tx.update(aRef, {
        totalActiveSeconds: increment(delta),
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    tx.update(sRef, {
      lastHeartbeatAt: serverTimestamp(),
      currentRoute: input.currentRoute,
      gateId: input.gateId,
      status: 'active',
      endedAt: null,
    });
  });
}

export async function endActivitySession(input: {
  uid: string;
  sessionId: string;
  deltaSeconds?: number;
  currentRoute?: string;
  gateId?: string | null;
}): Promise<void> {
  const delta = Math.max(0, Math.floor(input.deltaSeconds ?? 0));
  const sRef = sessionRef(input.uid, input.sessionId);
  const aRef = activityRef(input.uid);

  await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sRef);
    const summarySnap = await tx.get(aRef);
    if (!sessionSnap.exists()) return;
    const session = sessionSnap.data();
    if (session.status === 'ended') return;

    const sessionPatch: Record<string, unknown> = {
      status: 'ended',
      endedAt: serverTimestamp(),
      lastHeartbeatAt: serverTimestamp(),
    };
    if (input.currentRoute !== undefined) sessionPatch.currentRoute = input.currentRoute;
    if (input.gateId !== undefined) sessionPatch.gateId = input.gateId;
    if (delta > 0) sessionPatch.activeSeconds = increment(delta);

    tx.update(sRef, sessionPatch);

    if (summarySnap.exists()) {
      if (delta > 0) {
        tx.update(aRef, {
          totalActiveSeconds: increment(delta),
          lastActiveAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.update(aRef, {
          updatedAt: serverTimestamp(),
        });
      }
    }
  });
}

/** Test/debug helper. */
export async function peekActivitySummary(uid: string) {
  return getDoc(activityRef(uid));
}
