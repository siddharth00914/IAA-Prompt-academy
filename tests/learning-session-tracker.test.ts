/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/learning-session-engine';
import { LearningSessionTracker } from '@/lib/learning-session-tracker';

vi.mock('@/lib/learning-activity-api', () => ({
  createActivitySession: vi.fn(async () => 'session-1'),
  heartbeatActivitySession: vi.fn(async () => undefined),
  endActivitySession: vi.fn(async () => undefined),
  ensureActivitySummary: vi.fn(async () => undefined),
}));

import {
  createActivitySession,
  endActivitySession,
  heartbeatActivitySession,
} from '@/lib/learning-activity-api';

describe('LearningSessionTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ends the session on stop (logout / cleanup)', async () => {
    const tracker = new LearningSessionTracker();
    tracker.start({ uid: 'u1', pathname: '/journey', enabled: true });
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    expect(createActivitySession).toHaveBeenCalled();

    await tracker.stop();
    expect(endActivitySession).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'u1', sessionId: 'session-1' }),
    );
  });

  it('does not start on admin dashboard paths', async () => {
    const tracker = new LearningSessionTracker();
    tracker.start({ uid: 'u1', pathname: '/admin', enabled: true });
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    expect(createActivitySession).not.toHaveBeenCalled();
    await tracker.stop();
  });

  it('heartbeats only while leader on an academy route', async () => {
    const tracker = new LearningSessionTracker();
    tracker.start({ uid: 'u1', pathname: '/journey', enabled: true });
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    expect(createActivitySession).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    await Promise.resolve();
    expect(heartbeatActivitySession).toHaveBeenCalled();
    await tracker.stop();
  });
});
