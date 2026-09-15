/**
 * Gates grid (dashboard.md §S4) — 3×2 grid of GateSignCards (design.md §6):
 * 2px ink frame, giant gate number, destination title, mono meta row, status
 * chip, jet-bridge progress, check-score badge, and a veil + padlock overlay
 * when gated. Unlocked hover: lift + amber top-edge sweep. Locked hover:
 * gentle shake. Cards stagger fade-up 32px / 80ms.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { JetBridge, EASE_JET, Reveal } from '@/components/dashboard/primitives';
import type { GateState, GateStatus } from '@/components/dashboard/journey-data';

const CHIP: Record<GateStatus, { text: string; className: string; blink?: boolean }> = {
  mastered: { text: 'MASTERED', className: 'bg-field-100 text-field-600' },
  boarding: { text: 'BOARDING', className: 'bg-amber-500 text-ink-900', blink: true },
  'in-progress': { text: 'IN PROGRESS', className: 'bg-amber-100 text-amber-600' },
  'not-started': { text: 'NOT STARTED', className: 'bg-slate-100 text-slate-600' },
  locked: { text: 'LOCKED', className: 'bg-paper-dim text-ink-500' },
};

function GateCard({ gate, index }: { gate: GateState; index: number }) {
  const reduced = prefersReducedMotion();
  const locked = gate.status === 'locked';
  const chip = CHIP[gate.status];

  return (
    <motion.div
      whileHover={
        reduced
          ? undefined
          : locked
            ? { x: [0, -3, 3, -3, 0], transition: { duration: 0.4 } }
            : { y: -6, transition: { duration: 0.2, ease: EASE_JET } }
      }
      className={cn(
        'group relative flex h-full flex-col rounded-[6px] border-2 border-ink-900 bg-paper-bright p-5 shadow-card transition-shadow',
        !locked && 'hover:shadow-card-hover',
      )}
      title={locked ? `Gate ${index} opens after the Gate ${index - 1} check (≥ 80%).` : undefined}
    >
      {/* amber top-edge sweep on hover (unlocked only) */}
      {!locked ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 rounded-t-[4px] bg-amber-500 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <span className="font-sans text-5xl font-black leading-none tracking-tight text-ink-900">
          {gate.number}
        </span>
        <motion.span
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 + index * 0.08 }}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]',
            chip.className,
          )}
        >
          {chip.blink ? (
            <span aria-hidden className="h-1.5 w-1.5 animate-taxiway-blink rounded-full bg-ink-900 motion-reduce:animate-none" />
          ) : null}
          {chip.text}
        </motion.span>
      </div>

      <h3 className="h4 mt-3 text-ink-900">{gate.title}</h3>
      <p className="small mt-1 text-ink-500">{gate.subtitle}</p>

      <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">
        {gate.legsDone}/{gate.legs.length} LEGS · {gate.approxMinutes} MIN · GATE CHECK
      </p>

      <div className="mt-auto pt-4">
        <JetBridge pct={gate.pct} />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">
            {gate.mastered ? 'CHECK CLEARED' : gate.index < 5 ? `OPENS GATE ${gate.index + 1}` : 'FINAL CHECK'}
          </span>
          {gate.checkScore !== null ? (
            <span
              className={cn(
                'rounded-[2px] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide',
                gate.mastered ? 'bg-field-100 text-field-600' : 'bg-amber-100 text-amber-600',
              )}
            >
              CHECK: {gate.checkScore}%
            </span>
          ) : null}
        </div>
      </div>

      {/* lock veil */}
      {locked ? (
        <span
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[6px] bg-paper/70 p-4 text-center"
        >
          <Lock className="h-5 w-5 text-ink-500" strokeWidth={1.5} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            UNLOCKS AFTER G{gate.index - 1} CHECK ≥ 80%
          </span>
        </span>
      ) : null}
    </motion.div>
  );
}

export default function GatesGrid({ gates }: { gates: GateState[] }) {
  const reduced = prefersReducedMotion();
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {gates.map((g, i) => (
        <Reveal key={g.id} delay={reduced ? 0 : i * 0.08} y={32} className="h-full">
          {g.status === 'locked' ? (
            <GateCard gate={g} index={i} />
          ) : (
            <Link to={`/gates/${g.id}`} className="block h-full" aria-label={`Open ${g.number} — ${g.title}`}>
              <GateCard gate={g} index={i} />
            </Link>
          )}
        </Reveal>
      ))}
    </div>
  );
}
