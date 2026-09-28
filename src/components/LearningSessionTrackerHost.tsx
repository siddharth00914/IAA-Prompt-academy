import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useAdminAccess } from '@/lib/admin';
import { useAdminViewMode } from '@/lib/admin-view';
import { authClient } from '@/lib/auth-client';
import { getLearningSessionTracker } from '@/lib/learning-session-tracker';
import { isProtectedAcademyPath } from '@/lib/learning-session-engine';

/**
 * Mounts the learning-session tracker for authenticated Academy routes.
 * Skips Admin Dashboard. Failures never block rendering.
 */
export default function LearningSessionTrackerHost() {
  const location = useLocation();
  const { data: session, isSigningOut } = authClient.useSession();
  const { status: adminStatus } = useAdminAccess();
  const { isLearnerView } = useAdminViewMode();
  const trackerRef = useRef(getLearningSessionTracker());
  const runIdRef = useRef(0);

  const uid = session?.user?.id ?? null;
  const onAcademyRoute = isProtectedAcademyPath(location.pathname);
  const isAuthorizedAdmin = adminStatus === 'authorized';
  // Only track when clearance is known: learners, or admins explicitly in Academy view.
  // Do not fail-open on adminStatus === 'error'.
  const enabled =
    Boolean(uid) &&
    !isSigningOut &&
    onAcademyRoute &&
    (adminStatus === 'forbidden' || (isAuthorizedAdmin && isLearnerView));

  useEffect(() => {
    const tracker = trackerRef.current;
    const runId = ++runIdRef.current;

    let cancelled = false;

    const run = async () => {
      await tracker.stop().catch(() => undefined);
      if (cancelled || runId !== runIdRef.current) return;
      if (!uid || !enabled) return;
      tracker.start({
        uid,
        pathname: location.pathname,
        enabled: true,
      });
    };

    void run();

    return () => {
      cancelled = true;
      void tracker.stop().catch(() => undefined);
    };
    // pathname is applied via the route effect below once started
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally start/stop on uid/enabled only
  }, [uid, enabled]);

  useEffect(() => {
    if (!uid || !enabled) return;
    trackerRef.current.updateRoute(location.pathname);
  }, [uid, enabled, location.pathname]);

  useEffect(() => {
    if (!isSigningOut) return;
    runIdRef.current += 1;
    void trackerRef.current.stop().catch(() => undefined);
  }, [isSigningOut]);

  return null;
}
