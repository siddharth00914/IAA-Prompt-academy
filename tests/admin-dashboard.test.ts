import { describe, expect, it } from 'vitest';
import { isAdminRole } from '@/lib/admin';
import {
  PROGRESS_HISTORY_PAGE_SIZE,
  mapProgressHistoryData,
  paginateHistoryRows,
} from '@/lib/admin-history';
import {
  aggregateMilesByWeek,
  buildRosterCsv,
  classifyLearningStatus,
  collectRecentActivity,
  computeDashboardKpis,
  computeStatusBreakdown,
  escapeCsvCell,
  filterAndSortRoster,
  formatLastActive,
  formatLearningTime,
  learnerInitials,
  safeSanitizeProgress,
} from '@/lib/admin-metrics';
import { resolveLearnerDisplayName } from '@/lib/admin-roster';
import type { MilesEvent, Progress } from '@/lib/progress';

function baseProgress(overrides: Partial<Progress> = {}): Progress {
  return safeSanitizeProgress({
    state: {
      v: 1,
      gates: {},
      miles: 0,
      wings: [],
      lab: {},
      pledgeSigned: false,
      certifiedAt: null,
      ledger: [],
      ...overrides,
    },
  });
}

function rosterFixture(
  overrides: Partial<{
    name: string | null;
    email: string | null;
    uid: string;
    learningStatus: 'not-started' | 'in-progress' | 'certified';
    currentGateId: string | null;
    coursePct: number;
    miles: number;
    totalActiveSeconds: number | null;
    lastActiveAt: string | null;
  }> = {},
) {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    uid: 'u1',
    learningStatus: 'in-progress' as const,
    currentGateId: 'g1',
    coursePct: 40,
    miles: 100,
    totalActiveSeconds: 3600,
    lastActiveAt: '2026-09-18T12:00:00.000Z',
    ...overrides,
  };
}

describe('admin metrics — learning time', () => {
  it('formats null/missing activity as not tracked', () => {
    expect(formatLearningTime(null)).toBe('Not tracked yet');
    expect(formatLearningTime(undefined)).toBe('Not tracked yet');
    expect(formatLastActive(null)).toBe('Not tracked yet');
    expect(formatLastActive(undefined)).toBe('Not tracked yet');
  });

  it('formats seconds, minutes, and hours intelligently', () => {
    expect(formatLearningTime(45)).toBe('45s');
    expect(formatLearningTime(120)).toBe('2 min');
    expect(formatLearningTime(3600)).toBe('1h');
    expect(formatLearningTime(3660)).toBe('1h 1m');
  });
});

describe('admin metrics — status classification', () => {
  it('marks certified when certifiedAt is set', () => {
    const progress = baseProgress({ certifiedAt: '2026-09-01T00:00:00.000Z' });
    expect(classifyLearningStatus(progress)).toBe('certified');
  });

  it('marks not-started when journey has not begun', () => {
    expect(classifyLearningStatus(baseProgress())).toBe('not-started');
  });

  it('marks in-progress when started but not certified', () => {
    const progress = baseProgress({
      gates: {
        g0: {
          legs: { '0.1': 'done' },
          checkScore: null,
          checkAttempts: 0,
          mastered: false,
        },
      },
    });
    expect(classifyLearningStatus(progress)).toBe('in-progress');
  });
});

describe('admin metrics — KPIs', () => {
  it('averages coursePct including zero-progress learners', () => {
    const kpis = computeDashboardKpis([
      { coursePct: 100, miles: 10, totalActiveSeconds: 60 },
      { coursePct: 0, miles: 0, totalActiveSeconds: null },
      { coursePct: 50, miles: 5, totalActiveSeconds: 120 },
    ]);
    expect(kpis.totalLearners).toBe(3);
    expect(kpis.averageProgress).toBe(50);
    expect(kpis.totalLearnerMiles).toBe(15);
    expect(kpis.totalLearningSeconds).toBe(180);
  });

  it('returns zeros for empty roster', () => {
    expect(computeDashboardKpis([])).toEqual({
      totalLearners: 0,
      averageProgress: 0,
      totalLearnerMiles: 0,
      totalLearningSeconds: 0,
    });
  });

  it('builds status breakdown with counts and percentages', () => {
    const breakdown = computeStatusBreakdown([
      { learningStatus: 'not-started' },
      { learningStatus: 'in-progress' },
      { learningStatus: 'in-progress' },
      { learningStatus: 'certified' },
    ]);
    expect(breakdown).toEqual([
      { status: 'not-started', label: 'Not Started', count: 1, pct: 25 },
      { status: 'in-progress', label: 'In Progress', count: 2, pct: 50 },
      { status: 'certified', label: 'Certified', count: 1, pct: 25 },
    ]);
  });
});

