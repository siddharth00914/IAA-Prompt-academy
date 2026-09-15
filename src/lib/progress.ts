/**
 * IAA Prompt Academy — learner progress store (design.md §10).
 *
 * All learner state is client-side (localStorage). Miles are awarded for
 * EFFORT only (never ranked, no leaderboards):
 *   leg complete +20 · gate check attempt +30 · pledge +50
 *   lab submission +40 — first attempt per scenario OR a new recorded best,
 *   at most 3 rewarded attempts per scenario (no farming).
 *
 * Gating: Gate n opens when Gate n−1 check score ≥ 80%. G0 has no prerequisite.
 * Certification bar (v2): EVERY gate (G0–G5) has all legs done AND check score
 * ≥ 80%, AND the three capstone lab scenarios (WTP-L10/11/12) each record a
 * bestScore ≥ 70 — after the gold-view honesty cap (recorded scores cap at 89
 * once the gold prompt has been opened; the debrief still displays the actual
 * score).
 */
import { useSyncExternalStore } from 'react';
import { GATES } from '@/content/gates';

// ── Model ────────────────────────────────────────────────────────────────────

export type LegStatus = 'done' | 'open' | 'locked';

export interface GateProgress {
  legs: Record<string, LegStatus>;
  /** Best score so far, 0–100. null = never attempted. */
  checkScore: number | null;
  checkAttempts: number;
  mastered: boolean;
}

export interface LabScenarioProgress {
  attempts: number;
  bestScore: number;
  /** Set when the learner opens the gold prompt (caps the recorded best at 89). */
  goldViewed?: boolean;
  /** How many attempts earned miles (additive v2 field, ≤ MAX_LAB_MILE_REWARDS). */
  rewardedAttempts?: number;
}

export interface MilesEvent {
  id: string;
  at: string; // ISO timestamp
  amount: number;
  label: string; // e.g. "LEG COMPLETE: G1-L2 DELIMITERS"
}

export interface Progress {
  v: 1;
  gates: Record<string, GateProgress>;
  miles: number;
  wings: string[];
  lab: Record<string, LabScenarioProgress>;
  pledgeSigned: boolean;
  certifiedAt: string | null;
  ledger: MilesEvent[];
}

export const MILES = {
  LEG_COMPLETE: 20,
  CHECK_ATTEMPT: 30,
  LAB_ATTEMPT: 40,
  PLEDGE: 50,
  CHECK_IN: 10,
} as const;

export const PASS_SCORE = 80;
/** Recorded-best cap once the gold prompt has been viewed (honesty cap). */
export const GOLD_VIEW_SCORE_CAP = 89;
/** Capstone scenarios must each record at least this to certify. */
export const CAPSTONE_PASS_SCORE = 70;
/** Lab miles: at most this many rewarded attempts per scenario. */
export const MAX_LAB_MILE_REWARDS = 3;
export const GATE_IDS = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'] as const;
export type GateId = (typeof GATE_IDS)[number];
export const CAPSTONE_SCENARIO_IDS = ['WTP-L10', 'WTP-L11', 'WTP-L12'] as const;

export const WINGS = {
  DELIMITERS_ACE: 'delimiters-ace',
  PERSONA_PILOT: 'persona-pilot',
  COT_NAVIGATOR: 'cot-navigator',
  SAFETY_SENTINEL: 'safety-sentinel',
  GOLD_PROMPT: 'gold-prompt',
} as const;
export type WingId = (typeof WINGS)[keyof typeof WINGS];

const STORAGE_KEY = 'iaa-prompt-academy:progress:v1';
/** Stamps which authenticated user may import the current legacy blob. */
const LEGACY_CLAIM_KEY = 'iaa-prompt-academy:legacy-claim:v1';

export type ProgressSyncStatus = 'anonymous' | 'loading' | 'ready' | 'error';
/** Server PUT pipeline status (authenticated learners only). */
export type ProgressSaveStatus = 'idle' | 'scheduled' | 'saving' | 'error';
/** One-time localStorage → server import gate (runs before ready/checkIn). */
export type LegacyImportStatus = 'none' | 'pending' | 'error' | 'done';

