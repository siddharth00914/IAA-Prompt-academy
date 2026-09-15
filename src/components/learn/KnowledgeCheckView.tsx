import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileQuestion, RotateCcw, X } from 'lucide-react';
import type { KnowledgeCheckBlock } from '@/content/types';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * KnowledgeCheck block (lesson.md §3.6): inline single-question MCQ with
 * runway-designator letters. Every option returns elaborated feedback —
 * green CLEARED on correct, red GO AROUND + retry on wrong. No gating.
 */
export default function KnowledgeCheckView({ block }: { block: KnowledgeCheckBlock }) {
  const reduced = prefersReducedMotion();
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [cleared, setCleared] = useState(false);

  const pick = (i: number) => {
    if (cleared) return;
    setPicked(i);
    if (block.options[i].correct) {
      setCleared(true);
    } else {
      setWrongPicks((w) => (w.includes(i) ? w : [...w, i]));
    }
  };

  const feedback = picked !== null ? block.options[picked] : null;

  return (
    <div className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card">
      <div className="flex items-center gap-2 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
        <FileQuestion className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
        <span className="label text-ink-500">KNOWLEDGE CHECK</span>
        <span className="label ml-auto text-ink-300">NO GRADES ON RECORD</span>
      </div>
      <div className="p-5">
        <p className="body-strong text-ink-900">{block.question}</p>
        <div className="mt-4 space-y-2.5" role="group" aria-label="Answer options">
          {block.options.map((opt, i) => {
            const isPicked = picked === i;
            const isWrong = wrongPicks.includes(i);
            const showCorrect = cleared && opt.correct;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={cleared}
                initial={reduced ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                animate={
                  isWrong && isPicked && !reduced
                    ? { x: [0, -6, 6, -6, 6, 0] }
                    : { x: 0 }
                }
                className={cn(
                  'flex w-full items-start gap-3 rounded-[4px] border p-3 text-left transition-colors',
                  showCorrect
                    ? 'border-field-500 bg-field-100'
                    : isWrong
                      ? 'border-signal-500/60 bg-signal-100/60 opacity-70'
                      : isPicked
                        ? 'border-amber-500 bg-amber-100'
                        : 'border-line bg-paper hover:border-amber-500 hover:bg-amber-100/50',
                  cleared && !showCorrect && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center border-2 font-mono text-[13px] font-semibold',
                    showCorrect
                      ? 'border-field-600 text-field-600'
                      : isWrong
                        ? 'border-signal-600 text-signal-600'
                        : 'border-ink-900 text-ink-900',
                  )}
                  aria-hidden
                >
                  {showCorrect ? <Check className="h-4 w-4" strokeWidth={2} /> : isWrong ? <X className="h-4 w-4" strokeWidth={2} /> : LETTERS[i]}
                </span>
                <span className="small pt-1 text-ink-900">{opt.text}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div
              key={`${picked}-${cleared}`}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'mt-4 rounded-[4px] border p-4',
                cleared ? 'border-field-500/50 bg-field-100' : 'border-signal-500/50 bg-signal-100',
              )}
              role="status"
            >
              <p className={cn('label', cleared ? 'text-field-600' : 'text-signal-600')}>
                {cleared ? 'CLEARED' : 'GO AROUND — TRY AGAIN'}
              </p>
              <p className="small mt-2 text-ink-700">{feedback.feedback}</p>
              {!cleared ? (
                <p className="label mt-3 flex items-center gap-1.5 text-ink-500">
                  <RotateCcw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                  PICK ANOTHER RUNWAY
                </p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
