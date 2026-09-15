import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import SplitFlap from '@/components/SplitFlap';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';
import { ACCENT_NUMBER_DARK } from '@/content/gates';
import type { GateContent } from '@/content/gates';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

export type GateStatus = 'NOT STARTED' | 'BOARDING' | 'IN PROGRESS' | 'MASTERED';

const STATUS_CLASSES: Record<GateStatus, string> = {
  'NOT STARTED': 'border-slate-500/60 bg-slate-100 text-slate-600',
  BOARDING: 'border-amber-500/60 bg-amber-100 text-amber-600',
  'IN PROGRESS': 'border-amber-500/60 bg-amber-100 text-amber-600',
  MASTERED: 'border-field-500/60 bg-field-100 text-field-600',
};

/**
 * Gate hero — the signage wall (module.md §S1). Ink-900 panel with a 2px ink
 * frame and inner paper hairline; giant gate number split-flaps in, meta rows
 * cascade, and a segmented jet-bridge progress bar shows legs complete.
 * Reveals with the signage "power-on" flicker (two blinks, 500ms).
 */
export default function GateHero({
  gate,
  status,
  pct,
}: {
  gate: GateContent;
  status: GateStatus;
  pct: number;
}) {
  const reduced = prefersReducedMotion();
  const metaRows = [
    `${gate.legs.length} LEGS · ≈${gate.approxMinutes} MIN`,
    `GATE CHECK: ${gate.check.questionCount} QUESTIONS · PASS ≥ ${gate.check.passScore}%`,
  ];
  return (
    <motion.div
      className="relative overflow-hidden rounded-[10px] border-2 border-ink-900 bg-ink-900 shadow-card"
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 0.25, 1] }}
      transition={reduced ? { duration: 0.01 } : { duration: 0.5, times: [0, 0.45, 0.7, 1] }}
    >
      <div className="grain-night" aria-hidden />
      <div className="relative m-2 rounded-[6px] border border-paper/15 p-6 md:m-3 md:p-8">
        <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">
          {/* giant gate number (split-flaps from G– to Gn) */}
          <div
            className={cn(
              'font-sans text-[96px] font-black leading-none tracking-[-0.03em] md:text-[120px]',
              ACCENT_NUMBER_DARK[gate.accent],
            )}
          >
            <SplitFlap text={gate.number} startDelay={200} stagger={120} />
          </div>

          {/* title stack */}
          <div className="min-w-0">
            <p className={cn('label', ACCENT_NUMBER_DARK[gate.accent])}>
              GATE {gate.index} · BOARDING ORDER {gate.boardingOrder}/6
            </p>
            <h1 className="display-2 mt-3 text-fog-100">{gate.title}</h1>
            <p className="body mt-3 max-w-[52ch] text-fog-300">{gate.subtitle}</p>
          </div>

          {/* meta stack */}
          <div className="space-y-2 md:text-right">
            {metaRows.map((row, i) => (
              <motion.p
                key={row}
                className="data text-fog-300"
                initial={reduced ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.07, ease: EASE_EXPO }}
              >
                {row}
              </motion.p>
            ))}
            <motion.div
              initial={reduced ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.64, ease: EASE_EXPO }}
              className="flex md:justify-end"
            >
              <span
                className={cn(
                  'rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em]',
                  STATUS_CLASSES[status],
                )}
              >
                STATUS: {status}
              </span>
            </motion.div>
          </div>
        </div>

        {/* jet-bridge progress */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="label text-fog-500">JET BRIDGE · LEGS COMPLETE</span>
            <span className="data text-fog-300">{pct}%</span>
          </div>
          <div className="relative mt-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className={cn(
                    'h-2 flex-1 origin-left rounded-[1px]',
                    i < Math.round((pct / 100) * 12) ? 'bg-amber-500' : 'bg-tarmac-700',
                  )}
                  initial={reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.05, ease: EASE_EXPO }}
                />
              ))}
            </div>
            <Plane
              aria-hidden
              className="absolute -top-[7px] h-4 w-4 text-glow-amber"
              strokeWidth={1.5}
              style={{ left: `calc(${Math.max(2, pct)}% - 8px)` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