function emptyGate(): GateProgress {
  return { legs: {}, checkScore: null, checkAttempts: 0, mastered: false };
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

function normalizeProgress(progress: Progress): Progress {
  return { ...emptyProgress(), ...progress, v: 1 };
}

/** Stable JSON for dirty checks (same content ⇒ same string). */
export function serializeProgress(progress: Progress): string {
  return JSON.stringify(normalizeProgress(progress));
}

/** Stable snapshot while server-backed and `state` is still null (loading). */
const SERVER_LOADING_SNAPSHOT: Progress = Object.freeze(emptyProgress()) as Progress;

// ── Store internals ──────────────────────────────────────────────────────────

let state: Progress | null = null;
/** When true, in-memory server progress is active; localStorage is not read or written. */
let serverBacked = false;
let revision = 0;
let syncStatus: ProgressSyncStatus = 'anonymous';
let saveStatus: ProgressSaveStatus = 'idle';
let legacyImportStatus: LegacyImportStatus = 'none';
/** JSON of the last state known to match the server (hydration or successful PUT). */
let lastSyncedJson: string | null = null;
let hydratedUserId: string | null = null;
const listeners = new Set<() => void>();

type ServerSaveHooks = {
  schedule: () => void;
  cancel: () => void;
};
let serverSaveHooks: ServerSaveHooks | null = null;

function notify(): void {
  listeners.forEach((l) => l());
}

function setSaveStatus(next: ProgressSaveStatus): void {
  if (saveStatus === next) return;
  saveStatus = next;
  notify();
}

function load(): Progress {
  if (state) return state;
  // Authenticated hydration path: never seed from localStorage or stash an
  // empty default into `state` (that would replace server progress).
  if (serverBacked) {
    return SERVER_LOADING_SNAPSHOT;
  }
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Progress;
      state = { ...emptyProgress(), ...parsed };
      return state;
    }
  } catch {
    // corrupted storage — start fresh
  }
  state = emptyProgress();
  return state;
}

function persist(): void {
  if (serverBacked) return; // leave existing localStorage untouched while server-backed
  if (typeof window === 'undefined' || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full/blocked — progress lives in memory for the session
  }
}

function isDirtyAgainstServer(): boolean {
  if (!serverBacked || syncStatus !== 'ready' || !state || lastSyncedJson === null) {
    return false;
  }
  return serializeProgress(state) !== lastSyncedJson;
}

function requestServerSave(): void {
  if (!isDirtyAgainstServer()) return;
  setSaveStatus('scheduled');
  serverSaveHooks?.schedule();
}

function emit(): void {
  // Re-wrap so useSyncExternalStore subscribers see a new snapshot reference.
  if (state) state = { ...state };
  persist();
  notify();
  // Authenticated mutations only — never during hydration or while signed out.
  requestServerSave();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Progress {
  return load();
}

function getSyncSnapshot(): ProgressSyncStatus {
  return syncStatus;
}

function getRevisionSnapshot(): number {
  return revision;
}

function getSaveSnapshot(): ProgressSaveStatus {
  return saveStatus;
}

function getLegacyImportSnapshot(): LegacyImportStatus {
  return legacyImportStatus;
}

/** React hook — subscribe to the full progress object. Pair with the action
 * functions below, e.g. `const progress = useProgress(); recordLegComplete(...)`. */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useProgressSyncStatus(): ProgressSyncStatus {
  return useSyncExternalStore(subscribe, getSyncSnapshot, getSyncSnapshot);
}

export function useProgressRevision(): number {
  return useSyncExternalStore(subscribe, getRevisionSnapshot, getRevisionSnapshot);
}

export function useProgressSaveStatus(): ProgressSaveStatus {
  return useSyncExternalStore(subscribe, getSaveSnapshot, getSaveSnapshot);
}

export function useLegacyImportStatus(): LegacyImportStatus {
  return useSyncExternalStore(subscribe, getLegacyImportSnapshot, getLegacyImportSnapshot);
}

/** Non-React read access. */
export function getProgress(): Progress {
  return load();
}

export function getProgressRevision(): number {
  return revision;
}

export function getProgressSyncStatus(): ProgressSyncStatus {
  return syncStatus;
}

export function getProgressSaveStatus(): ProgressSaveStatus {
  return saveStatus;
}

export function getLegacyImportStatus(): LegacyImportStatus {
  return legacyImportStatus;
}

export function getHydratedUserId(): string | null {
  return hydratedUserId;
}

function progressHasContent(p: Progress): boolean {
  return (
    p.miles > 0 ||
    Object.keys(p.gates).length > 0 ||
    Object.keys(p.lab).length > 0 ||
    p.pledgeSigned ||
    p.certifiedAt !== null
  );
}

/**
 * Read legacy localStorage progress without touching the in-memory store.
 * Returns null when missing, corrupt, empty, or not importable.
 */
export function peekLegacyLocalProgress(): Progress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Progress;
    if (parsed?.v !== 1 || typeof parsed.miles !== 'number') return null;
    const normalized = normalizeProgress(parsed);
    if (!progressHasContent(normalized)) return null;
    return normalized;
  } catch {
    return null;
  }
}

