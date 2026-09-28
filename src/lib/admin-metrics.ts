import { computeJourney } from '@/components/dashboard/journey-data';
import { buildLearnerDetail, sanitizeProgress } from '@/lib/admin-progress';
import type { MilesEvent, Progress } from '@/lib/progress';

export type LearningStatus = 'not-started' | 'in-progress' | 'certified';

export const LEARNING_STATUS_LABEL: Record<LearningStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  certified: 'Certified',
};

export type WeekBucket = {
  weekStartIso: string;
  label: string;
  miles: number;
};

export type StatusBreakdown = {
  status: LearningStatus;
  label: string;
  count: number;
  pct: number;
};

export type DashboardKpis = {
  totalLearners: number;
  averageProgress: number;
  totalLearnerMiles: number;
  totalLearningSeconds: number;
};

export type RecentActivityItem = {
  id: string;
  learnerName: string;
  label: string;
  amount: number;
  at: string;
};

export type CsvExportRow = {
  name: string;
  email: string;
  status: string;
  currentGate: string;
  progressPct: number;
  miles: number;
  learningTimeSeconds: number | '';
  learningTimeFormatted: string;
  lastActive: string;
  certificationDate: string;
};

/** Classify a learner from sanitized progress. */
export function classifyLearningStatus(progress: Progress): LearningStatus {
  if (progress.certifiedAt != null && progress.certifiedAt.trim() !== '') {
    return 'certified';
  }
  try {
    const journey = computeJourney(progress);
    return journey.started ? 'in-progress' : 'not-started';
  } catch {
    return 'not-started';
  }
}

export function formatLearningTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return 'Not tracked yet';
  }
  const seconds = Math.floor(totalSeconds);
  if (seconds < 60) return `${seconds}s`;
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatLastActive(iso: string | null | undefined): string {
  if (!iso) return 'Not tracked yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not tracked yet';
  return date.toLocaleString();
}

export function computeDashboardKpis(
  rows: Array<{
    coursePct: number;
    miles: number;
    totalActiveSeconds: number | null;
  }>,
): DashboardKpis {
  const totalLearners = rows.length;
  const totalLearnerMiles = rows.reduce((sum, row) => sum + Math.max(0, row.miles), 0);
  const averageProgress =
    totalLearners === 0
      ? 0
      : Math.round(rows.reduce((sum, row) => sum + Math.max(0, row.coursePct), 0) / totalLearners);
  const totalLearningSeconds = rows.reduce(
    (sum, row) => sum + (row.totalActiveSeconds != null ? Math.max(0, row.totalActiveSeconds) : 0),
    0,
  );
  return { totalLearners, averageProgress, totalLearnerMiles, totalLearningSeconds };
}

export function computeStatusBreakdown(
  rows: Array<{ learningStatus: LearningStatus }>,
): StatusBreakdown[] {
  const counts: Record<LearningStatus, number> = {
    'not-started': 0,
    'in-progress': 0,
    certified: 0,
  };
  for (const row of rows) {
    counts[row.learningStatus] += 1;
  }
  const total = rows.length;
  return (Object.keys(counts) as LearningStatus[]).map((status) => ({
    status,
    label: LEARNING_STATUS_LABEL[status],
    count: counts[status],
    pct: total === 0 ? 0 : Math.round((counts[status] / total) * 100),
  }));
}

function startOfUtcWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 Sun
  const diff = (day + 6) % 7; // Monday-start weeks
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function weekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Aggregate ledger miles into the most recent six Monday-start weeks.
 * Dedupes by event id across all learners.
 */
