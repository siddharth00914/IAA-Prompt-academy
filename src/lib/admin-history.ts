import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { sanitizeProgress } from '@/lib/admin-progress';
import { db } from '@/lib/firebase';
import type { Progress } from '@/lib/progress';
import { computeJourney } from '@/components/dashboard/journey-data';

export type ProgressHistorySource = 'baseline' | 'save' | 'legacy-import' | string;

export type ProgressHistoryRow = {
  id: string;
  revision: number;
  changedAt: string | null;
  source: ProgressHistorySource;
  isBaseline: boolean;
  coursePct: number;
  miles: number;
  certified: boolean;
};

export type ProgressHistoryPage = {
  rows: ProgressHistoryRow[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

const PAGE_SIZE = 25;

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = (value as { seconds: number }).seconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return null;
}

function mapHistoryDoc(docSnap: QueryDocumentSnapshot<DocumentData>): ProgressHistoryRow | null {
  try {
    const data = docSnap.data();
    return mapProgressHistoryData(docSnap.id, data);
  } catch (error) {
    console.error('Failed to map progress history revision', error);
    return null;
  }
}

/** Pure mapper for tests and Firestore docs. */
export function mapProgressHistoryData(
  id: string,
  data: Record<string, unknown>,
): ProgressHistoryRow | null {
  try {
    const revision = typeof data.revision === 'number' ? data.revision : Number(data.revision);
    if (!Number.isFinite(revision)) return null;
    const progress: Progress = sanitizeProgress({ state: data.state });
    let coursePct = 0;
    try {
      coursePct = Math.round(computeJourney(progress).coursePct * 100);
    } catch {
      coursePct = 0;
    }
    return {
      id,
      revision,
      changedAt: asIsoTimestamp(data.changedAt),
      source: typeof data.source === 'string' ? data.source : 'save',
      isBaseline: data.isBaseline === true,
      coursePct,
      miles: progress.miles,
      certified: progress.certifiedAt != null,
    };
  } catch (error) {
    console.error('Failed to map progress history revision', error);
    return null;
  }
}

/**
 * Pure pagination helper — chunks already-sorted revisions into pages of 25.
 */
export function paginateHistoryRows<T>(rows: T[], pageSize = PAGE_SIZE): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += pageSize) {
    pages.push(rows.slice(i, i + pageSize));
  }
  return pages;
}

/**
 * Loads a page of progress-history revisions for one learner (newest first).
 * Does not run during initial dashboard load — only when a detail dialog opens.
 */
export async function fetchProgressHistoryPage(
  uid: string,
  cursor: QueryDocumentSnapshot<DocumentData> | null = null,
): Promise<ProgressHistoryPage> {
  const base = collection(db, 'progressHistory', uid, 'revisions');
  const q = cursor
    ? query(base, orderBy('revision', 'desc'), startAfter(cursor), limit(PAGE_SIZE))
    : query(base, orderBy('revision', 'desc'), limit(PAGE_SIZE));

  const snap = await getDocs(q);
  const rows = snap.docs
    .map(mapHistoryDoc)
    .filter((row): row is ProgressHistoryRow => row !== null);

  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return {
    rows,
    cursor: lastDoc,
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

export { PAGE_SIZE as PROGRESS_HISTORY_PAGE_SIZE };
