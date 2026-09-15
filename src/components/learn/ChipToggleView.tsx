import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import type { ChipToggleBlock } from '@/content/types';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/**
 * ChipToggle block (lesson.md §3.9): option chips that re-render a canned
 * output pane — used for persona simulators, format demos, shot counts.
 */
export default function ChipToggleView({ block }: { block: ChipToggleBlock }) {
  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(0);
  const chip = block.chips[active];

  return (
    <div className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card">
      <div className="flex items-center gap-2 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
        <SlidersHorizontal className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
        <span className="label text-ink-500">SIMULATED DEMO</span>
        {block.title ? (
          <span className="body-strong ml-1 truncate text-[15px] text-ink-900">{block.title}</span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Demo options">
          {block.chips.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={cn(
                'rounded-[2px] border-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                i === active
                  ? 'border-amber-500 bg-amber-500 text-ink-900'
                  : 'border-line bg-paper text-ink-700 hover:border-amber-500',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 rounded-[4px] border border-line bg-paper-dim p-4"
          >
            <pre className="prompt-text whitespace-pre-wrap font-mono text-ink-900">{chip.output}</pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