export function aggregateMilesByWeek(
  ledgers: Array<{ uid: string; events: MilesEvent[] }>,
  now = new Date(),
  weekCount = 6,
): WeekBucket[] {
  const seen = new Set<string>();
  const totals = new Map<string, number>();

  const thisWeek = startOfUtcWeek(now);
  const weekStarts: Date[] = [];
  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const start = new Date(thisWeek);
    start.setUTCDate(thisWeek.getUTCDate() - i * 7);
    weekStarts.push(start);
    totals.set(start.toISOString(), 0);
  }
  const oldest = weekStarts[0]?.getTime() ?? 0;

  for (const { uid, events } of ledgers) {
    for (const event of events) {
      const dedupeKey = `${uid}:${event.id}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const t = Date.parse(event.at);
      if (Number.isNaN(t) || t < oldest) continue;
      const weekStart = startOfUtcWeek(new Date(t));
      const key = weekStart.toISOString();
      if (!totals.has(key)) continue;
      const amount = Number.isFinite(event.amount) ? event.amount : 0;
      totals.set(key, (totals.get(key) ?? 0) + amount);
    }
  }

  return weekStarts.map((start) => ({
    weekStartIso: start.toISOString(),
    label: weekLabel(start),
    miles: totals.get(start.toISOString()) ?? 0,
  }));
}

export function collectRecentActivity(
  rows: Array<{ name: string | null; email: string | null; uid: string; ledger: MilesEvent[] }>,
  limit = 5,
): RecentActivityItem[] {
  const seen = new Set<string>();
  const items: RecentActivityItem[] = [];
  for (const row of rows) {
    const learnerName = row.name?.trim() || row.email?.trim() || 'Unnamed crew';
    for (const event of row.ledger) {
      const id = `${row.uid}:${event.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({
        id,
        learnerName,
        label: event.label,
        amount: event.amount,
        at: event.at,
      });
    }
  }
  return items
    .filter((item) => !Number.isNaN(Date.parse(item.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}

export type RosterSortKey =
  | 'name-asc'
  | 'progress-desc'
  | 'progress-asc'
  | 'miles-desc'
  | 'learning-time-desc'
  | 'last-active-desc';

export function filterAndSortRoster<
  T extends {
    name: string | null;
    email: string | null;
    uid: string;
    learningStatus: LearningStatus;
    currentGateId: string | null;
    coursePct: number;
    miles: number;
    totalActiveSeconds: number | null;
    lastActiveAt: string | null;
  },
>(
  rows: T[],
  input: {
    query: string;
    status: LearningStatus | 'all';
    gateId: string | 'all';
    sort: RosterSortKey;
  },
): T[] {
  const needle = input.query.trim().toLowerCase();
  let next = rows.filter((row) => {
    if (input.status !== 'all' && row.learningStatus !== input.status) return false;
    if (input.gateId !== 'all' && row.currentGateId !== input.gateId) return false;
    if (!needle) return true;
    const haystack = [row.name, row.email, row.uid]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });

  const nameOf = (row: T) => (row.name || row.email || row.uid).toLocaleLowerCase();

  next = [...next].sort((a, b) => {
    switch (input.sort) {
      case 'progress-desc':
        return b.coursePct - a.coursePct || nameOf(a).localeCompare(nameOf(b));
      case 'progress-asc':
        return a.coursePct - b.coursePct || nameOf(a).localeCompare(nameOf(b));
      case 'miles-desc':
        return b.miles - a.miles || nameOf(a).localeCompare(nameOf(b));
      case 'learning-time-desc': {
        const aSec = a.totalActiveSeconds ?? -1;
        const bSec = b.totalActiveSeconds ?? -1;
        return bSec - aSec || nameOf(a).localeCompare(nameOf(b));
      }
      case 'last-active-desc': {
        const aT = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
        const bT = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
        return bT - aT || nameOf(a).localeCompare(nameOf(b));
      }
      case 'name-asc':
      default:
        return nameOf(a).localeCompare(nameOf(b));
    }
  });

  return next;
}

/** RFC4180-ish CSV cell escaping. */
export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildRosterCsv(rows: CsvExportRow[]): string {
  const headers = [
    'Name',
    'Email',
    'Status',
    'Current gate',
    'Progress percentage',
    'Miles',
    'Learning time (seconds)',
    'Learning time',
    'Last active',
    'Certification date',
  ];
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.name,
        row.email,
        row.status,
        row.currentGate,
        row.progressPct,
        row.miles,
        row.learningTimeSeconds,
        row.learningTimeFormatted,
        row.lastActive,
        row.certificationDate,
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

export function learnerInitials(name: string | null, email: string | null): string {
  const source = (name?.trim() || email?.trim() || '?').replace(/@.*/, '');
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || '?';
}

/** Derive roster display fields from a sanitized progress blob. */
export function deriveProgressFields(progress: Progress) {
  const detail = buildLearnerDetail(progress);
  const journey = (() => {
    try {
      return computeJourney(progress);
    } catch {
      return null;
    }
  })();
  const gate = journey?.gates[journey.posGate] ?? journey?.gates[0] ?? null;
  return {
    detail,
    learningStatus: classifyLearningStatus(progress),
    certifiedAt: progress.certifiedAt,
    currentGateId: gate?.id ?? null,
    currentGateLabel: detail.currentGate,
    masteredCount: journey?.masteredCount ?? 0,
    coursePct: detail.coursePct,
    miles: detail.miles,
    ledger: progress.ledger,
  };
}

export function safeSanitizeProgress(raw: unknown): Progress {
  try {
    return sanitizeProgress(raw);
  } catch (error) {
    console.error('Failed to sanitize learner progress', error);
    return sanitizeProgress(undefined);
  }
}
