import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, OctagonAlert } from 'lucide-react';
import { useToast } from '@/components/Toast';
import PreCheckCard from '@/components/quiz/PreCheckCard';
import QuestionScreen from '@/components/quiz/QuestionScreen';
import ResultsScreen, { type QuizResult } from '@/components/quiz/ResultsScreen';
import {
  buildAttempt,
  clearAttemptSession,
  countCorrect,
  loadAttemptSession,
  saveAttemptSession,
  type QuizAttempt,
} from '@/components/quiz/attempt';
import { getQuizBank, QUIZ_GATE_META } from '@/content/quizzes';
import {
  awardWing,
  getProgress,
  hasWing,
  isGateUnlocked,
  PASS_SCORE,
  recordCheckScore,
  useProgress,
  WINGS,
} from '@/lib/progress';

type Phase = 'intro' | 'question' | 'results';

/**
 * Gate Check (`/gates/:gateId/check`, quiz.md): pre-flight rules card →
 * one-question-at-a-time flow with instant elaborated per-option feedback →
 * animated score reveal. ≥80% passes and unlocks the next gate via the
 * progress store (`recordCheckScore` keeps the best score, +30 miles per
 * attempt). Retakeable, shuffled per attempt, mid-check session resume.
 */
export default function GateCheck() {
  const { gateId: rawGateId } = useParams();
  const bank = getQuizBank(rawGateId);
  const progress = useProgress();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('intro');
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const recordedRef = useRef(false);

  const gateId = bank?.gateId;
  const meta = gateId ? QUIZ_GATE_META[gateId] : null;

  // Offer resume when a mid-check session exists for this gate — lazy load on
  // mount, re-load if the routed gate changes while mounted (React's
  // adjust-state-during-render pattern; no effect needed).
  const [sessionAttempt, setSessionAttempt] = useState<QuizAttempt | null>(() =>
    gateId && bank ? loadAttemptSession(gateId, bank) : null,
  );
  const [prevGateId, setPrevGateId] = useState(gateId);
  if (gateId !== prevGateId) {
    setPrevGateId(gateId);
    setSessionAttempt(gateId && bank ? loadAttemptSession(gateId, bank) : null);
  }

  // Return to top on phase transitions (Layout only handles route changes).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  if (!bank || !meta || !gateId) {
    return (
      <section className="bg-paper">
        <div className="mx-auto flex min-h-[60vh] max-w-[760px] flex-col items-start justify-center px-6 py-24">
          <p className="label text-signal-600">OFF ROUTE</p>
          <h1 className="h1 mt-4 text-ink-900">This gate isn&rsquo;t on the flight plan.</h1>
          <p className="body mt-4 text-ink-700">
            Gate Checks live at gates G0–G5. Head back to the journey map and pick a gate that
            exists.
          </p>
          <Link to="/journey" className="btn-primary mt-8">
            Back to the journey map <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const gateIndex = Number(gateId.replace('g', ''));
  const gateRecord = progress.gates[gateId];
  const unlocked = isGateUnlocked(gateId);

  // Locked gate — hold short (mirrors module.md §S6 gating copy).
  if (!unlocked) {
    const prevId = `g${gateIndex - 1}`;
    return (
      <section className="bg-paper">
        <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col justify-center px-6 py-24">
          <div className="relative border-2 border-ink-900 bg-paper-bright p-1.5 shadow-card">
            <div className="border border-line px-6 py-10 sm:px-10">
              <p className="label flex items-center gap-2 text-signal-600">
                <OctagonAlert className="h-4 w-4" strokeWidth={1.5} aria-hidden /> HOLD SHORT
              </p>
              <h1 className="h1 mt-4 text-ink-900">Gate Check {gateIndex} is still locked.</h1>
              <p className="body mt-4 text-ink-700">
                This check opens when you score {PASS_SCORE}% or better on the Gate{' '}
                {gateIndex - 1} check. One clean approach at a time.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={`/gates/${prevId}/check`} className="btn-primary">
                  Go to Gate {gateIndex - 1} check <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link to={`/gates/${gateId}`} className="btn-ghost">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Preview Gate {gateIndex}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const startFresh = () => {
    const fresh = buildAttempt(bank);
    clearAttemptSession(gateId);
    saveAttemptSession(gateId, fresh);
    recordedRef.current = false;
    setAttempt(fresh);
    setResult(null);
    setPhase('question');
  };

  const resume = () => {
    if (!sessionAttempt) return;
    const firstOpen = sessionAttempt.answers.findIndex((a) => a === null);
    const resumed: QuizAttempt = {
      ...sessionAttempt,
      current: firstOpen === -1 ? 0 : firstOpen,
    };
    recordedRef.current = false;
    setAttempt(resumed);
    setResult(null);
    setPhase('question');
  };

  const handleAnswer = (displayIndex: number) => {
    setAttempt((prev) => {
      if (!prev || prev.answers[prev.current] !== null) return prev;
      const answers = [...prev.answers];
      answers[prev.current] = displayIndex;
      const next = { ...prev, answers };
      saveAttemptSession(gateId, next);
      return next;
    });
  };

  const finish = (final: QuizAttempt) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    const total = bank.questions.length;
    const correct = countCorrect(bank, final);
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= PASS_SCORE;
    // State write (quiz.md §S4): best score kept, attempts++, +30 miles — then wing checks.
    const best = recordCheckScore(gateId, pct);
    const attempts = getProgress().gates[gateId]?.checkAttempts ?? 1;
    let wingEarned = false;
    if (gateId === 'g1' && pct >= 90 && !hasWing(WINGS.DELIMITERS_ACE)) {
      awardWing(WINGS.DELIMITERS_ACE);
      wingEarned = true;
      showToast('TOWER:', 'Delimiters Ace wing earned — 90%+ on Gate Check 1.');
    }
    clearAttemptSession(gateId);
    setSessionAttempt(null);
    setResult({ correct, total, pct, passed, attempts, best, wingEarned });
    setPhase('results');
  };

  const handleNext = () => {
    if (!attempt) return;
    if (attempt.current >= bank.questions.length - 1) {
      finish(attempt);
      return;
    }
    const next = { ...attempt, current: attempt.current + 1 };
    saveAttemptSession(gateId, next);
    setAttempt(next);
  };

  const resumeAt = (() => {
    if (!sessionAttempt || phase !== 'intro') return null;
    const firstOpen = sessionAttempt.answers.findIndex((a) => a === null);
    return firstOpen === -1 ? null : firstOpen;
  })();

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-16 md:py-24">
        {phase === 'intro' ? (
          <PreCheckCard
            bank={bank}
            meta={meta}
            bestScore={gateRecord?.checkScore ?? null}
            attempts={gateRecord?.checkAttempts ?? 0}
            resumeAt={resumeAt}
            onStart={startFresh}
            onResume={resume}
          />
        ) : null}

        {phase === 'question' && attempt ? (
          <QuestionScreen bank={bank} attempt={attempt} onAnswer={handleAnswer} onNext={handleNext} />
        ) : null}

        {phase === 'results' && attempt && result ? (
          <ResultsScreen bank={bank} meta={meta} attempt={attempt} result={result} onRetake={startFresh} />
        ) : null}
      </div>
    </section>
  );
}
