import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import Callout from '@/components/Callout';
import type { GateCheckBank } from '@/content/types';
import type { QuizGateMeta } from '@/content/quizzes';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

interface PreCheckCardProps {
  bank: GateCheckBank;
  meta: QuizGateMeta;
  /** Best score so far (null = never attempted). */
  bestScore: number | null;
  attempts: number;
  /** Resume position (0-based) if a session is in progress, else null. */
  resumeAt: number | null;
  onStart: () => void;
  onResume: () => void;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * S1 — Pre-Check Card (quiz.md §S1): centered pre-flight checklist card,
 * 2px ink frame, checklist glyphs down the left margin. Card rises
 * (fade-up 32px, 0.6s); rows check off in sequence (120ms stagger).
 */
export default function PreCheckCard({
  bank,
  meta,
  bestScore,
  attempts,
  resumeAt,
  onStart,
  onResume,
}: PreCheckCardProps) {
  const reduced = prefersReducedMotion();
  const n = bank.questions.length;
  const passNeeded = Math.ceil(0.8 * n);
  const gateIndex = bank.gateId.replace('g', '');
  const mastered = (bestScore ?? 0) >= 80;

  const rows: string[] = [
    `${n} QUESTIONS — multiple choice`,
    `PASS: 80% (${passNeeded} of ${n}) — ${meta.unlockLabel}`,
    'RETAKE: unlimited, anytime — no record but your best',
    'FEEDBACK: instant; answer revealed only after a 2nd miss',
    'MILES: +30 per attempt, pass or not',
  ];
  if (bank.gateId === 'g1') rows.push('BONUS: 90%+ EARNS THE DELIMITERS ACE WING');
  if (bank.gateId === 'g2') rows.push('BONUS: 90%+ EARNS THE PERSONA PILOT WING');
  if (bank.gateId === 'g3') rows.push('BONUS: 90%+ EARNS THE COT NAVIGATOR WING');

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.6, ease: EASE }}
      className="mx-auto w-full max-w-[640px]"
    >
      <div className="border-2 border-ink-900 bg-paper-bright p-1.5 shadow-card">
        <div className="border border-line px-6 py-8 sm:px-10">
          <p className="label text-amber-600">
            {bank.gateId === 'g5'
              ? 'GATE CHECK 5 · FINAL CHECK'
              : `GATE CHECK ${gateIndex} · CLEARANCE EXAM`}
          </p>
          <h1 className="h1 mt-4 text-ink-900">{meta.introHeadline}</h1>
          <p className="small mt-2 text-ink-500">
            {meta.number} · {meta.title}
          </p>

          {/* Checklist — mono data rows, amber check squares down the left margin */}
          <ul className="mt-8 space-y-3 border-t border-dashed border-line pt-6">
            {rows.map((row, i) => (
              <motion.li
                key={row}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduced ? 0 : 0.3 + i * 0.12, duration: 0.25 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  aria-hidden
                  initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reduced ? 0 : 0.35 + i * 0.12, duration: 0.25, ease: EASE }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center border-2 border-amber-500 bg-amber-100"
                >
                  <Check className="h-3.5 w-3.5 text-amber-600" strokeWidth={3} />
                </motion.span>
                <span className="data text-[13px] uppercase tracking-wide text-ink-700">{row}</span>
              </motion.li>
            ))}
          </ul>

          <p className="body mt-8 text-[15px] text-ink-700">
            This isn&rsquo;t an exam to survive — it&rsquo;s reps. Answer, read the debrief, and if
            you miss one, the debrief tells you exactly which leg to review.
          </p>

          {attempts > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="data rounded-[2px] border border-line bg-paper px-2.5 py-1 text-[12px] uppercase text-ink-700">
                BEST: {bestScore ?? 0}% · ATTEMPTS: {attempts}
              </span>
              {mastered ? (
                <span className="data rounded-[2px] border border-field-500 bg-field-100 px-2.5 py-1 text-[12px] uppercase text-field-600">
                  CLEARED — on record
                </span>
              ) : null}
            </div>
          ) : null}

          {resumeAt !== null ? (
            <Callout variant="tower" label="CHECK IN PROGRESS" className="mt-6">
              <p>
                You parked this check at question {resumeAt + 1} of {n}. Resume where you left off,
                or start a fresh approach.
              </p>
            </Callout>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {resumeAt !== null ? (
              <>
                <button type="button" onClick={onResume} className="btn-primary btn-beacon">
                  Resume — Q{resumeAt + 1}/{n} <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={onStart} className="btn-ghost">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Start fresh
                </button>
              </>
            ) : (
              <button type="button" onClick={onStart} className="btn-primary btn-beacon">
                {attempts > 0 ? 'Retake the check' : 'Start the check'}{' '}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
            <Link to={`/gates/${bank.gateId}`} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Gate {gateIndex}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
