import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, RotateCcw, X } from 'lucide-react';
import Callout from '@/components/Callout';
import StampOverlay from '@/components/StampOverlay';
import { useToast } from '@/components/Toast';
import PlanesFlyover from '@/components/quiz/PlanesFlyover';
import ScoreDial from '@/components/quiz/ScoreDial';
import { isAnswerCorrect, type QuizAttempt } from '@/components/quiz/attempt';
import type { GateCheckBank, GateIdString } from '@/content/types';
import { legTitle, type QuizGateMeta } from '@/content/quizzes';
import { cn } from '@/lib/utils';
import { awardWing, hasWing, WINGS } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Wing earned for a ≥90% check score, by gate. Delimiters Ace (G1) is awarded
 * by the GateCheck page itself; the previously orphaned Persona Pilot (G2) and
 * CoT Navigator (G3) wings are awarded here, same pattern (wing + toast).
 */
const CHECK_WING_AWARDS: Partial<Record<GateIdString, { id: string; name: string }>> = {
  g2: { id: WINGS.PERSONA_PILOT, name: 'PERSONA PILOT' },
  g3: { id: WINGS.COT_NAVIGATOR, name: 'COT NAVIGATOR' },
};

export interface QuizResult {
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
  /** Attempt count after this attempt was recorded. */
  attempts: number;
  /** Best score after this attempt was recorded. */
  best: number;
  /** True when this attempt newly earned the Delimiters Ace wing (G1 ≥ 90%). */
  wingEarned: boolean;
}

interface ResultsScreenProps {
  bank: GateCheckBank;
  meta: QuizGateMeta;
  attempt: QuizAttempt;
  result: QuizResult;
  onRetake: () => void;
}

/** Count-up ticker (miles roll up regardless of outcome). Reduced motion: instant. */
function useCountUp(target: number, durationMs = 1000, delayMs = 500): number {
  // Reduced motion starts at the final value, so the effect has nothing to do.
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs]);
  return value;
}

/**
 * S3 — Results Screen (quiz.md §S3): score dial with split-flap digits, stamp
 * slam at 900ms, verdict, per-question breakdown, +30 miles ticker, actions.
 * On pass: three paper planes cross once + next-gate teaser. After 3 failed
 * attempts: targeted study plan computed from question→leg tags.
 */