/**
 * True when this browser's legacy blob may be imported for `userId`.
 * Prevents importing the same device progress into a different account.
 */
export function canImportLegacyForUser(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const claim = window.localStorage.getItem(LEGACY_CLAIM_KEY);
    if (!claim) return true;
    return claim === userId;
  } catch {
    return false;
  }
}

export function claimLegacyImportForUser(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = window.localStorage.getItem(LEGACY_CLAIM_KEY);
    if (!existing) {
      window.localStorage.setItem(LEGACY_CLAIM_KEY, userId);
    }
  } catch {
    // storage blocked — import may still proceed for this session
  }
}

/** Remove legacy progress only after the server confirms successful processing. */
export function clearLegacyLocalProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_CLAIM_KEY);
  } catch {
    // ignore
  }
}

export function markLegacyImportPending(): void {
  if (legacyImportStatus === 'pending') return;
  legacyImportStatus = 'pending';
  notify();
}

export function markLegacyImportDone(): void {
  if (legacyImportStatus === 'done') return;
  legacyImportStatus = 'done';
  notify();
}

export function markLegacyImportError(): void {
  legacyImportStatus = 'error';
  notify();
}

/** Wire debounced PUT scheduling from progress-api (avoids a circular import). */
export function registerServerSaveHooks(hooks: ServerSaveHooks | null): void {
  serverSaveHooks = hooks;
}

/** Snapshot for an in-flight PUT (complete state + expected revision). */
export function getServerSavePayload(): { state: Progress; expectedRevision: number } | null {
  if (!serverBacked || syncStatus !== 'ready' || !state || lastSyncedJson === null) {
    return null;
  }
  if (serializeProgress(state) === lastSyncedJson) return null;
  return {
    state: normalizeProgress(state),
    expectedRevision: revision,
  };
}

export function markProgressSaveSaving(): void {
  if (!serverBacked || syncStatus !== 'ready') return;
  setSaveStatus('saving');
}

export function markProgressSaveError(): void {
  if (!serverBacked || syncStatus !== 'ready') return;
  setSaveStatus('error');
}

export function markProgressSaveIdle(): void {
  if (saveStatus === 'idle') return;
  saveStatus = 'idle';
  notify();
}

/**
 * Apply server state after a successful PUT without scheduling another save.
 * Keeps newer local mutations that happened during the request; only bumps
 * revision + lastSynced baseline from what the server now holds.
 */
export function applySuccessfulServerSave(
  sent: Progress,
  returned: Progress,
  nextRevision: number,
): void {
  if (!serverBacked) return;
  revision = nextRevision;
  lastSyncedJson = serializeProgress(returned);
  const sentJson = serializeProgress(sent);
  // If the learner didn't mutate during the flight, take the server copy
  // (e.g. ledger capping). Otherwise keep the newer in-memory state.
  if (!state || serializeProgress(state) === sentJson) {
    state = normalizeProgress(returned);
  }
  saveStatus = isDirtyAgainstServer() ? 'scheduled' : 'idle';
  notify();
  if (saveStatus === 'scheduled') {
    serverSaveHooks?.schedule();
  }
}

