import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MoveRight } from 'lucide-react';
import { CAPSTONE_CHAIN, scenarioCode } from '@/content/scenarios';
import { useProgress } from '@/lib/progress';
import { cn } from '@/lib/utils';

interface ChainHeaderProps {
  /** Currently open capstone scenario id (WTP-L10/11/12). */
  currentId: string;
  /** Fires once when this submission completed the chain (nodes flip green in sequence). */
  celebrating: boolean;
  onSelect: (id: string) => void;
}

const STEP_LABELS = ['1 OUTLINE', '2 INFER', '3 EXPAND + CHECK'];

/**
 * Capstone chain header (promptlab.md §S5): persistent three-node chain
 * `1 OUTLINE → 2 INFER → 3 EXPAND + CHECK`; done = green, current = amber.
 * On chain completion the nodes flip green in sequence (300ms apart) behind a
 * FINAL APPROACH COMPLETE stamp.
 */
export default function ChainHeader({ currentId, celebrating, onSelect }: ChainHeaderProps) {
  const progress = useProgress();
  const [flippedCount, setFlippedCount] = useState(0);

  // On celebration, flip nodes green in sequence (300ms apart). All state
  // updates happen inside timer callbacks (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!celebrating) return;
    const timers = [0, 1, 2, 3].map((n) =>
      window.setTimeout(() => setFlippedCount(n), n === 0 ? 0 : n * 300),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [celebrating]);

  const effectiveFlipped = celebrating ? flippedCount : 0;

  return (
    <div className="relative rounded-[10px] border-2 border-ink-900 bg-paper-bright px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="label text-ink-500">CAPSTONE CHAIN</span>
        {CAPSTONE_CHAIN.map((s, i) => {
          const done = (progress.lab[s.id]?.attempts ?? 0) >= 1;
          const current = s.id === currentId;
          const flipping = celebrating && i < effectiveFlipped;
          return (
            <span key={s.id} className="flex items-center gap-3">
              {i > 0 ? <MoveRight className="h-4 w-4 text-ink-300" strokeWidth={1.5} aria-hidden /> : null}
              <motion.button
                type="button"
                onClick={() => onSelect(s.id)}
                animate={flipping ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex items-center gap-2 rounded-[999px] border-2 px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  done
                    ? 'border-field-600 bg-field-100 text-field-600'
                    : current
                      ? 'border-amber-500 bg-amber-100 text-amber-600'
                      : 'border-line bg-paper text-ink-500 hover:border-amber-500/60',
                )}
                title={`${scenarioCode(s.id)} — ${s.title}`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : null}
                {STEP_LABELS[i]}
              </motion.button>
            </span>
          );
        })}
        <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.12em] text-ink-300 md:inline">
          WTP-L10 → L11 → L12
        </span>
      </div>

      {/* FINAL APPROACH COMPLETE stamp (chain completion moment, §S5) */}
      <AnimatePresence>
        {celebrating && effectiveFlipped >= 3 ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 1.6, rotate: -16 }}
              animate={{ opacity: [0, 1, 0.55, 1], scale: 1, rotate: -8 }}
              transition={{
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1],
                opacity: { duration: 0.34, times: [0, 0.4, 0.65, 1] },
              }}
              className="rounded-[4px] border-[3px] border-amber-600 p-1.5 text-amber-600 opacity-90"
            >
              <span className="block rounded-[2px] border-2 border-amber-600 px-4 py-1.5 font-mono text-base font-semibold uppercase tracking-[0.14em]">
                FINAL APPROACH COMPLETE
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