export default function ResultsScreen({ bank, meta, attempt, result, onRetake }: ResultsScreenProps) {
  const reduced = prefersReducedMotion();
  const { showToast } = useToast();
  const { correct, total, pct, passed, attempts, wingEarned } = result;
  const passNeeded = Math.ceil(0.8 * total);
  const miles = useCountUp(30);
  const [showStamp, setShowStamp] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  /** Wing newly earned here (G2/G3 ≥90% awards fire from this screen). */
  const [localWingName, setLocalWingName] = useState<string | null>(null);
  const wingCheckedRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowStamp(true), reduced ? 100 : 900);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // Orphan-wing fix: award Persona Pilot / CoT Navigator on a ≥90% check
  // score (idempotent; the G1 Delimiters Ace award lives in GateCheck).
  useEffect(() => {
    if (wingCheckedRef.current) return;
    wingCheckedRef.current = true;
    const wing = CHECK_WING_AWARDS[bank.gateId];
    if (!wing || pct < 90 || hasWing(wing.id)) return;
    awardWing(wing.id);
    setLocalWingName(wing.name);
    showToast(
      'TOWER:',
      `${wing.name.charAt(0)}${wing.name.slice(1).toLowerCase()} wing earned — 90%+ on Gate Check ${bank.gateId.replace('g', '')}.`,
    );
  }, [bank.gateId, pct, showToast]);

  const wingBadge = wingEarned ? 'DELIMITERS ACE WING EARNED' : localWingName ? `${localWingName} WING EARNED` : null;

  const rows = attempt.order.map((qi, pos) => {
    const q = bank.questions[qi];
    const ok = isAnswerCorrect(bank, attempt, pos);
    return { pos, q, ok };
  });
  const missed = rows.filter((r) => !r.ok);
  const firstMissedLeg = missed.find((r) => r.q.legRef)?.q.legRef ?? null;
  const studyLegs = Array.from(
    new Map(
      missed
        .filter((r) => r.q.legRef)
        .map((r) => [r.q.legRef as string, legTitle(bank.gateId, r.q.legRef)]),
    ).entries(),
  );

  const gateNum = (id: string) => id.replace('g', '');
  const nextGateLabel = meta.next ? `Gate ${gateNum(meta.next.gateId)}` : 'Final approach';

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      {passed ? <PlanesFlyover /> : null}

      {/* Score + verdict (relative parent for the stamp slam) */}
      <div className="relative flex flex-col items-center text-center">
        <StampOverlay
          variant={passed ? (bank.gateId === 'g5' ? 'CLEARED' : 'GATE UNLOCKED') : 'GO AROUND'}
          show={showStamp}
        />
        <ScoreDial percent={pct} centerText={`${correct}/${total} · ${pct}%`} passed={passed} />

        <h2 className="h2 mt-8 text-ink-900">
          {passed ? `${nextGateLabel} is open. Nice flying.` : 'Hold short and run it back.'}
        </h2>
        <p className="body mt-3 max-w-[52ch] text-[15px] text-ink-700">
          {passed
            ? bank.gateId === 'g5'
              ? 'Every check is on the books. Finish the capstone scenarios in the Prompt Lab and the certificate is yours to print.'
              : `Score on record: ${result.best}%. ${meta.next?.title ?? ''} is boarding whenever you're ready.`
            : `You need ${passNeeded} of ${total}. The debriefs above (and one more pass through ${
                firstMissedLeg ? `Leg ${firstMissedLeg}` : 'the flagged legs'
              }) will get you there. Pilots log thousands of reps — this is yours.`}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="data rounded-[2px] border border-amber-500/50 bg-amber-100 px-3 py-1.5 text-[13px] uppercase text-amber-600">
            +{miles} MILES banked
          </span>
          <span className="data rounded-[2px] border border-line bg-paper px-3 py-1.5 text-[13px] uppercase text-ink-500">
            BEST: {result.best}% · ATTEMPT {attempts}
          </span>
          {wingBadge ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduced ? 0 : 1.1, duration: 0.3, ease: EASE }}
              className="data rounded-[2px] border border-amber-600 bg-amber-500 px-3 py-1.5 text-[13px] uppercase text-ink-900"
            >
              {wingBadge}
            </motion.span>
          ) : null}
        </div>
      </div>

      {/* Per-question breakdown — 5 mono rows, cascade 70ms */}
      <div className="mt-10 border-t border-dashed border-line pt-6">
        <p className="label text-ink-500">DEBRIEF — QUESTION BY QUESTION</p>
        <ul className="mt-4 space-y-2">
          {rows.map(({ pos, q, ok }, i) => (
            <motion.li
              key={q.id}
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.9 + i * 0.07, duration: 0.3, ease: EASE }}
              className="flex items-center gap-3 rounded-[4px] border border-line bg-paper-bright px-4 py-2.5"
            >
              <span className="data text-[12px] text-ink-500">Q{pos + 1}</span>
              {ok ? (
                <Check className="h-4 w-4 shrink-0 text-field-600" strokeWidth={2.5} aria-hidden />
              ) : (
                <X className="h-4 w-4 shrink-0 text-signal-600" strokeWidth={2.5} aria-hidden />
              )}
              <span className="data flex-1 text-[13px] text-ink-700">
                {q.topic} — {ok ? 'correct' : 'missed'}
              </span>
              {!ok && q.legRef ? (
                <Link
                  to={`/gates/${bank.gateId}/legs/${q.legRef}`}
                  className="data text-[12px] uppercase text-amber-600 underline decoration-amber-500/60 underline-offset-4 hover:text-amber-500"
                >
                  review Leg {q.legRef} →
                </Link>
              ) : null}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Targeted study plan after 3 failed attempts (quiz.md behavior notes) */}
      {!passed && attempts >= 3 && studyLegs.length > 0 ? (
        <Callout variant="tower" label="TOWER ADVISORY" title="Your study plan, straight from the tower:" className="mt-6">
          <ul className="mt-1 space-y-1.5">
            {studyLegs.map(([ref, title]) => (
              <li key={ref}>
                <Link
                  to={`/gates/${bank.gateId}/legs/${ref}`}
                  className="text-amber-600 underline decoration-amber-500/60 underline-offset-4 hover:text-amber-500"
                >
                  LEG {ref} — {title ?? 'Review leg'}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2">Run these legs, then retake. The misses above map exactly to these legs.</p>
        </Callout>
      ) : null}

      {/* Next-gate teaser (pass) */}
      {passed ? (
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 1.2, duration: 0.5, ease: EASE }}
          className="mt-8"
        >
          <Link
            to={bank.gateId === 'g5' ? '/arrival' : `/gates/${meta.next?.gateId}`}
            className="group flex items-center gap-5 rounded-[6px] border-2 border-ink-900 bg-paper-bright p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span className="flex h-14 w-14 items-center justify-center border-2 border-amber-500 bg-amber-100 font-mono text-lg font-semibold text-amber-600">
              {bank.gateId === 'g5' ? 'ARR' : meta.next?.number}
            </span>
            <span className="flex-1">
              <span className="label block text-amber-600">
                {bank.gateId === 'g5' ? 'FINAL APPROACH' : 'NOW BOARDING'}
              </span>
              <span className="h4 mt-1 block text-ink-900">
                {bank.gateId === 'g5' ? 'Capstone & certificate' : meta.next?.title}
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 text-ink-700 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </motion.div>
      ) : null}

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {passed ? (
          <>
            <Link
              to={bank.gateId === 'g5' ? '/arrival' : `/gates/${meta.next?.gateId}`}
              className="btn-primary"
            >
              {bank.gateId === 'g5' ? 'Continue to final approach' : `Board ${nextGateLabel}`}{' '}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button type="button" onClick={() => setReviewOpen((v) => !v)} className="btn-ghost">
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', reviewOpen && 'rotate-180')}
                aria-hidden
              />
              Review answers
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onRetake} className="btn-primary btn-beacon">
              <RotateCcw className="h-4 w-4" aria-hidden /> Retake the check
            </button>
            <Link to={`/gates/${bank.gateId}`} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Review Gate {gateNum(bank.gateId)} legs
            </Link>
            <button
              type="button"
              onClick={() => setReviewOpen((v) => !v)}
              className="small ml-auto text-ink-500 underline decoration-line underline-offset-4 hover:text-ink-700"
            >
              {reviewOpen ? 'Hide answer review' : 'Review answers'}
            </button>
          </>
        )}
      </div>

      {/* Answer review expander — every option with its elaborated feedback */}
      <AnimatePresence>
        {reviewOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-8 space-y-6 border-t border-dashed border-line pt-8">
              {rows.map(({ pos, q, ok }) => {
                const chosenDisplay = attempt.answers[pos];
                const chosenCanonical =
                  chosenDisplay !== null ? attempt.optionOrders[pos][chosenDisplay] : null;
                return (
                  <div key={`review-${q.id}`} className="rounded-[6px] border border-line bg-paper-bright p-5">
                    <p className="label text-ink-500">
                      Q{pos + 1} · {q.topic.toUpperCase()} ·{' '}
                      <span className={ok ? 'text-field-600' : 'text-signal-600'}>
                        {ok ? 'CLEARED' : 'GO AROUND'}
                      </span>
                    </p>
                    <p className="body-strong mt-2 text-[15px] text-ink-900">{q.question}</p>
                    {q.promptSnippet ? (
                      <pre className="prompt-text mt-3 whitespace-pre-wrap rounded-[4px] border-l-2 border-amber-500 bg-paper-dim p-3 text-[13px] text-ink-700">
                        {q.promptSnippet}
                      </pre>
                    ) : null}
                    <ul className="mt-4 space-y-2">
                      {attempt.optionOrders[pos].map((ci, di) => {
                        const option = q.options[ci];
                        const isChosen = ci === chosenCanonical;
                        return (
                          <li
                            key={`${q.id}-r${di}`}
                            className={cn(
                              'flex items-start gap-3 rounded-[4px] border px-3 py-2',
                              option.correct
                                ? 'border-field-500/50 bg-field-100'
                                : isChosen
                                  ? 'border-signal-500/50 bg-signal-100'
                                  : 'border-line bg-paper',
                            )}
                          >
                            <span className="data mt-0.5 text-[12px] text-ink-500">
                              {LETTERS[di]}
                            </span>
                            <span className="small flex-1 text-ink-700">{option.text}</span>
                            {option.correct ? (
                              <span className="label shrink-0 text-field-600">CORRECT</span>
                            ) : isChosen ? (
                              <span className="label shrink-0 text-signal-600">YOUR PICK</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    {chosenCanonical !== null ? (
                      <p className="small mt-3 border-l-2 border-line pl-3 text-ink-700">
                        {q.options[chosenCanonical].feedback}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
