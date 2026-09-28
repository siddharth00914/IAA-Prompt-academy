import {
  createActivitySession,
  endActivitySession,
  heartbeatActivitySession,
} from '@/lib/learning-activity-api';
import {
  HEARTBEAT_INTERVAL_MS,
  LEADER_LEASE_MS,
  buildLeaderLease,
  computeActiveDeltaSeconds,
  isProtectedAcademyPath,
  parseGateIdFromPath,
  readLeaderLease,
  shouldClaimLeader,
  shouldCountActive,
} from '@/lib/learning-session-engine';

const LEASE_KEY_PREFIX = 'iaa-learning-leader:';
const CHANNEL_NAME = 'iaa-learning-session';

type TrackerOptions = {
  uid: string;
  pathname: string;
  enabled: boolean;
};

/**
 * Client-side learning session orchestrator.
 * Only the lease leader writes heartbeats. Failures never throw to callers.
 */
export class LearningSessionTracker {
  private uid: string | null = null;
  private pathname = '/';
  private enabled = false;
  private sessionId: string | null = null;
  private tabId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  private isLeader = false;
  private visible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  private focused = typeof document !== 'undefined' ? document.hasFocus() : true;
  private lastInteractionAt = Date.now();
  private lastTickAt = Date.now();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private leaseTimer: ReturnType<typeof setInterval> | null = null;
  private channel: BroadcastChannel | null = null;
  private starting = false;
  private disposed = false;

  start(options: TrackerOptions): void {
    this.disposed = false;
    this.uid = options.uid;
    this.pathname = options.pathname;
    this.enabled = options.enabled;
    this.lastInteractionAt = Date.now();
    this.lastTickAt = Date.now();
    this.bindListeners();
    this.openChannel();
    void this.reconcile();
  }

  updateRoute(pathname: string): void {
    this.pathname = pathname;
    void this.reconcile();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    void this.reconcile();
  }

  /** End session and detach listeners (logout / unmount). */
  async stop(): Promise<void> {
    this.disposed = true;
    this.clearTimers();
    this.unbindListeners();
    this.closeChannel();
    await this.endCurrentSession();
    this.releaseLease();
    this.uid = null;
    this.sessionId = null;
    this.isLeader = false;
  }

  private shouldTrack(): boolean {
    return Boolean(this.enabled && this.uid && isProtectedAcademyPath(this.pathname));
  }

  private async reconcile(): Promise<void> {
    if (this.disposed) return;
    if (!this.shouldTrack()) {
      await this.endCurrentSession();
      this.releaseLease();
      this.isLeader = false;
      this.clearTimers();
      return;
    }

    this.renewLease();
    this.isLeader = this.evaluateLeadership();
    if (!this.isLeader) {
      await this.endCurrentSession();
      this.clearTimers();
      this.ensureLeaseTimer();
      return;
    }

    if (!this.sessionId && !this.starting) {
      await this.beginSession();
    }
    this.ensureTimers();
  }

  private async beginSession(): Promise<void> {
    if (!this.uid || this.starting || this.sessionId) return;
    this.starting = true;
    try {
      const sessionId = await createActivitySession({
        uid: this.uid,
        currentRoute: this.pathname,
        gateId: parseGateIdFromPath(this.pathname),
      });
      if (this.disposed || !this.shouldTrack() || !this.isLeader) {
        await endActivitySession({
          uid: this.uid,
          sessionId,
          currentRoute: this.pathname,
          gateId: parseGateIdFromPath(this.pathname),
        }).catch(() => undefined);
        return;
      }
      this.sessionId = sessionId;
      this.lastTickAt = Date.now();
    } catch (error) {
      console.error('learning session start failed', error);
    } finally {
      this.starting = false;
    }
  }

  private async endCurrentSession(): Promise<void> {
    if (!this.uid || !this.sessionId) return;
    const uid = this.uid;
    const sessionId = this.sessionId;
    this.sessionId = null;
    const delta = computeActiveDeltaSeconds({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      lastTickAt: this.lastTickAt,
      now: Date.now(),
    });
    this.lastTickAt = Date.now();
    try {
      await endActivitySession({
        uid,
        sessionId,
        deltaSeconds: delta,
        currentRoute: this.pathname,
        gateId: parseGateIdFromPath(this.pathname),
      });
    } catch (error) {
      console.error('learning session end failed', error);
    }
  }

  private async tickHeartbeat(): Promise<void> {
    if (this.disposed || !this.uid || !this.sessionId || !this.isLeader) return;

    const now = Date.now();
    const counting = shouldCountActive({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      now,
    });
    const delta = computeActiveDeltaSeconds({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      lastTickAt: this.lastTickAt,
      now,
    });
    // Always advance the tick cursor so idle/hidden gaps are not credited later.
    this.lastTickAt = now;
    this.renewLease();

    try {
      await heartbeatActivitySession({
        uid: this.uid,
        sessionId: this.sessionId,
        deltaSeconds: counting ? delta : 0,
        currentRoute: this.pathname,
        gateId: parseGateIdFromPath(this.pathname),
      });
    } catch (error) {
      console.error('learning session heartbeat failed', error);
    }
  }

