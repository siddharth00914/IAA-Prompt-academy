import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import ProgressRunway from '@/components/quiz/ProgressRunway';
import QuizOptionCard, { type OptionVisualState } from '@/components/quiz/QuizOptionCard';
import { isAnswerCorrect, type QuizAttempt } from '@/components/quiz/attempt';
import type { GateCheckBank } from '@/content/types';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LETTERS = ['A', 'B', 'C', 'D'];

interface QuestionScreenProps {
  bank: GateCheckBank;
  attempt: QuizAttempt;
  onAnswer: (displayIndex: number) => void;
  onNext: () => void;
}

/**
 * S2 — Question Screen (quiz.md §S2): progress runway, one question at a time,
 * runway-designator option cards, elaborated feedback keyed to the chosen
 * option, then Next/See-results. No back navigation — retake is free.
 *
 * Assessment-integrity pass (delayed reveal): the first pick per question is
 * what the parent records (and scores). A miss shows feedback that teaches
 * without naming the right option, and the learner gets one more approach —
 * the correct answer is revealed only after a 2nd miss on that question (or
 * later in the end-of-check review). Correct answers found on the retry still
 * clear the question, but the scoresheet keeps the first approach.
 */
export default function QuestionScreen({ bank, attempt, onAnswer, onNext }: QuestionScreenProps) {
  const reduced = prefersReducedMotion();
  const pos = attempt.current;
  const n = bank.questions.length;
  const question = bank.questions[attempt.order[pos]];
  const displayOptions = attempt.optionOrders[pos].map((ci) => question.options[ci]);
  const firstPick = attempt.answers[pos];

  // Retry picks after the recorded first approach, per presented position.
  const [extraPicks, setExtraPicks] = useState<Record<number, number[]>>({});
  const [prevGateId, setPrevGateId] = useState(bank.gateId);
  if (bank.gateId !== prevGateId) {
    setPrevGateId(bank.gateId);
    setExtraPicks({});
  }

  const picks: number[] = [
    ...(firstPick !== null ? [firstPick] : []),
    ...(extraPicks[pos] ?? []),
  ];
  const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;
  const missCount = picks.filter((di) => !displayOptions[di].correct).length;
  const clearedOn = picks.find((di) => displayOptions[di].correct) ?? null;
  const answered = picks.length > 0;
  const answeredCorrect = clearedOn !== null;
  /** Question is finished: cleared on some approach, or answer revealed after 2 misses. */
  const resolved = answeredCorrect || missCount >= 2;
  const isLast = pos === n - 1;

  const lights = attempt.order.map((_, i) => {
    if (attempt.answers[i] !== null) return isAnswerCorrect(bank, attempt, i) ? 'correct' : 'wrong';
    return i === pos ? 'current' : 'upcoming';
  }) as ('correct' | 'wrong' | 'current' | 'upcoming')[];

  const stateFor = (displayIdx: number): OptionVisualState => {
    const picked = picks.includes(displayIdx);
    if (picked) return displayOptions[displayIdx].correct ? 'correct' : 'wrong';
    // Reveal the right answer only once the question is resolved (a clear on
    // any approach, or the 2nd miss) — never on a lone first miss.
    if (resolved && displayOptions[displayIdx].correct) return 'correct';
    if (resolved) return 'dimmed';
    return 'default';
  };

  const handleSelect = (displayIdx: number) => {
    if (resolved || picks.includes(displayIdx)) return;
    if (firstPick === null) onAnswer(displayIdx);
    else setExtraPicks((prev) => ({ ...prev, [pos]: [...(prev[pos] ?? []), displayIdx] }));
  };

  const feedback = lastPick !== null ? displayOptions[lastPick].feedback : null;
  const correctOption = question.options.find((o) => o.correct) ?? null;
  const reviewUrl = question.legRef ? `/gates/${bank.gateId}/legs/${question.legRef}` : null;

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <ProgressRunway lights={lights} />
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="label text-ink-700">
          QUESTION {pos + 1}/{n}
        </span>
        <span className="label hidden text-ink-500 sm:inline">UNTIMED — AIRSPEED IS YOUR OWN</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pos}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0.15 } }
              : { opacity: 0, x: -40, transition: { duration: 0.25 } }
          }
          transition={{ duration: reduced ? 0.2 : 0.3, ease: EASE }}
          className="mt-6"
        >
          <div className="rounded-[6px] border border-line bg-paper-bright p-6 shadow-card sm:p-8">
            <h2 className="h3 max-w-[30ch] text-ink-900">{question.question}</h2>
            {question.promptSnippet ? (
              <pre className="prompt-text mt-5 whitespace-pre-wrap rounded-[4px] border-l-2 border-amber-500 bg-paper-dim p-4 text-ink-700">
                {question.promptSnippet}
              </pre>
            ) : null}
          </div>

          <motion.ul
            className="mt-5 space-y-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
            }}
          >
            {displayOptions.map((option, di) => (
              <motion.li
                key={`${question.id}-${di}`}
                variants={{
                  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
                }}
              >
                <QuizOptionCard
                  letter={LETTERS[di] ?? String(di + 1)}
                  text={option.text}
                  state={stateFor(di)}
                  name={`quiz-q-${question.id}`}
                  disabled={resolved || picks.includes(di)}
                  onSelect={() => handleSelect(di)}
                />
              </motion.li>
            ))}
          </motion.ul>

          {/* Feedback panel — unfolds on answer (height 0→auto 350ms, content fades 100ms later) */}
          <div aria-live="polite" role="status">
            <AnimatePresence>
              {answered && feedback !== null ? (
                <motion.div
                  key={`feedback-${pos}-${picks.length}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduced ? 0.15 : 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduced ? 0 : 0.1, duration: 0.25 }}
                    className={cn(
                      'mt-5 rounded-[6px] border p-5',
                      answeredCorrect
                        ? 'border-field-500/40 bg-field-100'
                        : 'border-signal-500/40 bg-signal-100',
                    )}
                  >
                    <p
                      className={cn(
                        'label flex items-center gap-2',
                        answeredCorrect ? 'text-field-600' : 'text-signal-600',
                      )}
                    >
                      {answeredCorrect ? (
                        <>
                          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> CLEARED ✓
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" strokeWidth={2.5} aria-hidden /> GO AROUND ✗
                        </>
                      )}
                    </p>
                    <p className="small mt-3 text-ink-700">{feedback}</p>
                    {answeredCorrect && firstPick !== null && !displayOptions[firstPick].correct ? (
                      <p className="data mt-3 text-[12px] uppercase tracking-wide text-ink-500">
                        Cleared on the go-around — the scoresheet keeps your first approach.
                      </p>
                    ) : null}
                    {!answeredCorrect && missCount === 1 ? (
                      <p className="data mt-3 text-[12px] uppercase tracking-wide text-ink-500">
                        One more approach — pick again. The tower hands you the cleared answer after
                        a second miss.
                      </p>
                    ) : null}
                    {!answeredCorrect && missCount >= 2 && correctOption ? (
                      <div className="mt-4 rounded-[4px] border border-field-500/50 bg-field-100 p-4">
                        <p className="label text-field-600">TOWER HANDOFF — CLEARED ANSWER</p>
                        <p className="body-strong mt-2 text-[15px] text-ink-900">
                          {correctOption.text}
                        </p>
                        <p className="small mt-2 text-ink-700">{correctOption.feedback}</p>
                      </div>
                    ) : null}
                    {reviewUrl ? (
                      <Link
                        to={reviewUrl}
                        className="data mt-4 inline-flex items-center gap-1 text-[12px] uppercase tracking-wide text-amber-600 underline decoration-amber-500/60 underline-offset-4 hover:text-amber-500"
                      >
                        REVIEW: LEG {question.legRef} — {question.topic.toUpperCase()}{' '}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    ) : null}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="small text-ink-500">
              {answered ? null : 'Select an answer to see the debrief.'}
            </span>
            <AnimatePresence>
              {resolved ? (
                <motion.button
                  key={`next-${pos}`}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onClick={onNext}
                  className="btn-primary"
                >
                  {isLast ? 'See results' : 'Next question'}{' '}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