/**
 * Start loading server progress for a signed-in user. Clears in-memory state
 * without touching localStorage.
 */
export function beginServerHydration(userId: string): void {
  if (
    hydratedUserId === userId &&
    syncStatus === 'ready' &&
    state &&
    legacyImportStatus === 'done'
  ) {
    return;
  }
  serverSaveHooks?.cancel();
  hydratedUserId = userId;
  state = null;
  revision = 0;
  lastSyncedJson = null;
  serverBacked = true;
  syncStatus = 'loading';
  saveStatus = 'idle';
  legacyImportStatus = 'pending';
  notify();
}

/** Apply GET /api/progress as the active in-memory store (no localStorage write). */
export function hydrateFromServer(progress: Progress, nextRevision: number): void {
  state = normalizeProgress(progress);
  revision = nextRevision;
  lastSyncedJson = serializeProgress(state);
  serverBacked = true;
  syncStatus = 'ready';
  saveStatus = 'idle';
  // legacyImportStatus is set by the hydrator (done/error) around this call
  notify();
}

/**
 * Replace in-memory progress with the server's copy (409 recovery).
 * Does not schedule a save — prevents overwrite loops.
 */
export function acceptServerProgress(progress: Progress, nextRevision: number): void {
  if (!serverBacked) return;
  serverSaveHooks?.cancel();
  state = normalizeProgress(progress);
  revision = nextRevision;
  lastSyncedJson = serializeProgress(state);
  syncStatus = 'ready';
  saveStatus = 'idle';
  notify();
}

export function failServerHydration(): void {
  serverSaveHooks?.cancel();
  syncStatus = 'error';
  saveStatus = 'idle';
  legacyImportStatus = 'none';
  notify();
}

/** Drop the previous learner’s in-memory progress after sign-out. localStorage stays. */
export function clearProgressMemory(): void {
  serverSaveHooks?.cancel();
  state = null;
  revision = 0;
  lastSyncedJson = null;
  serverBacked = false;
  syncStatus = 'anonymous';
  saveStatus = 'idle';
  legacyImportStatus = 'none';
  hydratedUserId = null;
  notify();
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function gateRecord(gateId: string): GateProgress {
  const p = load();
  if (!p.gates[gateId]) p.gates[gateId] = emptyGate();
  return p.gates[gateId];
}

function awardMiles(amount: number, label: string): void {
  const p = load();
  p.miles += amount;
  p.ledger = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      amount,
      label,
    },
    ...p.ledger,
  ].slice(0, 100); // keep the ledger bounded
}

function normalizeGateIndex(gate: number | string): number {
  if (typeof gate === 'number') return gate;
  const m = /^g(\d)$/i.exec(gate);
  return m ? parseInt(m[1], 10) : 0;
}

// ── Gating & queries ─────────────────────────────────────────────────────────

/** Gate n opens when Gate n−1 check score ≥ 80%. G0 is always open. */
export function isGateUnlocked(gate: number | string): boolean {
  const idx = normalizeGateIndex(gate);
  if (idx <= 0) return true;
  const prev = getProgress().gates[`g${idx - 1}`];
  return (prev?.checkScore ?? 0) >= PASS_SCORE;
}

export function highestUnlockedGateIndex(): number {
  let highest = 0;
  for (let i = 1; i < GATE_IDS.length; i += 1) {
    if (isGateUnlocked(i)) highest = i;
    else break;
  }
  return highest;
}

export function getLegStatus(gateId: string, legId: string): LegStatus {
  return getProgress().gates[gateId]?.legs[legId] ?? 'open';
}

export function isLegDone(gateId: string, legId: string): boolean {
  return getLegStatus(gateId, legId) === 'done';
}

