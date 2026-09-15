import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, OctagonAlert } from 'lucide-react';
import type { Scenario } from '@/content/types';
import type { DebriefReport } from '@/content/types';
import { scenarioCode } from '@/content/scenarios';
import type { LabReport } from '@/lib/rubric';
import { SAFETY_HOLD_MESSAGE, SAFETY_HOLD_TITLE, safetyCheck } from '@/lib/rubric';
import StampOverlay from '@/components/StampOverlay';
import Callout from '@/components/Callout';
import RubricGauge from '@/components/lab/RubricGauge';
import { TECHNIQUE_CHIPS } from '@/components/lab/technique-chips';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface DebriefProps {
  scenario: Scenario;
  report: DebriefReport;
  /** The exact prompt text submitted (for the safety-hit list). */
  promptText: string;
  isNewBest: boolean;
  /** Technique chips inserted during this drafting session (synergy note). */
  chipsUsed: string[];
  onRefine: () => void;
  onNewScenario: () => void;
}

/** "Nice: you used a role chip and a format spec — that's Gate 2 + Gate 1 working together." */
function synergyNote(chipsUsed: string[]): string | null {
  const chips = chipsUsed
    .map((id) => TECHNIQUE_CHIPS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (chips.length < 2) return null;
  const [a, b] = chips;
  return `Nice: you used ${a.synergy} and ${b.synergy} — that's ${a.gate} + ${b.gate} working together.`;
}

/**
 * The Debrief (promptlab.md §S3): mono header strip, RubricGauge (dial + 8
 * sequential dimension bars), strengths-first green panel, ≤3 prioritized
 * "next altitude" suggestions, safety Hold Short variant, NEW BEST tag,
 * stamp slam at 800ms for verdicts ≥ 80.
 */
export default function Debrief({
  scenario,
  report,
  promptText,
  isNewBest,
  chipsUsed,
  onRefine,
  onNewScenario,
}: DebriefProps) {
  const [stampVisible, setStampVisible] = useState(false);
  const stampWanted = !prefersReducedMotion() && (report.safetyHold || report.total >= 80);
  // v2 advisory notes (OFF COURSE / anti-stuffing caps, contact-data advisory).
  const advisories = (report as LabReport).advisories ?? [];

  // Stamp slam at 800ms — scheduled entirely via timer callbacks.
  useEffect(() => {
    if (!stampWanted) return;
    const timers = [
      window.setTimeout(() => setStampVisible(false), 0),
      window.setTimeout(() => setStampVisible(true), 800),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stampWanted, report]);

  const synergy = synergyNote(chipsUsed);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_EXPO }}
      className="relative mt-8 overflow-hidden rounded-[10px] border-2 border-ink-900 bg-paper-bright shadow-card"
      aria-live="polite"
      aria-label="Debrief report"
    >
      {/* Header strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-ink-900 bg-paper px-5 py-3">
        <p className="label text-ink-900">
          DEBRIEF · {scenarioCode(scenario.id)} · ATTEMPT {report.attempt}
        </p>
        {isNewBest && !report.safetyHold ? (
          <motion.span
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="rounded-[2px] bg-amber-500 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-900"
          >
            NEW BEST
          </motion.span>
        ) : null}
        <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.12em] text-ink-300">
          DETERMINISTIC · NO AI INVOLVED
        </span>
      </div>

      <div className="p-5 sm:p-7">
        {report.safetyHold ? (
          /* ── Safety Hold Short variant (§S4 tripwire) ─────────────────── */
          <div>
            <Callout variant="hold-short" title={SAFETY_HOLD_TITLE}>
              <p>{SAFETY_HOLD_MESSAGE}</p>
              <SafetyHits promptText={promptText} />
            </Callout>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={onRefine}>
                Remove it &amp; retransmit →
              </button>
              <button type="button" className="btn-ghost" onClick={onNewScenario}>
                New scenario
              </button>
            </div>
          </div>
        ) : (
          /* ── Standard debrief ─────────────────────────────────────────── */
          <div>
            <RubricGauge report={report} />

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {/* Strengths first */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_EXPO, delay: 0.9 }}
                className="rounded-[6px] border border-field-500/40 bg-field-100 p-5"
              >
                <p className="label text-field-600">STRENGTHS — LOGGED FIRST</p>
                {report.strengths.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {report.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-[15px] leading-snug text-ink-900">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-field-600" strokeWidth={2.5} aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[15px] text-ink-700">
                    No dimension at full marks yet — that&apos;s the mission for the next attempt.
                  </p>
                )}
              </motion.div>

              {/* Next altitude — ≤3 prioritized suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_EXPO, delay: 1.0 }}
                className="rounded-[6px] border border-amber-500/40 bg-amber-100 p-5"
              >
                <p className="label text-amber-600">NEXT ALTITUDE — CLIMB IN ORDER</p>
                {report.nextAltitude.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {report.nextAltitude.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-[15px] leading-snug text-ink-900">
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[15px] text-ink-700">
                    Level flight — nothing to correct. Take a harder scenario for departure.
                  </p>
                )}
              </motion.div>
            </div>

            {advisories.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_EXPO, delay: 1.1 }}
                className="mt-4 rounded-[6px] border border-slate-500/40 bg-slate-100 p-5"
                role="note"
              >
                <p className="label text-slate-600">TOWER ADVISORY</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {advisories.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-[15px] leading-snug text-ink-900">
                      <OctagonAlert className="mt-1 h-4 w-4 shrink-0 text-slate-600" strokeWidth={1.5} aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : null}

            {synergy ? (
              <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.1em] text-slate-600">
                {synergy}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={onRefine}>
                Refine &amp; retransmit →
              </button>
              <button type="button" className="btn-ghost" onClick={onNewScenario}>
                New scenario
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stamp slam at 800ms for verdicts ≥ 80 (and HOLD SHORT on the tripwire) */}
      <StampOverlay
        variant={report.safetyHold ? 'HOLD SHORT' : 'CLEARED'}
        show={stampWanted && stampVisible}
      />
    </motion.section>
  );
}

function SafetyHits({ promptText }: { promptText: string }) {
  const hits = safetyCheck(promptText).hits;
  if (hits.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {hits.map((h) => (
        <li key={h} className="flex items-start gap-2 font-mono text-[12px] text-signal-600">
          <OctagonAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
          Detected: {h}
        </li>
      ))}
    </ul>
  );
}
