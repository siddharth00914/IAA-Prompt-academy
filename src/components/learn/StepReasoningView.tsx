import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, EyeOff, Route } from 'lucide-react';
import type { StepReasoningBlock } from '@/content/types';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/**
 * StepReasoning block (lesson.md §3.10): chain-of-thought visualizer. Steps
 * appear on a vertical path (node ping + line draw, ~500ms/step) ending in a
 * conclusion card. The "answer only" toggle shows the weaker direct answer.
 */
export default function StepReasoningView({ block }: { block: StepReasoningBlock }) {
  const reduced = prefersReducedMotion();
  const [mode, setMode] = useState<'reasoning' | 'direct'>('reasoning');
  const [visibleSteps, setVisibleSteps] = useState(reduced ? block.steps.length : 0);
  const [started, setStarted] = useState(reduced);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const run = () => {
    setStarted(true);
    if (reduced) {
      setVisibleSteps(block.steps.length);
      return;
    }
    setVisibleSteps(0);
    let n = 0;
    timerRef.current = window.setInterval(() => {
      n += 1;
      setVisibleSteps(n);
      if (n >= block.steps.length && timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    }, 500);
  };

  const allShown = visibleSteps >= block.steps.length;

  return (
    <div className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
        <Route className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
        <span className="label text-ink-500">REASONING FLIGHT PATH</span>
        {block.title ? (
          <span className="body-strong ml-1 truncate text-[15px] text-ink-900">{block.title}</span>
        ) : null}
        {block.directAnswer ? (
          <div className="ml-auto flex overflow-hidden rounded-[2px] border border-line" role="group" aria-label="Answer mode">
            <button
              type="button"
              onClick={() => setMode('reasoning')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em]',
                mode === 'reasoning' ? 'bg-ink-900 text-paper' : 'bg-paper-bright text-ink-500',
              )}
            >
              <Eye className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              Reasoning
            </button>
            <button
              type="button"
              onClick={() => setMode('direct')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em]',
                mode === 'direct' ? 'bg-ink-900 text-paper' : 'bg-paper-bright text-ink-500',
              )}
            >
              <EyeOff className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              Answer only
            </button>
          </div>
        ) : null}
      </div>

      <div className="p-5">
        {mode === 'direct' && block.directAnswer ? (
          <div className="rounded-[4px] border border-line bg-paper-dim p-4">
            <p className="label text-ink-500">DIRECT ANSWER — NO REASONING SHOWN</p>
            <p className="prompt-text mt-2 whitespace-pre-wrap text-ink-900">{block.directAnswer}</p>
            <p className="small mt-3 text-ink-500">
              Same model, same question — but with nothing to steer by, the answer skips the
              checks. Flip back to see the flight path.
            </p>
          </div>
        ) : (
          <>
            {!started ? (
              <button
                type="button"
                onClick={run}
                className="btn-primary"
              >
                Run the reasoning →
              </button>
            ) : (
              <div className="relative pl-8">
                {/* vertical path line */}
                <motion.span
                  aria-hidden
                  className="absolute bottom-2 left-[9px] top-2 w-[2px] origin-top bg-amber-500"
                  initial={reduced ? false : { scaleY: 0 }}
                  animate={{ scaleY: allShown ? 1 : Math.max(0.05, visibleSteps / block.steps.length) }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
                <ol className="space-y-4">
                  {block.steps.slice(0, visibleSteps).map((step, i) => (
                    <motion.li
                      key={i}
                      initial={reduced ? false : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="relative"
                    >
                      <span className="absolute -left-8 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-500 bg-paper-bright font-mono text-[10px] font-semibold text-amber-600">
                        {i + 1}
                      </span>
                      <p className="small text-ink-700">{step}</p>
                    </motion.li>
                  ))}
                </ol>
                <AnimatePresence>
                  {allShown ? (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="mt-5 rounded-[4px] border-2 border-field-500 bg-field-100 p-4"
                    >
                      <p className="label flex items-center gap-1.5 text-field-600">
                        <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        CONCLUSION
                      </p>
                      <p className="body-strong mt-2 text-ink-900">{block.conclusion}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