describe('admin metrics — six-week ledger aggregation', () => {
  it('groups miles by week, dedupes, and keeps six buckets', () => {
    const now = new Date('2026-09-18T15:00:00.000Z'); // Thursday
    const events: MilesEvent[] = [
      {
        id: 'e1',
        at: '2026-09-15T10:00:00.000Z',
        amount: 10,
        label: 'Leg done',
      },
      {
        id: 'e1',
        at: '2026-09-15T10:00:00.000Z',
        amount: 10,
        label: 'Leg done duplicate',
      },
      {
        id: 'e2',
        at: '2026-08-01T10:00:00.000Z',
        amount: 99,
        label: 'Too old',
      },
      {
        id: 'e3',
        at: '2026-09-10T10:00:00.000Z',
        amount: 5,
        label: 'Prior week',
      },
    ];
    const buckets = aggregateMilesByWeek([{ uid: 'u1', events }], now, 6);
    expect(buckets).toHaveLength(6);
    expect(buckets.reduce((sum, b) => sum + b.miles, 0)).toBe(15);
    expect(buckets[buckets.length - 1]?.miles).toBe(10);
  });

  it('handles empty ledgers with zeroed weeks', () => {
    const buckets = aggregateMilesByWeek([], new Date('2026-09-18T00:00:00.000Z'), 6);
    expect(buckets).toHaveLength(6);
    expect(buckets.every((b) => b.miles === 0)).toBe(true);
  });
});

describe('admin metrics — filter, sort, CSV', () => {
  const rows = [
    rosterFixture({
      uid: 'a',
      name: 'Zed',
      email: 'zed@ex.com',
      coursePct: 10,
      miles: 5,
      totalActiveSeconds: 100,
      lastActiveAt: '2026-09-01T00:00:00.000Z',
      learningStatus: 'not-started',
      currentGateId: 'g0',
    }),
    rosterFixture({
      uid: 'b',
      name: 'Ann',
      email: 'ann@ex.com',
      coursePct: 90,
      miles: 50,
      totalActiveSeconds: 9000,
      lastActiveAt: '2026-09-18T00:00:00.000Z',
      learningStatus: 'certified',
      currentGateId: 'g5',
    }),
    rosterFixture({
      uid: 'c',
      name: 'Bea',
      email: 'bea@ex.com',
      coursePct: 40,
      miles: 20,
      totalActiveSeconds: null,
      lastActiveAt: null,
      learningStatus: 'in-progress',
      currentGateId: 'g2',
    }),
  ];

  it('filters by search, status, and gate', () => {
    expect(
      filterAndSortRoster(rows, {
        query: 'ann',
        status: 'all',
        gateId: 'all',
        sort: 'name-asc',
      }).map((r) => r.uid),
    ).toEqual(['b']);

    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'in-progress',
        gateId: 'all',
        sort: 'name-asc',
      }).map((r) => r.uid),
    ).toEqual(['c']);

    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'all',
        gateId: 'g0',
        sort: 'name-asc',
      }).map((r) => r.uid),
    ).toEqual(['a']);
  });

  it('sorts by progress, miles, learning time, and last active', () => {
    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'all',
        gateId: 'all',
        sort: 'progress-desc',
      }).map((r) => r.uid),
    ).toEqual(['b', 'c', 'a']);

    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'all',
        gateId: 'all',
        sort: 'progress-asc',
      }).map((r) => r.uid),
    ).toEqual(['a', 'c', 'b']);

    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'all',
        gateId: 'all',
        sort: 'miles-desc',
      }).map((r) => r.uid),
    ).toEqual(['b', 'c', 'a']);

    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'all',
        gateId: 'all',
        sort: 'learning-time-desc',
      }).map((r) => r.uid),
    ).toEqual(['b', 'a', 'c']);

    expect(
      filterAndSortRoster(rows, {
        query: '',
        status: 'all',
        gateId: 'all',
        sort: 'last-active-desc',
      }).map((r) => r.uid),
    ).toEqual(['b', 'a', 'c']);
  });

  it('escapes CSV cells safely', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('builds a CSV with headers and escaped values', () => {
    const csv = buildRosterCsv([
      {
        name: 'Ada, "Pilot"',
        email: 'ada@ex.com',
        status: 'In Progress',
        currentGate: 'G1',
        progressPct: 40,
        miles: 12,
        learningTimeSeconds: 120,
        learningTimeFormatted: '2 min',
        lastActive: 'Not tracked yet',
        certificationDate: 'Not certified',
      },
    ]);
    expect(csv.startsWith('Name,Email,Status')).toBe(true);
    expect(csv).toContain('"Ada, ""Pilot"""');
    expect(csv).toContain('120');
  });
});

