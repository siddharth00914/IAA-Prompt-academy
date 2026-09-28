import { useCallback, useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { collection, getDocs } from 'firebase/firestore';
import type { LearnerDetail } from '@/lib/admin-progress';
import {
  deriveProgressFields,
  safeSanitizeProgress,
  type LearningStatus,
} from '@/lib/admin-metrics';
import { isAdminRole } from '@/lib/admin';
import { db } from '@/lib/firebase';
import type { MilesEvent } from '@/lib/progress';

export type RosterRow = {
  uid: string;
  name: string | null;
  email: string | null;
  role: string | null;
  active: boolean;
  coursePct: number;
  miles: number;
  detail: LearnerDetail;
  learningStatus: LearningStatus;
  certifiedAt: string | null;
  createdAt: string | null;
  totalActiveSeconds: number | null;
  lastActiveAt: string | null;
  currentGateId: string | null;
  currentGateLabel: string;
  masteredCount: number;
  ledger: MilesEvent[];
};

export type RosterStatus = 'loading' | 'ready' | 'empty' | 'permission-denied' | 'error';

type RosterState = {
  status: RosterStatus;
  rows: RosterRow[];
};

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === 'permission-denied';
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

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

function resolveRosterName(data: Record<string, unknown>): string | null {
  const firstName = asString(data.firstName)?.trim() || '';
  const lastName = asString(data.lastName)?.trim() || '';
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (combined) return combined;

  const displayName = asString(data.displayName)?.trim();
  if (displayName) return displayName;

  const legacyName = asString(data.name)?.trim();
  return legacyName || null;
}

/** Exported for unit tests — legacy name resolution order. */
export function resolveLearnerDisplayName(data: Record<string, unknown>): string | null {
  return resolveRosterName(data);
}

function resolveRosterActive(data: Record<string, unknown>): boolean {
  if (data.status === 'active') return true;
  if (data.status === 'inactive') return false;
  return data.active === true;
}

function compareRows(a: RosterRow, b: RosterRow): number {
  const aLabel = (a.name || a.email || a.uid).toLocaleLowerCase();
  const bLabel = (b.name || b.email || b.uid).toLocaleLowerCase();
  return aLabel.localeCompare(bLabel);
}

export function rosterDisplayName(row: Pick<RosterRow, 'name' | 'email'>): string {
  return row.name?.trim() || row.email?.trim() || 'Unnamed crew';
}

type ActivitySummary = {
  totalActiveSeconds: number | null;
  lastActiveAt: string | null;
};

function parseActivity(data: Record<string, unknown> | undefined): ActivitySummary {
  if (!data) return { totalActiveSeconds: null, lastActiveAt: null };
  const seconds = data.totalActiveSeconds;
  return {
    totalActiveSeconds:
      typeof seconds === 'number' && Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : null,
    lastActiveAt: asIsoTimestamp(data.lastActiveAt),
  };
}

export async function fetchAcademyRoster(): Promise<RosterRow[]> {
  const [usersSnap, progressSnap, activitySnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'learnerProgress')),
    getDocs(collection(db, 'learnerActivity')),
  ]);

  const progressByUid = new Map<string, ReturnType<typeof safeSanitizeProgress>>();
  for (const docSnap of progressSnap.docs) {
    progressByUid.set(docSnap.id, safeSanitizeProgress(docSnap.data()));
  }

  const activityByUid = new Map<string, ActivitySummary>();
  for (const docSnap of activitySnap.docs) {
    activityByUid.set(docSnap.id, parseActivity(docSnap.data() as Record<string, unknown>));
  }

  const rows: RosterRow[] = [];
  for (const docSnap of usersSnap.docs) {
    try {
      const data = docSnap.data() as Record<string, unknown>;
      const role = asString(data.role);
      if (isAdminRole(role)) continue;

      const progress = progressByUid.get(docSnap.id) ?? safeSanitizeProgress(undefined);
      const derived = deriveProgressFields(progress);
      const activity = activityByUid.get(docSnap.id) ?? {
        totalActiveSeconds: null,
        lastActiveAt: null,
      };

      rows.push({
        uid: docSnap.id,
        name: resolveRosterName(data),
        email: asString(data.email),
        role,
        active: resolveRosterActive(data),
        coursePct: derived.coursePct,
        miles: derived.miles,
        detail: derived.detail,
        learningStatus: derived.learningStatus,
        certifiedAt: derived.certifiedAt,
        createdAt: asIsoTimestamp(data.createdAt),
        totalActiveSeconds: activity.totalActiveSeconds,
        lastActiveAt: activity.lastActiveAt,
        currentGateId: derived.currentGateId,
        currentGateLabel: derived.currentGateLabel,
        masteredCount: derived.masteredCount,
        ledger: derived.ledger,
      });
    } catch (error) {
      console.error('Failed to map learner roster row', docSnap.id, error);
    }
  }

  return rows.sort(compareRows);
}

export function useAcademyRoster(): RosterState & { retry: () => void } {
  const [state, setState] = useState<RosterState>({ status: 'loading', rows: [] });
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetchAcademyRoster()
      .then((rows) => {
        if (cancelled) return;
        setState({ status: rows.length === 0 ? 'empty' : 'ready', rows });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: isPermissionDenied(error) ? 'permission-denied' : 'error',
          rows: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [generation]);

  const retry = useCallback(() => {
    setState({ status: 'loading', rows: [] });
    setGeneration((n) => n + 1);
  }, []);

  return { ...state, retry };
}
