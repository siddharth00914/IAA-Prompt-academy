import type { ProgressState } from './progress-routes.ts';

const MAX_LEDGER = 100;
const MAX_LAB_MILE_REWARDS = 3;

type LegStatus = ProgressState['gates'][string]['legs'][string];
type GateProgress = ProgressState['gates'][string];
type LabScenarioProgress = ProgressState['lab'][string];
type MilesEvent = ProgressState['ledger'][number];

function emptyGate(): GateProgress {
  return { legs: {}, checkScore: null, checkAttempts: 0, mastered: false };
}

/**
 * Explicit non-reducing merge of legacy localStorage Progress into server Progress.
 * Every Progress field is handled deliberately — no recursive generic merge.
 */
export function mergeProgressStates(
  server: ProgressState,
  legacy: ProgressState,
): ProgressState {
  return {
    // Schema version — always the current contract.
    v: 1,
    // Per-gate records: union of gate ids; each field merged explicitly below.
    gates: mergeGates(server.gates, legacy.gates),
    // Cumulative miles: keep the greater total (never sum — avoids double-counting).
    miles: Math.max(server.miles, legacy.miles),
    // Completed wing collection: union + dedupe, stable server-then-legacy order.
    wings: mergeStringUnion(server.wings, legacy.wings),
    // Per-scenario lab records: union of scenario ids; numeric max / boolean OR.
    lab: mergeLab(server.lab, legacy.lab),
    // Completion flag: either side signed ⇒ signed.
    pledgeSigned: server.pledgeSigned || legacy.pledgeSigned,
    // Certification timestamp: prefer any set value; if both, keep the earlier.
    certifiedAt: mergeCertifiedAt(server.certifiedAt, legacy.certifiedAt),
    // Effort ledger: valid entries only, dedupe by id, newest 100.
    ledger: mergeLedger(server.ledger, legacy.ledger),
  };
}

function mergeGates(
  server: ProgressState['gates'],
  legacy: ProgressState['gates'],
): ProgressState['gates'] {
  const out: ProgressState['gates'] = {};
  const ids = new Set([...Object.keys(server), ...Object.keys(legacy)]);
  for (const id of ids) {
    out[id] = mergeGate(server[id] ?? emptyGate(), legacy[id] ?? emptyGate());
  }
  return out;
}

function mergeGate(server: GateProgress, legacy: GateProgress): GateProgress {
  return {
    // Legs map: union of leg ids; completed status wins (done > open > locked).
    legs: mergeLegs(server.legs, legacy.legs),
    // Best check score: greater non-null value (null = never attempted).
    checkScore: mergeNullableMax(server.checkScore, legacy.checkScore),
    // Attempt count: greater value (never sum — attempts aren't double-counted).
    checkAttempts: Math.max(server.checkAttempts, legacy.checkAttempts),
    // Mastery flag: logical OR.
    mastered: server.mastered || legacy.mastered,
  };
}

function mergeLegs(
  server: Record<string, LegStatus>,
  legacy: Record<string, LegStatus>,
): Record<string, LegStatus> {
  const out: Record<string, LegStatus> = {};
  const ids = new Set([...Object.keys(server), ...Object.keys(legacy)]);
  for (const id of ids) {
    out[id] = mergeLegStatus(server[id], legacy[id]);
  }
  return out;
}

function mergeLegStatus(
  a: LegStatus | undefined,
  b: LegStatus | undefined,
): LegStatus {
  if (a === 'done' || b === 'done') return 'done';
  if (a === 'open' || b === 'open') return 'open';
  if (a === 'locked' || b === 'locked') return 'locked';
  return 'open';
}

function mergeLab(
  server: ProgressState['lab'],
  legacy: ProgressState['lab'],
): ProgressState['lab'] {
  const out: ProgressState['lab'] = {};
  const ids = new Set([...Object.keys(server), ...Object.keys(legacy)]);
  for (const id of ids) {
    out[id] = mergeLabScenario(server[id], legacy[id]);
  }
  return out;
}

function mergeLabScenario(
  server: LabScenarioProgress | undefined,
  legacy: LabScenarioProgress | undefined,
): LabScenarioProgress {
  const a = server ?? { attempts: 0, bestScore: 0 };
  const b = legacy ?? { attempts: 0, bestScore: 0 };
  const rewarded = Math.max(a.rewardedAttempts ?? 0, b.rewardedAttempts ?? 0);
  const merged: LabScenarioProgress = {
    // Attempt count: greater value (never sum).
    attempts: Math.max(a.attempts, b.attempts),
    // Best score: greater value.
    bestScore: Math.max(a.bestScore, b.bestScore),
  };
  // Gold-viewed flag: logical OR (optional field — omit when false on both).
  if (a.goldViewed || b.goldViewed) merged.goldViewed = true;
  // Rewarded attempts: greater value, capped at the product policy max.
  if (a.rewardedAttempts !== undefined || b.rewardedAttempts !== undefined) {
    merged.rewardedAttempts = Math.min(rewarded, MAX_LAB_MILE_REWARDS);
  }
  return merged;
}

function mergeStringUnion(server: string[], legacy: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...server, ...legacy]) {
    if (!w || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

function mergeNullableMax(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

function mergeCertifiedAt(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;
  // Earlier certification is the true first completion — keep it.
  return ta <= tb ? a : b;
}

function mergeLedger(server: MilesEvent[], legacy: MilesEvent[]): MilesEvent[] {
  const byId = new Map<string, MilesEvent>();
  for (const event of [...server, ...legacy]) {
    if (!isValidLedgerEvent(event)) continue;
    const prev = byId.get(event.id);
    if (!prev || eventTime(event) >= eventTime(prev)) {
      byId.set(event.id, event);
    }
  }
  return [...byId.values()]
    .sort((x, y) => eventTime(y) - eventTime(x))
    .slice(0, MAX_LEDGER);
}

function isValidLedgerEvent(event: MilesEvent): boolean {
  return (
    typeof event?.id === 'string' &&
    event.id.length > 0 &&
    typeof event.at === 'string' &&
    event.at.length > 0 &&
    typeof event.amount === 'number' &&
    Number.isFinite(event.amount) &&
    typeof event.label === 'string'
  );
}

function eventTime(event: MilesEvent): number {
  const t = Date.parse(event.at);
  return Number.isNaN(t) ? 0 : t;
}

/** Stable structural equality for deciding whether revision must bump. */
export function progressStatesEqual(a: ProgressState, b: ProgressState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
