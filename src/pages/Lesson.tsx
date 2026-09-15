import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Plane, X } from 'lucide-react';
import Stub from '@/pages/Stub';
import Callout from '@/components/Callout';
import StampOverlay from '@/components/StampOverlay';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { useToast } from '@/components/Toast';
import BlockRenderer, { blockOutlineTitle } from '@/components/learn/BlockRenderer';
import { renderInline } from '@/components/learn/inline';
import { isGateUnlocked, recordLegComplete, useProgress } from '@/lib/progress';
import { prefersReducedMotion, scrollToTarget } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';
import { ACCENT_TEXT, getGate, getLeg, getLegIndex } from '@/content/gates';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Plane-fly page transition (lesson.md §S2): a plane glyph crosses the
 * viewport along a dashed path, then the next page fades in. */
function PlaneTransition({ active }: { active: boolean }) {
  const reduced = prefersReducedMotion();
  if (reduced || !active) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <motion.path
          d="M -5 70 C 30 60, 60 40, 105 25"
          fill="none"
          stroke="#E09112"
          strokeWidth="0.4"
          strokeDasharray="3 3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </svg>
      <motion.div
        className="absolute"
        initial={{ left: '-4%', top: '66%' }}
        animate={{ left: '102%', top: '21%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <Plane className="h-6 w-6 -rotate-12 text-ink-900" strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
}

export default function Lesson() {
  const { gateId, legId } = useParams();
  const gate = getGate(gateId);
  const leg = getLeg(gateId, legId);
  const legIndex = gate && leg ? getLegIndex(gate, leg.id) : -1;

  const progress = useProgress();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = prefersReducedMotion();

  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [footerSeen, setFooterSeen] = useState(false);
  const [stamp, setStamp] = useState(false);
  const [milesFloat, setMilesFloat] = useState(0);
  const [flyAway, setFlyAway] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const routeKey = `${gateId}/${legId}`;

  const prevLeg = gate && legIndex > 0 ? gate.legs[legIndex - 1] : undefined;
  const nextLeg = gate && legIndex >= 0 && legIndex < gate.legs.length - 1 ? gate.legs[legIndex + 1] : undefined;
  const continuePath = gate ? (nextLeg ? `/gates/${gate.id}/legs/${nextLeg.id}` : `/gates/${gate.id}/check`) : '/';
  const prevPath = gate
    ? prevLeg
      ? `/gates/${gate.id}/legs/${prevLeg.id}`
      : `/gates/${gate.id}`
    : '/';

  // Gate locked → bounce to the gate overview (which shows the hold-short state).
  useEffect(() => {
    if (gate && !isGateUnlocked(gate.index)) {
      navigate(`/gates/${gate.id}`, { replace: true });
    }
  }, [gate, navigate]);

  // Reset per-leg UI state on route change.
  useEffect(() => {
    setActiveBlock(null);
    setOutlineOpen(false);
    setFooterSeen(false);
    setStamp(false);
    setMilesFloat(0);
    setFlyAway(false);
  }, [routeKey]);

  // Deep link: #block-id scrolls to the block (lesson.md behavior notes).
  useEffect(() => {
    if (location.hash) {
      const t = window.setTimeout(() => scrollToTarget(location.hash, -130), 450);
      return () => window.clearTimeout(t);
    }
  }, [routeKey, location.hash]);

  // Scrollspy for the right-rail outline.
  useEffect(() => {
    if (!leg) return;
    const els = leg.blocks
      .map((b) => document.getElementById(`block-${b.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveBlock(e.target.id.replace(/^block-/, ''));
        });
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Footer-in-view tracking (enables the honest "fast flight" note).
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setFooterSeen(true);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [routeKey]);

  // Keyboard: ←/→ prev/next leg (space handled by the focused SceneVideo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (e.key === 'ArrowLeft' && (prevLeg || gate)) {
        navigate(prevPath);
      } else if (e.key === 'ArrowRight' && nextLeg && gate) {
        navigate(`/gates/${gate.id}/legs/${nextLeg.id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, prevLeg, nextLeg, gate, prevPath]);

  const outline = useMemo(
    () => (leg ? leg.blocks.map((b) => ({ id: b.id, title: blockOutlineTitle(b) })) : []),
    [leg],
  );

  if (!gate || !leg) {
    return (
      <Stub label="OFF ROUTE" title="This leg isn't on the flight plan.">
        <p>
          Check the gate board for the legs we actually filed.{' '}
          <Link to={gate ? `/gates/${gate.id}` : '/journey'} className="font-semibold text-amber-600 underline">
            {gate ? `Back to ${gate.number}` : 'Back to the journey map'}
          </Link>
          .
        </p>
      </Stub>
    );
  }

  if (!isGateUnlocked(gate.index)) {
    // Redirect fires in the effect above; render nothing meanwhile.
    return null;
  }

  // Coming-soon state for gates whose content is still being authored.
  if (gate.comingSoon || leg.blocks.length === 0) {
    return (
      <section className="bg-paper">
        <div className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col items-start justify-center px-6 py-24">
          <p className="label text-amber-600">
            {gate.number} · {leg.code}
          </p>
          <h1 className="h1 mt-4 text-ink-900">{leg.title}</h1>
          <p className="body mt-4 text-ink-700">
            This leg is being loaded at the ramp — {gate.title} content boards soon. Your progress
            at earlier gates is logged and waiting.
          </p>
          <TaxiwayLoader label="ON FINAL APPROACH — CONTENT LOADING" className="mt-8" />
          <Link to={`/gates/${gate.id}`} className="btn-ghost mt-10">
            ← Back to {gate.number}
          </Link>
        </div>
      </section>
    );
  }

  const legDone = progress.gates[gate.id]?.legs[leg.id] === 'done';

  const handleComplete = () => {
    if (flyAway) return;
    if (legDone) {
      // Replay: miles only the first time (lesson.md behavior notes).
      setFlyAway(true);
      window.setTimeout(() => navigate(continuePath), reduced ? 50 : 650);
      return;
    }
    const miles = recordLegComplete(gate.id, leg.id);
    setStamp(true);
    if (miles > 0) {
      setMilesFloat(miles);
      showToast('TOWER:', `Leg logged. ${miles} miles credited.`);
    }
    window.setTimeout(() => setMilesFloat(0), 2200);
    setFlyAway(true);
    window.setTimeout(() => navigate(continuePath), reduced ? 120 : 1400);
  };

  const rail = (
    <div className="space-y-6">
      <div>
        <p className="label text-ink-500">ON THIS LEG</p>
        <ol className="mt-3 space-y-0.5">
          {outline.map((item) => {
            const active = activeBlock === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollToTarget(`#block-${item.id}`, -130)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[2px] px-2 py-1.5 text-left font-mono text-[12px] transition-colors',
                    active ? 'font-semibold text-ink-900' : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  <motion.span
                    layout="position"
                    className={cn('h-3 w-[3px] rounded-full', active ? 'bg-amber-500' : 'bg-transparent')}
                  />
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <Callout variant="tower" className="!p-4">
        <p className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.5} aria-hidden />
          <span>
            Technique deep-dives live in the Flight Manual.{' '}
            <Link to="/manual" className="font-semibold text-amber-600 underline">
              Open the manual →
            </Link>
          </span>
        </p>
      </Callout>
      <p className="data text-ink-500">
        {leg.durationMin} MIN · {legDone ? 'LOGGED — REVIEW IS FREE' : '+20 MILES ON COMPLETION'}
      </p>
    </div>
  );

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-paper"
    >
      <PlaneTransition active={flyAway} />

      {/* S1 — player chrome (sticky under the global navbar) */}
      <motion.div
        initial={reduced ? false : { y: -56 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: EASE_EXPO }}
        className="sticky top-16 z-40 border-b border-line bg-paper/90 backdrop-blur"
      >
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-4 px-6">
          <div className="min-w-0 flex-1">
            <p className={cn('label truncate', 'text-ink-500')}>
              <span className={cn('font-semibold', ACCENT_TEXT[gate.accent])}>{gate.number}</span>{' '}
              · {gate.title.toUpperCase()} / LEG {legIndex + 1} OF {gate.legs.length}
            </p>
            <p className="body-strong hidden truncate text-[15px] text-ink-900 sm:block">{leg.title}</p>
          </div>

          {/* leg progress dots */}
          <div className="hidden items-center gap-2 md:flex" aria-label="Leg progress">
            {gate.legs.map((l, i) => {
              const done = progress.gates[gate.id]?.legs[l.id] === 'done';
              const current = i === legIndex;
              return (
                <Link
                  key={l.id}
                  to={`/gates/${gate.id}/legs/${l.id}`}
                  aria-label={`${l.code} — ${done ? 'done' : current ? 'current' : 'upcoming'}`}
                  className="p-1"
                >
                  <span
                    className={cn(
                      'block h-2.5 w-2.5 rounded-full',
                      done ? 'bg-field-500' : current ? 'bg-amber-500' : 'bg-line',
                    )}
                  >
                    {current && !done && !reduced ? (
                      <motion.span
                        className="block h-full w-full rounded-full bg-amber-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* miles chip + exit */}
          <Link
            to="/journey"
            className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5"
            aria-label={`${progress.miles} miles — open your journey`}
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500 animate-taxiway-blink motion-reduce:animate-none" />
            <span className="font-mono text-[13px] font-semibold tracking-wide text-ink-900">
              {progress.miles}
            </span>
          </Link>
          <Link
            to={`/gates/${gate.id}`}
            aria-label={`Exit to ${gate.number} overview`}
            className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-line text-ink-700 transition-colors hover:border-amber-500 hover:text-ink-900"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      </motion.div>

      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-10">
        <div className="xl:grid xl:grid-cols-[minmax(0,720px)_280px] xl:justify-center xl:gap-14">
          {/* content column */}
          <div className="mx-auto w-full max-w-[720px] xl:mx-0">
            {/* inline outline accordion below xl */}
            <div className="mb-8 rounded-[6px] border border-line bg-paper-bright xl:hidden">
              <button
                type="button"
                onClick={() => setOutlineOpen((o) => !o)}
                aria-expanded={outlineOpen}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <span className="label text-ink-500">ON THIS LEG</span>
                <ChevronDown
                  className={cn('h-4 w-4 text-ink-500 transition-transform', outlineOpen && 'rotate-180')}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {outlineOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_EXPO }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-4 py-4">{rail}</div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* leg header */}
            <header>
              <p className="label text-amber-600">
                {leg.code} · {leg.type}
              </p>
              <h1 className="h1 mt-3 text-ink-900">{leg.title}</h1>
              <p className="body mt-3 text-ink-500">{leg.description}</p>
            </header>

            {/* blocks */}
            <div className="mt-10 space-y-12">
              {leg.blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>

            {/* S2 — lesson footer */}
            <footer ref={footerRef} className="mt-16">
              {/* key takeaways */}
              <div className="rounded-r-[6px] border-l-2 border-amber-500 bg-amber-100 p-6">
                <p className="label text-amber-600">KEY TAKEAWAYS</p>
                <ul className="mt-3 space-y-2">
                  {leg.takeaways.slice(0, 3).map((t, i) => (
                    <li key={i} className="small flex items-start gap-2 text-ink-900">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{renderInline(t)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* completion row */}
              <div className="relative mt-8">
                <StampOverlay variant="LEG COMPLETE" show={stamp} />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Link to={prevPath} className="btn-ghost">
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    {prevLeg ? 'Previous leg' : `${gate.number} overview`}
                  </Link>
                  <div className="relative flex flex-col items-end gap-2">
                    <AnimatePresence>
                      {milesFloat > 0 ? (
                        <motion.span
                          key="miles"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: -6 }}
                          exit={{ opacity: 0, y: -16 }}
                          transition={{ duration: 0.5, ease: EASE_EXPO }}
                          className="absolute -top-8 right-0 rounded-[2px] bg-ink-900 px-2 py-0.5 font-mono text-[12px] font-semibold text-glow-amber"
                        >
                          +{milesFloat} MILES
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                    <button
                      type="button"
                      onClick={handleComplete}
                      title={footerSeen || legDone ? undefined : 'Fast flight. Miles awarded on trust.'}
                      className="btn-primary"
                    >
                      {legDone ? 'Continue' : nextLeg ? 'Mark complete & continue' : 'Continue to Gate Check'}
                      <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                    <span className="label text-ink-300">
                      {legDone
                        ? 'LOGGED — REVIEW IS FREE'
                        : footerSeen
                          ? '+20 MILES ON COMPLETION'
                          : 'FAST FLIGHT — MILES AWARDED ON TRUST'}
                    </span>
                  </div>
                </div>
              </div>
            </footer>
          </div>

          {/* right rail (≥1280px) */}
          <aside className="sticky top-36 hidden self-start xl:block">{rail}</aside>
        </div>
      </div>
    </motion.div>
  );
}