export function isGateMastered(gateId: string): boolean {
  return (getProgress().gates[gateId]?.checkScore ?? 0) >= PASS_SCORE;
}

/** All five checks required for certification (G1–G5) at ≥ 80%. */
export function areRequiredChecksPassed(): boolean {
  const p = getProgress();
  return ['g1', 'g2', 'g3', 'g4', 'g5'].every(
    (g) => (p.gates[g]?.checkScore ?? 0) >= PASS_SCORE,
  );
}

/** v2 certification bar: EVERY gate's check (G0–G5) at ≥ 80%. */
export function areAllChecksPassed(): boolean {
  const p = getProgress();
  return GATE_IDS.every((g) => (p.gates[g]?.checkScore ?? 0) >= PASS_SCORE);
}

/** v2 certification bar: every leg of every gate marked done. */
export function areAllLegsDone(): boolean {
  const p = getProgress();
  return GATES.every((gate) =>
    gate.legs.every((leg) => p.gates[gate.id]?.legs[leg.id] === 'done'),
  );
}

export function capstoneSubmittedCount(): number {
  const p = getProgress();
  return CAPSTONE_SCENARIO_IDS.filter((id) => (p.lab[id]?.attempts ?? 0) >= 1).length;
}

export function isCapstoneComplete(): boolean {
  return capstoneSubmittedCount() === CAPSTONE_SCENARIO_IDS.length;
}

/** Capstone scenarios cleared at ≥ CAPSTONE_PASS_SCORE (after gold-view cap). */
export function capstoneClearedCount(): number {
  const p = getProgress();
  return CAPSTONE_SCENARIO_IDS.filter(
    (id) => (p.lab[id]?.bestScore ?? 0) >= CAPSTONE_PASS_SCORE,
  ).length;
}

export function isCapstoneCleared(): boolean {
  return capstoneClearedCount() === CAPSTONE_SCENARIO_IDS.length;
}

/**
 * Certification bar (v2): every gate has ALL legs done AND check score ≥ 80%,
 * AND the capstone scenarios WTP-L10/11/12 each record a bestScore ≥ 70
 * (after gold-view capping).
 */
export function canCertify(): boolean {
  return areAllLegsDone() && areAllChecksPassed() && isCapstoneCleared();
}

export function isCertified(): boolean {
  return getProgress().certifiedAt !== null;
}

export function hasWing(wingId: string): boolean {
  return getProgress().wings.includes(wingId);
}

/** True once the learner has done anything at all (drives "Resume" CTAs). */
export function hasAnyProgress(): boolean {
  return progressHasContent(getProgress());
}

/** Deterministic certificate ID from the completion timestamp. */
export function getCertId(): string | null {
  const at = getProgress().certifiedAt;
  if (!at) return null;
  let hash = 0;
  for (let i = 0; i < at.length; i += 1) {
    hash = (hash * 31 + at.charCodeAt(i)) >>> 0;
  }
  const year = new Date(at).getFullYear();
  return `IAA-PP-${year}-${hash.toString(36).toUpperCase().padStart(4, '0').slice(0, 4)}`;
}

// ── Actions ──────────────────────────────────────────────────────────────────

/** First-visit check-in (+10 miles welcome entry). Idempotent. */
export function checkIn(): void {
  const p = load();
  if (p.ledger.some((e) => e.label.startsWith('CHECKED IN'))) return;
  awardMiles(MILES.CHECK_IN, 'CHECKED IN AT GATE 0');
  emit();
}

/** Mark a leg complete. Awards +20 miles the first time only; re-completion
 * is free ("Already logged — but review is free"). Returns miles awarded. */
export function recordLegComplete(gateId: string, legId: string): number {
  const gate = gateRecord(gateId);
  const first = gate.legs[legId] !== 'done';
  gate.legs[legId] = 'done';
  if (first) awardMiles(MILES.LEG_COMPLETE, `LEG COMPLETE: ${gateId.toUpperCase()}-${legId}`);
  emit();
  return first ? MILES.LEG_COMPLETE : 0;
}