  private evaluateLeadership(): boolean {
    if (!this.uid || typeof window === 'undefined') return false;
    const key = LEASE_KEY_PREFIX + this.uid;
    const now = Date.now();
    try {
      const lease = readLeaderLease(window.localStorage.getItem(key), now);
      if (!shouldClaimLeader({ lease, tabId: this.tabId, now })) {
        return false;
      }
      const next = buildLeaderLease(this.tabId, now, LEADER_LEASE_MS);
      window.localStorage.setItem(key, JSON.stringify(next));
      this.channel?.postMessage({ type: 'leader', tabId: this.tabId, uid: this.uid });
      return true;
    } catch {
      // Without durable lease storage, refuse leadership to avoid multi-tab double-count.
      return false;
    }
  }

  private renewLease(): void {
    if (!this.uid || typeof window === 'undefined') return;
    if (!this.isLeader && !this.evaluateLeadership()) return;
    const key = LEASE_KEY_PREFIX + this.uid;
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(buildLeaderLease(this.tabId, Date.now(), LEADER_LEASE_MS)),
      );
    } catch {
      // ignore
    }
  }

  private releaseLease(): void {
    if (!this.uid || typeof window === 'undefined') return;
    const key = LEASE_KEY_PREFIX + this.uid;
    try {
      const lease = readLeaderLease(window.localStorage.getItem(key), Date.now());
      if (lease?.tabId === this.tabId) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }

  private ensureTimers(): void {
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        void this.tickHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    }
    this.ensureLeaseTimer();
  }

  private ensureLeaseTimer(): void {
    if (this.leaseTimer) return;
    this.leaseTimer = setInterval(() => {
      void this.reconcile();
    }, Math.floor(LEADER_LEASE_MS / 2));
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.leaseTimer) {
      clearInterval(this.leaseTimer);
      this.leaseTimer = null;
    }
  }

  private onInteraction = (): void => {
    const now = Date.now();
    const wasCounting = shouldCountActive({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      now,
    });
    this.lastInteractionAt = now;
    const nowCounting = shouldCountActive({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      now,
    });
    // After idle → active, start a fresh tick window so the idle gap is not credited.
    if (!wasCounting && nowCounting) {
      this.lastTickAt = now;
    }
  };

  private onVisibility = (): void => {
    const now = Date.now();
    const wasCounting = shouldCountActive({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      now,
    });
    this.visible = document.visibilityState === 'visible';
    if (!this.visible && wasCounting) {
      void this.tickHeartbeat();
    }
    if (this.visible) {
      this.lastTickAt = Date.now();
      this.onInteraction();
      void this.reconcile();
    }
  };

  private onFocus = (): void => {
    this.focused = true;
    this.lastTickAt = Date.now();
    this.onInteraction();
  };

  private onBlur = (): void => {
    const wasCounting = shouldCountActive({
      isLeader: this.isLeader,
      visible: this.visible,
      focused: this.focused,
      lastInteractionAt: this.lastInteractionAt,
      now: Date.now(),
    });
    this.focused = false;
    if (wasCounting) void this.tickHeartbeat();
  };

  private onStorage = (event: StorageEvent): void => {
    if (!this.uid) return;
    if (event.key !== LEASE_KEY_PREFIX + this.uid) return;
    void this.reconcile();
  };

  private bindListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    window.addEventListener('keydown', this.onInteraction, { passive: true });
    window.addEventListener('pointerdown', this.onInteraction, { passive: true });
    window.addEventListener('scroll', this.onInteraction, { passive: true });
    window.addEventListener('touchstart', this.onInteraction, { passive: true });
    window.addEventListener('focus', this.onFocus);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('storage', this.onStorage);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private unbindListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    window.removeEventListener('keydown', this.onInteraction);
    window.removeEventListener('pointerdown', this.onInteraction);
    window.removeEventListener('scroll', this.onInteraction);
    window.removeEventListener('touchstart', this.onInteraction);
    window.removeEventListener('focus', this.onFocus);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('storage', this.onStorage);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  private openChannel(): void {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; tabId?: string; uid?: string } | null;
        if (!data || data.uid !== this.uid) return;
        if (data.type === 'leader' && data.tabId && data.tabId !== this.tabId) {
          void this.reconcile();
        }
      };
    } catch {
      this.channel = null;
    }
  }

  private closeChannel(): void {
    this.channel?.close();
    this.channel = null;
  }
}

let singleton: LearningSessionTracker | null = null;

export function getLearningSessionTracker(): LearningSessionTracker {
  if (!singleton) singleton = new LearningSessionTracker();
  return singleton;
}
