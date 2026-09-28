import {
  doc,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore';
import { sanitizeProgress } from '@/lib/admin-progress';
import { db } from '@/lib/firebase';
import type { Progress } from '@/lib/progress';

export type ProgressHistorySource = 'baseline' | 'save' | 'legacy-import';

export type ProgressHistoryRevision = {
  uid: string;
  revision: number;
  state: Progress;
  changedAt: ReturnType<typeof serverTimestamp> | unknown;
  source: ProgressHistorySource;
  isBaseline: boolean;
};

export type ProgressHistoryMeta = {
  uid: string;
  baselineRevision: number;
  createdAt: ReturnType<typeof serverTimestamp> | unknown;
  updatedAt: ReturnType<typeof serverTimestamp> | unknown;
};

export function historyRevisionId(revision: number): string {
  return `r${revision}`;
}

export function sanitizeProgressState(state: Progress): Progress {
  return sanitizeProgress({ state });
}

export function historyMetaRef(uid: string): DocumentReference {
  return doc(db, 'progressHistory', uid);
}

export function historyRevisionRef(uid: string, revision: number): DocumentReference {
  return doc(db, 'progressHistory', uid, 'revisions', historyRevisionId(revision));
}

/**
 * Write-only history snapshot. Caller must pre-read the revision doc and skip
 * when it already exists (Firestore requires all reads before writes).
 */
export function setProgressHistoryInTransaction(
  tx: Transaction,
  input: {
    uid: string;
    revision: number;
    state: Progress;
    source: ProgressHistorySource;
    isBaseline: boolean;
  },
): void {
  const ref = historyRevisionRef(input.uid, input.revision);
  const payload: ProgressHistoryRevision = {
    uid: input.uid,
    revision: input.revision,
    state: sanitizeProgressState(input.state),
    changedAt: serverTimestamp(),
    source: input.source,
    isBaseline: input.isBaseline,
  };
  tx.set(ref, payload);
}

/**
 * Creates a one-time baseline for the learner's current server state.
 * Does not invent older history. Failures are logged; callers may ignore.
 */
export async function ensureProgressHistoryBaseline(
  uid: string,
  state: Progress,
  revision: number,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const metaRef = historyMetaRef(uid);
    const revRef = historyRevisionRef(uid, revision);
    const metaSnap = await tx.get(metaRef);
    const revSnap = await tx.get(revRef);

    if (metaSnap.exists()) {
      const data = metaSnap.data() as Partial<ProgressHistoryMeta>;
      if (typeof data.baselineRevision === 'number') return;
    }

    tx.set(metaRef, {
      uid,
      baselineRevision: revision,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } satisfies ProgressHistoryMeta);

    if (!revSnap.exists()) {
      setProgressHistoryInTransaction(tx, {
        uid,
        revision,
        state,
        source: 'baseline',
        isBaseline: true,
      });
    }
  });
}
