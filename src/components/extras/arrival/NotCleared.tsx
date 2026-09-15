import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Check, Plane, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import {
  CAPSTONE_SCENARIO_IDS,
  CAPSTONE_PASS_SCORE,
  PASS_SCORE,
  capstoneClearedCount,
  useProgress,
} from '@/lib/progress';
import { GATES } from '@/content/gates';
import { cn } from '@/lib/utils';

const REQUIRED_GATES = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'] as const;
const TOTAL_LEGS = GATES.reduce((n, g) => n + g.legs.length, 0);

/**
 * "Not yet cleared for arrival" — elegant holding state shown when
 * canCertify() is false. Lists exactly what is still outstanding.
 */
export default function NotCleared() {
  const progress = useProgress();
  const { showToast } = useToast();
  const toasted = useRef(false);

  useEffect(() => {
    if (toasted.current) return;
    toasted.current = true;
    showToast('TOWER:', 'Not yet cleared for arrival — capstone and final check outstanding.');
  }, [showToast]);

  const capstoneDone = capstoneClearedCount();
  const legsDone = GATES.reduce(
    (n, gate) => n + gate.legs.filter((leg) => progress.gates[gate.id]?.legs[leg.id] === 'done').length,
    0,
  );
  const legsComplete = legsDone >= TOTAL_LEGS;
  const missingChecks = REQUIRED_GATES.filter((g) => (progress.gates[g]?.checkScore ?? 0) < PASS_SCORE);
  const missingCapstone = CAPSTONE_SCENARIO_IDS.filter(
    (id) => (progress.lab[id]?.bestScore ?? 0) < CAPSTONE_PASS_SCORE,
  );

  return (
    <section className="bg-paper">
      <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-[820px] flex-col items-center justify-center px-6 py-24 text-center">
        {/* holding pattern */}
        <div className="relative h-40 w-64" aria-hidden>
          <div className="absolute inset-0 rounded-[50%] border-2 border-dashed border-ink-300" />
          <div className="absolute inset-0 animate-radar-sweep motion-reduce:animate-none" style={{ animationDuration: '9s' }}>
            <Plane
              className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-90 text-amber-600"
              strokeWidth={1.5}
            />
          </div>
          <p className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            HOLDING PATTERN
          </p>
        </div>

        <p className="label mt-8 text-amber-600">ARRIVAL GATE · STAND BY</p>
        <h1 className="h1 mt-4 text-ink-900">Not yet cleared for arrival.</h1>
        <p className="body mt-4 max-w-[56ch] text-ink-700">
          The certificate prints when the flight plan is complete: every flight leg flown,
          all six gate checks at 80% or better, and the three capstone scenarios cleared at
          70+ in the Lab. Here is the outstanding traffic:
        </p>

        {/* missing items */}
        <div className="mt-8 w-full max-w-[560px] rounded-[6px] border border-line bg-paper-bright p-5 text-left shadow-card">
          <p className="label text-ink-500">OUTSTANDING BEFORE ARRIVAL</p>
          <ul className="mt-4 space-y-2.5">
            <li className="flex items-center justify-between gap-3">
              <span className="data text-[13px] uppercase tracking-[0.1em] text-ink-700">
                FLIGHT LEGS · GATES 0–5
              </span>
              <span
                className={cn(
                  'data flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]',
                  legsComplete ? 'text-field-600' : 'text-signal-600',
                )}
              >
                {legsComplete ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> {legsDone}/{TOTAL_LEGS} — LOGGED
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {legsDone}/{TOTAL_LEGS} FLOWN
                  </>
                )}
              </span>
            </li>
            {REQUIRED_GATES.map((g) => {
              const score = progress.gates[g]?.checkScore ?? null;
              const passed = (score ?? 0) >= PASS_SCORE;
              return (
                <li key={g} className="flex items-center justify-between gap-3">
                  <span className="data text-[13px] uppercase tracking-[0.1em] text-ink-700">
                    GATE CHECK {g.slice(1)}
                  </span>
                  <span
                    className={cn(
                      'data flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]',
                      passed ? 'text-field-600' : 'text-signal-600',
                    )}
                  >
                    {passed ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> {score}% — LOGGED
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        {score === null ? 'NOT ATTEMPTED' : `${score}% — NEEDS ${PASS_SCORE}%`}
                      </>
                    )}
                  </span>
                </li>
              );
            })}
            <li className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
              <span className="data text-[13px] uppercase tracking-[0.1em] text-ink-700">
                CAPSTONE CHAIN · WTP-L10/11/12
              </span>
              <span
                className={cn(
                  'data flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]',
                  missingCapstone.length === 0 ? 'text-field-600' : 'text-signal-600',
                )}
              >
                {missingCapstone.length === 0 ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> 3/3 CLEARED {CAPSTONE_PASS_SCORE}+
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {capstoneDone}/3 CLEARED {CAPSTONE_PASS_SCORE}+
                  </>
                )}
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/journey" className="btn-primary">
            Back to the journey →
          </Link>
          {missingChecks.length === 0 ? (
            <Link to="/lab" className="btn-ghost">
              Fly the capstone in the Lab
            </Link>
          ) : (
            <Link to={`/gates/${missingChecks[0]}/check`} className="btn-ghost">
              Next: Gate Check {missingChecks[0].slice(1)}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