describe('admin metrics — recent activity', () => {
  it('merges ledger events newest first and caps at five', () => {
    const items = collectRecentActivity(
      [
        {
          uid: 'u1',
          name: 'Ann',
          email: 'a@x.com',
          ledger: [
            { id: '1', at: '2026-09-01T00:00:00.000Z', amount: 1, label: 'Old' },
            { id: '2', at: '2026-09-18T00:00:00.000Z', amount: 5, label: 'New' },
          ],
        },
        {
          uid: 'u2',
          name: 'Bea',
          email: 'b@x.com',
          ledger: [
            { id: '3', at: '2026-09-17T00:00:00.000Z', amount: 3, label: 'Mid' },
          ],
        },
      ],
      5,
    );
    expect(items.map((i) => i.label)).toEqual(['New', 'Mid', 'Old']);
  });
});

describe('admin roster — profiles and admins', () => {
  it('resolves legacy name fields in priority order', () => {
    expect(
      resolveLearnerDisplayName({ firstName: 'Ada', lastName: 'Lovelace', displayName: 'X', name: 'Y' }),
    ).toBe('Ada Lovelace');
    expect(resolveLearnerDisplayName({ displayName: 'Display Only', name: 'Legacy' })).toBe(
      'Display Only',
    );
    expect(resolveLearnerDisplayName({ name: 'Legacy Only' })).toBe('Legacy Only');
    expect(resolveLearnerDisplayName({})).toBeNull();
  });

  it('excludes admin roles via isAdminRole', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('learner')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });

  it('builds initials from name or email', () => {
    expect(learnerInitials('Ada Lovelace', null)).toBe('AL');
    expect(learnerInitials(null, 'pilot@iaa.com')).toBe('PI');
  });
});

describe('admin history — pagination and mapping', () => {
  it('uses page size of 25', () => {
    expect(PROGRESS_HISTORY_PAGE_SIZE).toBe(25);
    const pages = paginateHistoryRows(Array.from({ length: 60 }, (_, i) => i));
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(25);
    expect(pages[1]).toHaveLength(25);
    expect(pages[2]).toHaveLength(10);
  });

  it('maps revision docs and skips malformed ones', () => {
    const row = mapProgressHistoryData('rev-1', {
      revision: 3,
      changedAt: '2026-09-18T00:00:00.000Z',
      source: 'save',
      isBaseline: false,
      state: {
        v: 1,
        gates: {},
        miles: 42,
        wings: [],
        lab: {},
        pledgeSigned: false,
        certifiedAt: null,
        ledger: [],
      },
    });
    expect(row).toMatchObject({
      id: 'rev-1',
      revision: 3,
      miles: 42,
      certified: false,
      source: 'save',
    });
    expect(mapProgressHistoryData('bad', { revision: 'nope' })).toBeNull();
  });
});

describe('admin dashboard — empty/loading semantics', () => {
  it('treats empty KPI input as zeroed empty state', () => {
    expect(computeStatusBreakdown([])).toEqual([
      { status: 'not-started', label: 'Not Started', count: 0, pct: 0 },
      { status: 'in-progress', label: 'In Progress', count: 0, pct: 0 },
      { status: 'certified', label: 'Certified', count: 0, pct: 0 },
    ]);
  });
});
