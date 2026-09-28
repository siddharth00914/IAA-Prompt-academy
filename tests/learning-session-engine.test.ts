import { describe, expect, it } from 'vitest';
import {
  HEARTBEAT_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  MAX_HEARTBEAT_SECONDS,
  buildLeaderLease,
  computeActiveDeltaSeconds,
  isProtectedAcademyPath,
  parseGateIdFromPath,
  readLeaderLease,
  shouldClaimLeader,
  shouldCountActive,
} from '@/lib/learning-session-engine';
import { historyRevisionId } from '@/lib/progress-history';
import { sanitizeProgress } from '@/lib/admin-progress';

describe('learning-session-engine', () => {
  const base = {
    isLeader: true,
    visible: true,
    focused: true,
    lastInteractionAt: 1_000,
    now: 1_000 + 30_000,
  };

  it('counts time when visible, focused, leader, and recently interactive', () => {
    expect(shouldCountActive(base)).toBe(true);
    expect(
      computeActiveDeltaSeconds({
        ...base,
        lastTickAt: 1_000,
        now: 1_000 + HEARTBEAT_INTERVAL_MS,
      }),
    ).toBe(120);
  });

  it('does not count time when the tab is hidden', () => {
    expect(shouldCountActive({ ...base, visible: false })).toBe(false);
    expect(
      computeActiveDeltaSeconds({
        ...base,
        visible: false,
        lastTickAt: 1_000,
        now: 1_000 + HEARTBEAT_INTERVAL_MS,
      }),
    ).toBe(0);
  });

  it('does not count time when the window is blurred', () => {
    expect(shouldCountActive({ ...base, focused: false })).toBe(false);
  });

  it('stops counting after the five-minute idle timeout', () => {
    const idleNow = base.lastInteractionAt + IDLE_TIMEOUT_MS + 1;
    expect(shouldCountActive({ ...base, now: idleNow })).toBe(false);
    expect(
      computeActiveDeltaSeconds({
        ...base,
        lastTickAt: base.lastInteractionAt,
        now: idleNow,
      }),
    ).toBe(0);
  });

  it('resumes counting after a fresh interaction within the idle window', () => {
    const resumedAt = base.lastInteractionAt + IDLE_TIMEOUT_MS + 60_000;
    expect(
      shouldCountActive({
        ...base,
        lastInteractionAt: resumedAt,
        now: resumedAt + 10_000,
      }),
    ).toBe(true);
  });

  it('caps heartbeat deltas to prevent large jumps', () => {
    const now = 1_000 + 600_000;
    expect(
      computeActiveDeltaSeconds({
        ...base,
        lastInteractionAt: now,
        lastTickAt: 1_000,
        now,
      }),
    ).toBe(MAX_HEARTBEAT_SECONDS);
    expect(MAX_HEARTBEAT_SECONDS).toBe(120);
    expect(HEARTBEAT_INTERVAL_MS).toBe(120_000);
  });

  it('only the lease leader may count', () => {
    expect(shouldCountActive({ ...base, isLeader: false })).toBe(false);
  });

  it('claims leadership when lease is missing or expired', () => {
    const now = 10_000;
    expect(shouldClaimLeader({ lease: null, tabId: 'a', now })).toBe(true);
    expect(
      shouldClaimLeader({
        lease: { tabId: 'b', expiresAt: now - 1 },
        tabId: 'a',
        now,
      }),
    ).toBe(true);
    expect(
      shouldClaimLeader({
        lease: { tabId: 'b', expiresAt: now + 5_000 },
        tabId: 'a',
        now,
      }),
    ).toBe(false);
    expect(
      shouldClaimLeader({
        lease: { tabId: 'a', expiresAt: now + 5_000 },
        tabId: 'a',
        now,
      }),
    ).toBe(true);
  });

  it('parses and renews leader leases', () => {
    const lease = buildLeaderLease('tab-1', 1_000, 15_000);
    expect(readLeaderLease(JSON.stringify(lease), 1_000)?.tabId).toBe('tab-1');
    expect(readLeaderLease(JSON.stringify(lease), 20_000)).toBeNull();
  });

  it('recognizes protected academy paths and gate ids', () => {
    expect(isProtectedAcademyPath('/journey')).toBe(true);
    expect(isProtectedAcademyPath('/gates/g1/legs/1.1')).toBe(true);
    expect(isProtectedAcademyPath('/admin')).toBe(false);
    expect(isProtectedAcademyPath('/login')).toBe(false);
    expect(isProtectedAcademyPath('/')).toBe(false);
    expect(parseGateIdFromPath('/gates/g2/check')).toBe('g2');
    expect(parseGateIdFromPath('/lab')).toBeNull();
  });
});

describe('progress-history helpers', () => {
  it('uses deterministic revision document ids', () => {
    expect(historyRevisionId(0)).toBe('r0');
    expect(historyRevisionId(12)).toBe('r12');
  });

  it('sanitizes progress snapshots without inventing fields', () => {
    const state = sanitizeProgress({
      state: {
        v: 1,
        gates: { g0: { legs: { '0.1': 'done' }, checkScore: 90, checkAttempts: 1, mastered: true } },
        miles: 50,
        wings: ['delimiters-ace'],
        lab: {},
        pledgeSigned: false,
        certifiedAt: null,
        ledger: [{ id: '1', at: '2026-01-01T00:00:00.000Z', amount: 20, label: 'LEG COMPLETE: G0-0.1' }],
      },
    });
    expect(state.miles).toBe(50);
    expect(state.gates.g0.checkScore).toBe(90);
    expect(state.ledger).toHaveLength(1);
  });
});
