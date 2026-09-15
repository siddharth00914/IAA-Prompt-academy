import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, ArrowRight, ClipboardCheck, FlaskConical, Lock, Plane } from 'lucide-react';
import Stub from '@/pages/Stub';
import Callout from '@/components/Callout';
import StampOverlay from '@/components/StampOverlay';
import { useToast } from '@/components/Toast';
import CountUp from '@/components/learn/CountUp';
import GateHero from '@/components/learn/GateHero';
import type { GateStatus } from '@/components/learn/GateHero';
import LegRow from '@/components/learn/LegRow';
import { getProgress, isGateUnlocked, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';
import { GATES, getGate } from '@/content/gates';
import type { GateContent } from '@/content/gates';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Gates whose GATE UNLOCKED stamp already played this session. */
const unlockedStampShown = new Set<string>();

function gateStatus(gate: GateContent): GateStatus {
  const gp = getProgress().gates[gate.id];
  if ((gp?.checkScore ?? 0) >= 80) return 'MASTERED';
  const anyLegDone = gate.legs.some((l) => gp?.legs[l.id] === 'done');
  if (anyLegDone) return 'IN PROGRESS';
  return isGateUnlocked(gate.index) ? 'BOARDING' : 'NOT STARTED';
}

/**
 * Gate overview (module.md): one template serves all six gates — signage-wall
 * hero (S1), "Upon Arrival" objectives (S2), the legs route list (S3), the
 * Gate Check card with ≥80% gating (S4), lab connection + prev/next gate nav
 * (S5), and the HOLD SHORT locked state (S6).
 */
export default function GateOverview() {
  const { gateId } = useParams();
  const gate = getGate(gateId);
  const progress = useProgress();
  const { showToast } = useToast();
  const reduced = prefersReducedMotion();
  const checkCardRef = useRef<HTMLDivElement>(null);
  const checkInView = useInView(checkCardRef, { once: true, amount: 0.4 });
  const [unlockStamp, setUnlockStamp] = useState(false);

  const gateKey = gate?.id;
  const unlocked = gate ? isGateUnlocked(gate.index) : false;

  // Locked deep-link: hold-short toast (module.md behavior notes).
  useEffect(() => {
    if (gateKey && !isGateUnlocked(gateKey)) {
      const idx = parseInt(gateKey.slice(1), 10);
      showToast(
        'TOWER:',
        `Hold short — Gate ${idx} opens after the Gate ${idx - 1} check (≥80%).`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateKey]);

  // GATE UNLOCKED stamp: mastered gate, next gate exists, first view this session.
  useEffect(() => {
    if (!gate || !checkInView) return;
    const mastered = (progress.gates[gate.id]?.checkScore ?? 0) >= 80;
    if (mastered && gate.index < GATES.length - 1 && !unlockedStampShown.has(gate.id)) {
      unlockedStampShown.add(gate.id);
      setUnlockStamp(true);
      const t = window.setTimeout(() => setUnlockStamp(false), 2600);
      return () => window.clearTimeout(t);
    }
  }, [checkInView, gate, progress]);

  if (!gate) {
    return (
      <Stub label="OFF ROUTE" title="This gate doesn't exist.">
        <p>
          We filed gates G0 through G5 — nothing more.{' '}
          <Link to="/journey" className="font-semibold text-amber-600 underline">
            Back to the journey map
          </Link>
          .
        </p>
      </Stub>
    );
  }

  const gp = progress.gates[gate.id];
  const legsDone = gate.legs.filter((l) => gp?.legs[l.id] === 'done').length;
  const pct = Math.round((legsDone / gate.legs.length) * 100);
  const status = gateStatus(gate);
  const allLegsDone = legsDone === gate.legs.length;
  const attempted = (gp?.checkAttempts ?? 0) > 0;
  const prevGate = gate.index > 0 ? GATES[gate.index - 1] : undefined;
  const nextGate = gate.index < GATES.length - 1 ? GATES[gate.index + 1] : undefined;
  const nextUnlocked = nextGate ? isGateUnlocked(nextGate.index) : false;
  const prevBest = prevGate ? (progress.gates[prevGate.id]?.checkScore ?? null) : null;

  return (
    <div className="bg-paper">
      {/* print-only syllabus header */}
      <div className="hidden px-6 pt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-900 print:block">
        IAA PROMPT ACADEMY — GATE SYLLABUS · {gate.number} {gate.title.toUpperCase()}
      </div>

      {/* S1 — gate hero (+ S6 locked treatment) */}
      <section className="mx-auto max-w-[1180px] px-6 pt-10 md:pt-14 print:pt-2">
        <div className="relative">
          <div className={cn(!unlocked && 'opacity-40')} aria-hidden={!unlocked || undefined}>
            <GateHero gate={gate} status={status} pct={pct} />
          </div>
          {!unlocked ? <StampOverlay variant="HOLD SHORT" show /> : null}
        </div>

        {!unlocked && prevGate ? (
          <div className="mt-6">
            <Callout variant="tower" title="Tower says hold short.">
              <p>
                This gate opens when you score 80%+ on the Gate {prevGate.index} check.
                {prevBest !== null ? ` Current best: ${prevBest}%.` : ''} One more pass and
                you&rsquo;re cleared.
              </p>
              <p className="mt-3">
                <Link to={`/gates/${prevGate.id}/check`} className="btn-primary">
                  Go to Gate {prevGate.index} check →
                </Link>
              </p>
            </Callout>
          </div>
        ) : null}
      </section>

      {/* S2 — objectives ("Upon Arrival") */}
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="label taxiway-stripe inline-block text-amber-600">FLIGHT BRIEFING</p>
            <h2 className="h2 mt-4 text-ink-900">
              Upon arrival at the next gate, you will be able to:
            </h2>
          </div>
          <ol className="space-y-5">
            {gate.objectives.map((obj, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-4"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: 0.12 * i + 0.15, ease: EASE_EXPO }}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border-2 border-amber-500 bg-amber-100">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-600" aria-hidden>
                    <motion.path
                      d="M4 12.5l5 5L20 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={reduced ? false : { pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.3, delay: 0.12 * i }}
                    />
                  </svg>
                </span>
                <span className="body text-ink-700">{obj}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* S3 — lesson legs */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:pb-20">
        <div className="flex items-baseline justify-between">
          <h2 className="h2 text-ink-900">Flight legs</h2>
          <span className="data text-ink-500">
            {legsDone}/{gate.legs.length} LOGGED
          </span>
        </div>
        <div className="relative mt-8">
          {/* the vertical path line */}
          <motion.span
            aria-hidden
            className="absolute bottom-4 left-[26px] top-2 z-0 w-[2px] origin-top bg-line"
            initial={reduced ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1.2, ease: EASE_EXPO }}
          />
          <div className="relative rounded-[6px] border border-line bg-paper-bright shadow-card print:shadow-none">
            {gate.legs.map((leg, i) => (
              <motion.div
                key={leg.id}
                initial={reduced ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: EASE_EXPO }}
              >
                <LegRow gate={gate} leg={leg} index={i} locked={!unlocked} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* S4 — gate check card */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:pb-20">
        <motion.div
          ref={checkCardRef}
          className="relative overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright p-6 shadow-card md:p-8 print:shadow-none"
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
        >
          <StampOverlay variant="GATE UNLOCKED" show={unlockStamp} />
          <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[4px] border-2 border-ink-900 bg-amber-100">
              <ClipboardCheck className="h-7 w-7 text-amber-600" strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <h3 className="h3 text-ink-900">{gate.check.title}</h3>
              <p className="body mt-2 text-ink-700">
                {gate.check.questionCount} questions. No trick maneuvers, no grades on record.
                Score {gate.check.passScore}% or better
                {nextGate ? ` and ${nextGate.number} opens` : ' and the final approach is yours'}.
                Retake as many times as you like — mastery is the only metric here.
              </p>
              <p className="data mt-3 text-ink-500">
                {attempted && gp ? (
                  <>
                    BEST SCORE: <CountUp value={gp.checkScore ?? 0} suffix="%" /> · ATTEMPTS:{' '}
                    {gp.checkAttempts} ·{' '}
                  </>
                ) : null}
                +30 MILES PER ATTEMPT
                {gate.check.wingThreshold
                  ? ` · ≥${gate.check.wingThreshold}% EARNS THE DELIMITERS ACE WING`
                  : ''}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              {allLegsDone || attempted ? (
                <Link to={`/gates/${gate.id}/check`} className="btn-primary">
                  {attempted ? 'Retake →' : 'Take the check →'}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title={`Complete all legs first — ${gate.legs.length - legsDone} to go`}
                  className="btn-primary cursor-not-allowed bg-paper-dim text-ink-300 shadow-none hover:translate-y-0 hover:bg-paper-dim"
                >
                  Complete all legs first
                </button>
              )}
              {!allLegsDone && !attempted ? (
                <span className="label text-ink-300">
                  {gate.legs.length - legsDone} LEG{gate.legs.length - legsDone === 1 ? '' : 'S'} TO
                  GO
                </span>
              ) : null}
            </div>
          </div>
        </motion.div>
      </section>

      {/* S5 — lab connection + prev/next gate nav */}
      <section className="mx-auto max-w-[1180px] px-6 pb-20 md:pb-24">
        {gate.labScenarioIds.length > 0 ? (
          <div>
            <p className="label flex items-center gap-2 text-ink-500">
              <FlaskConical className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
              PRACTICE WHAT THIS GATE TEACHES
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {gate.labScenarioIds.map((sid, i) => {
                const hint = gate.labHints?.find((h) => h.id === sid);
                const best = progress.lab[sid]?.bestScore;
                return (
                  <motion.span
                    key={sid}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: EASE_EXPO }}
                  >
                    <Link
                      to="/lab"
                      className="flex items-center gap-3 rounded-[2px] border border-line bg-paper-bright px-4 py-2.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-card-hover"
                    >
                      <span className="font-mono text-[12px] font-semibold text-amber-600">{sid}</span>
                      <span className="small font-semibold text-ink-900">
                        {hint?.title ?? 'Prompt Lab scenario'}
                      </span>
                      {best !== undefined && best > 0 ? (
                        <span className="data rounded-[2px] bg-field-100 px-1.5 py-0.5 text-field-600">
                          BEST {best}
                        </span>
                      ) : null}
                    </Link>
                  </motion.span>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* prev / next gate nav */}
        <div className="relative mt-12 grid gap-4 sm:grid-cols-2">
          {/* idling plane divider */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
            animate={reduced ? undefined : { x: [-6, 6, -6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink-900 bg-paper">
              <Plane className="h-4 w-4 text-ink-900" strokeWidth={1.5} />
            </span>
          </motion.div>

          {prevGate ? (
            <Link
              to={`/gates/${prevGate.id}`}
              className="group flex items-center gap-3 rounded-[6px] border-2 border-ink-900/20 bg-paper-bright p-5 transition-all hover:-translate-y-1 hover:border-ink-900 hover:shadow-card-hover"
            >
              <ArrowLeft
                className="h-5 w-5 shrink-0 text-ink-500 transition-transform group-hover:-translate-x-1"
                strokeWidth={1.5}
                aria-hidden
              />
              <span>
                <span className="label text-ink-500">PREVIOUS GATE</span>
                <span className="body-strong mt-1 block text-ink-900">
                  {prevGate.number} {prevGate.title}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}

          {nextGate ? (
            nextUnlocked ? (
              <Link
                to={`/gates/${nextGate.id}`}
                className="group flex items-center justify-end gap-3 rounded-[6px] border-2 border-ink-900/20 bg-paper-bright p-5 text-right transition-all hover:-translate-y-1 hover:border-ink-900 hover:shadow-card-hover"
              >
                <span>
                  <span className="label text-ink-500">NEXT GATE</span>
                  <span className="body-strong mt-1 block text-ink-900">
                    {nextGate.number} {nextGate.title}
                  </span>
                </span>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-1"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            ) : (
              <div
                className="flex items-center justify-end gap-3 rounded-[6px] border-2 border-dashed border-line bg-paper-dim p-5 text-right"
                title={`Opens after the Gate ${gate.index} check (≥80%)`}
              >
                <span>
                  <span className="label text-ink-300">OPENS AFTER GATE {gate.index} CHECK</span>
                  <span className="body-strong mt-1 block text-ink-500">
                    {nextGate.number} {nextGate.title}
                  </span>
                </span>
                <Lock className="h-5 w-5 shrink-0 text-ink-300" strokeWidth={1.5} aria-hidden />
              </div>
            )
          ) : (
            <Link
              to="/arrival"
              className="group flex items-center justify-end gap-3 rounded-[6px] border-2 border-amber-500 bg-amber-100 p-5 text-right transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span>
                <span className="label text-amber-600">FINAL APPROACH</span>
                <span className="body-strong mt-1 block text-ink-900">Arrival &amp; Certificate</span>
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-1"
                strokeWidth={1.5}
                aria-hidden
              />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
