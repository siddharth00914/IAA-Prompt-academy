import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';
import type { DebriefReport } from '@/content/types';
import { RUBRIC_META } from '@/lib/rubric';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Keyed by string so the v2 OFF COURSE verdict (outside the frozen
// types.ts union) gets a tone too; unknown verdicts fall back to red.
const VERDICT_TONE: Record<string, string> = {
  'GOLD PROMPT': 'border-amber-600 bg-amber-100 text-amber-600',
  CLEARED: 'border-field-600 bg-field-100 text-field-600',
  'WORKABLE — REFINE': 'border-slate-600 bg-slate-100 text-slate-600',
  'RETURN TO RAMP': 'border-signal-600 bg-signal-100 text-signal-600',
  'OFF COURSE': 'border-signal-600 bg-signal-100 text-signal-600',
};

/** Animated count-up number (900ms per promptlab.md §S3). */
function CountUp({ value, className }: { value: number; className?: string }) {
  const reduced = prefersReducedMotion();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (reduced) return; // reduced motion renders the final value directly
    const controls = animate(0, value, {
      duration: 0.9,
      ease: EASE_EXPO,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduced]);
  return <span className={className}>{reduced ? value : display}</span>;
}

interface RubricGaugeProps {
  report: DebriefReport;
  /** Delay (s) before the sequence starts — lets the debrief panel settle first. */
  startDelay?: number;
}

/**
 * RubricGauge (design.md §6, promptlab.md §S3): 140px SVG score ring with
 * animated arc + mono count-up, verdict chip beneath, and the 8 dimension
 * bars extending sequentially (120ms stagger) with earned/max + detector notes.
 */
export default function RubricGauge({ report, startDelay = 0.15 }: RubricGaugeProps) {
  const R = 62;
  const C = 2 * Math.PI * R;
  const target = C * (1 - report.total / 100);

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      {/* Score dial */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-[140px] w-[140px]">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={R} fill="none" stroke="#EDE7D9" strokeWidth="12" />
            <motion.circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={report.total >= 80 ? '#3F7D5C' : report.total >= 60 ? '#E09112' : '#C24A3B'}
              strokeWidth="12"
              strokeLinecap="butt"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: target }}
              transition={{ duration: 0.9, ease: EASE_EXPO, delay: startDelay }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[34px] font-semibold leading-none text-ink-900">
              <CountUp value={report.total} />
              <span className="text-[18px] text-ink-500">/100</span>
            </span>
            <span className="label mt-2 text-ink-500">DEBRIEF SCORE</span>
          </div>
        </div>
        <span
          className={cn(
            'rounded-[2px] border-2 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.14em]',
            VERDICT_TONE[report.verdict] ?? VERDICT_TONE['RETURN TO RAMP'],
          )}
        >
          {report.verdict}
        </span>
      </div>

      {/* Dimension bars */}
      <ol className="flex flex-col gap-3">
        {report.dimensions.map((d, i) => {
          const meta = RUBRIC_META.find((m) => m.id === d.dimensionId);
          const pct = (d.earned / d.max) * 100;
          const full = d.earned === d.max;
          const zero = d.earned === 0;
          return (
            <li key={d.dimensionId}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="body-strong text-[15px] text-ink-900">
                  {meta?.name ?? d.dimensionId}
                  <span className="ml-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-300">
                    wt {d.max}
                  </span>
                </span>
                <span className="font-mono text-[13px] font-medium text-ink-700">
                  {d.earned}/{d.max}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-[2px] bg-paper-dim">
                <motion.div
                  className={cn(
                    'h-full rounded-[2px]',
                    full ? 'bg-field-500' : zero ? 'bg-ink-300' : 'bg-amber-500',
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: EASE_EXPO, delay: startDelay + i * 0.12 }}
                />
              </div>
              <p className="mt-1 font-mono text-[12px] leading-snug text-ink-500">{d.note}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
