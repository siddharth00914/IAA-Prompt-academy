import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import { useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';
import { LEG_TYPE_CLASSES } from '@/content/gates';
import type { GateContent } from '@/content/gates';

/**
 * One leg row in the gate's route list (module.md §S3): node dot on the
 * vertical path line, leg code chip, type tag, title, one-line description,
 * duration, and a status icon (drawn-on ✓ when done, amber arrow when open,
 * padlock when locked). Completed rows stay replayable — "review is free".
 */
export default function LegRow({
  gate,
  leg,
  index,
  locked,
}: {
  gate: GateContent;
  leg: GateContent['legs'][number];
  index: number;
  locked: boolean;
}) {
  const reduced = prefersReducedMotion();
  const progress = useProgress();
  const done = progress.gates[gate.id]?.legs[leg.id] === 'done';

  const inner = (
    <>
      {/* node dot on the path line */}
      <span className="relative mt-1 flex w-5 shrink-0 justify-center">
        <span
          className={cn(
            'relative z-10 mt-1 h-3 w-3 rounded-full border-2',
            done
              ? 'border-field-500 bg-field-500'
              : locked
                ? 'border-ink-300 bg-paper'
                : 'border-amber-500 bg-paper-bright',
          )}
        >
          {!done && !locked && !reduced ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-amber-500"
              initial={{ scale: 0, opacity: 0.8 }}
              whileInView={{ scale: 1.8, opacity: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 + index * 0.12 }}
            />
          ) : null}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-[2px] border border-ink-900/40 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-ink-700">
            {leg.code}
          </span>
          <span
            className={cn(
              'rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]',
              LEG_TYPE_CLASSES[leg.type],
            )}
          >
            {leg.type}
          </span>
          <span className="data ml-auto text-ink-500">{leg.durationMin} MIN</span>
        </span>
        <span className="h4 mt-2 block text-ink-900">{leg.title}</span>
        <span className="small mt-1 block text-ink-500">{leg.description}</span>
      </span>

      <span className="mt-1 shrink-0">
        {done ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-field-600" aria-label="Completed">
            <motion.path
              d="M4 12.5l5 5L20 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          </svg>
        ) : locked ? (
          <Lock className="h-4 w-4 text-ink-300" strokeWidth={1.5} aria-label="Locked" />
        ) : (
          <ArrowRight
            className="h-5 w-5 text-amber-600 transition-transform duration-200 group-hover:translate-x-1"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </span>
    </>
  );

  const rowClasses = cn(
    'group relative flex gap-4 overflow-hidden border-b border-line px-4 py-5 last:border-b-0',
    locked && 'cursor-not-allowed opacity-50',
  );

  const sweep = locked ? null : (
    <span
      aria-hidden
      className="absolute inset-0 origin-left scale-x-0 bg-amber-100 transition-transform duration-300 group-hover:scale-x-100"
    />
  );

  if (locked) {
    return (
      <div className={rowClasses} title="Hold short — this gate is still locked">
        {sweep}
        <span className="relative flex w-full gap-4">{inner}</span>
      </div>
    );
  }
  return (
    <Link
      to={`/gates/${gate.id}/legs/${leg.id}`}
      className={rowClasses}
      title={done ? 'Already logged — but review is free' : undefined}
    >
      {sweep}
      <span className="relative flex w-full gap-4">{inner}</span>
    </Link>
  );
}
