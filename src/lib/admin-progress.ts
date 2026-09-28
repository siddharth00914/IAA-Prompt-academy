import { computeJourney, GATES, TOTAL_LEGS } from '@/components/dashboard/journey-data';
import type { GateProgress, LabScenarioProgress, LegStatus, MilesEvent, Progress } from '@/lib/progress';

export type LedgerEntry = {
  id: string;
  at: string;
  amount: number;
  label: string;
};

export type GateScoreRow = {
  gateId: string;
  number: string;
  title: string;
  checkScore: number | null;
  checkAttempts: number;
  legsDone: number;
  legsTotal: number;
  completedLegTitles: string[];
};

export type LearnerDetail = {
  coursePct: number;
  miles: number;
  currentGate: string;
  completedLegs: number;
  totalLegs: number;
  gates: GateScoreRow[];
  ledger: LedgerEntry[];
};

export type RosterSummary = {
  totalLearners: number;
  averageLearnerProgress: number;
  totalLearnerMiles: number;
};

const LEG_STATUSES: ReadonlySet<string> = new Set(['done', 'open', 'locked']);

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function emptyProgress(): Progress {
  return {
    v: 1,
    gates: {},
    miles: 0,
    wings: [],
    lab: {},
    pledgeSigned: false,
    certifiedAt: null,
    ledger: [],
  };
}

function emptyDetail(): LearnerDetail {
  return {
    coursePct: 0,
    miles: 0,
    currentGate: 'Not started',
    completedLegs: 0,
    totalLegs: TOTAL_LEGS,
    gates: GATES.map((gate) => ({
      gateId: gate.id,
      number: gate.number,
      title: gate.title,
      checkScore: null,
      checkAttempts: 0,
      legsDone: 0,
      legsTotal: gate.legs.length,
      completedLegTitles: [],
    })),
    ledger: [],
  };
}

function sanitizeGate(value: unknown): GateProgress {
  const data = asRecord(value);
  const legsRaw = asRecord(data.legs);
  const legs: Record<string, LegStatus> = {};
  for (const [legId, status] of Object.entries(legsRaw)) {
    if (typeof status === 'string' && LEG_STATUSES.has(status)) {
      legs[legId] = status as LegStatus;
    }
  }
  return {
    legs,
    checkScore: asNullableScore(data.checkScore),
    checkAttempts: Math.max(0, Math.floor(asFiniteNumber(data.checkAttempts, 0))),
    mastered: data.mastered === true,
  };
}

function sanitizeLab(value: unknown): LabScenarioProgress {
  const data = asRecord(value);
  return {
    attempts: Math.max(0, Math.floor(asFiniteNumber(data.attempts, 0))),
    bestScore: Math.max(0, asFiniteNumber(data.bestScore, 0)),
    goldViewed: data.goldViewed === true,
    rewardedAttempts: Math.max(0, Math.floor(asFiniteNumber(data.rewardedAttempts, 0))),
  };
}

function sanitizeLedger(value: unknown): MilesEvent[] {
  if (!Array.isArray(value)) return [];
  const events: MilesEvent[] = [];
  for (const [index, item] of value.entries()) {
    const data = asRecord(item);
    const label = asString(data.label).trim();
    if (!label) continue;
    events.push({
      id: asString(data.id).trim() || `ledger-${index}`,
      at: asString(data.at),
      amount: asFiniteNumber(data.amount, 0),
      label,
    });
  }
  return events.slice(0, 100);
}

export function sanitizeProgress(raw: unknown): Progress {
  const doc = asRecord(raw);
  const state = asRecord(doc.state);
  const gatesRaw = asRecord(state.gates);
  const labRaw = asRecord(state.lab);
  const wings = Array.isArray(state.wings)
    ? state.wings.filter((wing): wing is string => typeof wing === 'string' && wing.trim().length > 0)
    : [];

  const gates: Progress['gates'] = {};
  for (const [gateId, value] of Object.entries(gatesRaw)) {
    gates[gateId] = sanitizeGate(value);
  }

  const lab: Progress['lab'] = {};
  for (const [scenarioId, value] of Object.entries(labRaw)) {
    lab[scenarioId] = sanitizeLab(value);
  }

  const certifiedAt = typeof state.certifiedAt === 'string' && state.certifiedAt.trim()
    ? state.certifiedAt
    : null;

  return {
    ...emptyProgress(),
    gates,
    miles: Math.max(0, asFiniteNumber(state.miles, 0)),
    wings,
    lab,
    pledgeSigned: state.pledgeSigned === true,
    certifiedAt,
    ledger: sanitizeLedger(state.ledger),
  };
}

export function buildLearnerDetail(progress: Progress): LearnerDetail {
  try {
    const journey = computeJourney(progress);
    const gate = journey.gates[journey.posGate] ?? journey.gates[0];
    const currentGate = !gate
      ? 'Not started'
      : !journey.started
        ? `${gate.number} · ${gate.title} · Not started`
        : `${gate.number} · ${gate.title} · ${journey.posLabel}`;
    return {
      coursePct: Math.round(journey.coursePct * 100),
      miles: Math.max(0, asFiniteNumber(progress.miles, 0)),
      currentGate,
      completedLegs: journey.gates.reduce((sum, gate) => sum + gate.legsDone, 0),
      totalLegs: TOTAL_LEGS,
      gates: journey.gates.map((gate) => ({
        gateId: gate.id,
        number: gate.number,
        title: gate.title,
        checkScore: gate.checkScore,
        checkAttempts: gate.checkAttempts,
        legsDone: gate.legsDone,
        legsTotal: gate.legs.length,
        completedLegTitles: gate.legs.filter((_, index) => gate.legDone[index]).map((leg) => leg.title),
      })),
      ledger: progress.ledger.slice(0, 10).map((event) => ({
        id: event.id,
        at: event.at,
        amount: event.amount,
        label: event.label,
      })),
    };
  } catch (error) {
    console.error('Failed to derive learner detail from progress', error);
    return {
      ...emptyDetail(),
      miles: Math.max(0, asFiniteNumber(progress.miles, 0)),
      ledger: progress.ledger.slice(0, 10),
    };
  }
}

export function summarizeRoster(
  rows: Array<{ coursePct: number; miles: number }>,
): RosterSummary {
  const totalLearners = rows.length;
  const totalLearnerMiles = rows.reduce((sum, row) => sum + row.miles, 0);
  const averageLearnerProgress =
    totalLearners === 0
      ? 0
      : Math.round(rows.reduce((sum, row) => sum + row.coursePct, 0) / totalLearners);

  return {
    totalLearners,
    averageLearnerProgress,
    totalLearnerMiles,
  };
}