/** Record a gate-check attempt. Keeps the BEST score; +30 miles per attempt
 * pass or not. Returns the new best score. */
export function recordCheckScore(gateId: string, scorePercent: number): number {
  const gate = gateRecord(gateId);
  gate.checkAttempts += 1;
  gate.checkScore = Math.max(gate.checkScore ?? 0, Math.round(scorePercent));
  gate.mastered = gate.checkScore >= PASS_SCORE;
  awardMiles(MILES.CHECK_ATTEMPT, `GATE CHECK ${gateId.toUpperCase()} ATTEMPT (${Math.round(scorePercent)}%)`);
  emit();
  return gate.checkScore;
}

/**
 * Record a Prompt Lab submission. Returns the miles awarded (0 when none).
 *
 * v2 policy:
 *  - Honesty cap: once the gold prompt has been viewed, the RECORDED best
 *    caps at GOLD_VIEW_SCORE_CAP (89). The debrief still displays the actual
 *    score; only the record is capped.
 *  - Miles (+40): only on the first attempt per scenario OR when beating the
 *    recorded best — and at most MAX_LAB_MILE_REWARDS (3) rewarded attempts
 *    per scenario, so miles can't be farmed by re-transmitting.
 */
export function recordLabAttempt(scenarioId: string, score: number): number {
  const p = load();
  const entry = p.lab[scenarioId] ?? { attempts: 0, bestScore: 0 };
  entry.attempts += 1;
  const rounded = Math.round(score);
  const recordable = entry.goldViewed ? Math.min(rounded, GOLD_VIEW_SCORE_CAP) : rounded;
  const beatsBest = recordable > entry.bestScore;
  entry.bestScore = Math.max(entry.bestScore, recordable);

  entry.rewardedAttempts = entry.rewardedAttempts ?? 0;
  let miles = 0;
  if (
    entry.rewardedAttempts < MAX_LAB_MILE_REWARDS &&
    (entry.attempts === 1 || beatsBest)
  ) {
    entry.rewardedAttempts += 1;
    miles = MILES.LAB_ATTEMPT;
    awardMiles(miles, `PROMPT LAB: ${scenarioId} (ATTEMPT ${entry.attempts})`);
  }
  p.lab[scenarioId] = entry;
  emit();
  return miles;
}

/** Flag that the gold prompt was opened for a scenario — from then on the
 * recorded bestScore caps at GOLD_VIEW_SCORE_CAP (honesty cap; wing stays
 * unaided-only via the Lab page's goldViewed check). */
export function markGoldViewed(scenarioId: string): void {
  const p = load();
  const entry = p.lab[scenarioId] ?? { attempts: 0, bestScore: 0 };
  entry.goldViewed = true;
  p.lab[scenarioId] = entry;
  emit();
}

/** Sign the IAA Prompt Pledge: +50 miles once, earns the Safety Sentinel wing. */
export function signPledge(): void {
  const p = load();
  if (p.pledgeSigned) return;
  p.pledgeSigned = true;
  awardMiles(MILES.PLEDGE, 'SAFETY PLEDGE SIGNED');
  awardWing(WINGS.SAFETY_SENTINEL, false);
  emit();
}

/** Award a wing (idempotent). */
export function awardWing(wingId: string, emitNow = true): void {
  const p = load();
  if (p.wings.includes(wingId)) return;
  p.wings.push(wingId);
  p.ledger = [
    {
      id: `${Date.now()}-wing-${wingId}`,
      at: new Date().toISOString(),
      amount: 0,
      label: `WING EARNED: ${wingId.replace(/-/g, ' ').toUpperCase()}`,
    },
    ...p.ledger,
  ].slice(0, 100);
  if (emitNow) emit();
}

/** Set the certification timestamp (idempotent). Call only when canCertify(). */
export function certify(): boolean {
  const p = load();
  if (p.certifiedAt) return false;
  p.certifiedAt = new Date().toISOString();
  emit();
  return true;
}

/** Wipe all learner state (dev/testing). */
export function resetProgress(): void {
  state = emptyProgress();
  emit();
}
