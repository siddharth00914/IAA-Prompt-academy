/**
 * Pure learning-session timing rules (no Firestore / DOM side effects).
 * Unit-tested: visibility, focus, idle window, delta capping, leader gate.
 *
 * HEARTBEAT_INTERVAL_MS and MAX_HEARTBEAT_SECONDS must stay aligned with
 * firestore.rules learnerActivity increment caps (+120 seconds).
 */

export const HEARTBEAT_INTERVAL_MS = 120_000;
export const IDLE_TIMEOUT_MS = 5 * 60_000;
/** Cap one heartbeat so a stalled tab cannot credit a huge jump. */
export const MAX_HEARTBEAT_SECONDS = 120;
export const LEADER_LEASE_MS = 15_000;

export type ActivityClock = {
  now: () => number;
};

export function shouldCountActive(input: {
  isLeader: boolean;
  visible: boolean;
  focused: boolean;
  lastInteractionAt: number;
  now: number;
  idleTimeoutMs?: number;
}): boolean {
  if (!input.isLeader) return false;
  if (!input.visible || !input.focused) return false;
  const idleMs = input.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
  return input.now - input.lastInteractionAt < idleMs;
}

/**
 * Seconds of countable active time between lastTickAt and now.
 * Returns 0 when not counting; otherwise clamps to [0, maxHeartbeatSeconds].
 */
export function computeActiveDeltaSeconds(input: {
  isLeader: boolean;
  visible: boolean;
  focused: boolean;
  lastInteractionAt: number;
  lastTickAt: number;
  now: number;
  idleTimeoutMs?: number;
  maxHeartbeatSeconds?: number;
}): number {
  if (
    !shouldCountActive({
      isLeader: input.isLeader,
      visible: input.visible,
      focused: input.focused,
      lastInteractionAt: input.lastInteractionAt,
      now: input.now,
      idleTimeoutMs: input.idleTimeoutMs,
    })
  ) {
    return 0;
  }

  const rawMs = input.now - input.lastTickAt;
  if (rawMs <= 0) return 0;

  const maxSec = input.maxHeartbeatSeconds ?? MAX_HEARTBEAT_SECONDS;
  const seconds = Math.floor(rawMs / 1000);
  return Math.min(Math.max(seconds, 0), maxSec);
}

export function parseGateIdFromPath(pathname: string): string | null {
  const match = /^\/gates\/([^/]+)/.exec(pathname);
  return match?.[1] ?? null;
}

/** Protected Academy learner routes (excludes /admin and public pages). */
export function isProtectedAcademyPath(pathname: string): boolean {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return false;
  if (pathname === '/login' || pathname.startsWith('/login/')) return false;
  if (pathname === '/') return false;

  return (
    pathname === '/journey' ||
    pathname.startsWith('/journey/') ||
    pathname.startsWith('/gates/') ||
    pathname === '/lab' ||
    pathname.startsWith('/lab/') ||
    pathname === '/safety' ||
    pathname.startsWith('/safety/') ||
    pathname === '/arrival' ||
    pathname.startsWith('/arrival/') ||
    pathname === '/manual' ||
    pathname.startsWith('/manual/')
  );
}

export type LeaderLease = {
  tabId: string;
  expiresAt: number;
};

export function readLeaderLease(raw: string | null, now: number): LeaderLease | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LeaderLease;
    if (
      typeof parsed.tabId !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      return null;
    }
    if (parsed.expiresAt <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function shouldClaimLeader(input: {
  lease: LeaderLease | null;
  tabId: string;
  now: number;
}): boolean {
  if (!input.lease) return true;
  if (input.lease.tabId === input.tabId) return true;
  return input.lease.expiresAt <= input.now;
}

export function buildLeaderLease(tabId: string, now: number, leaseMs = LEADER_LEASE_MS): LeaderLease {
  return { tabId, expiresAt: now + leaseMs };
}
