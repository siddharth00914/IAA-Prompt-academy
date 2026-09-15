import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ListChecks, PartyPopper } from 'lucide-react';
import type { SortDrillBlock } from '@/content/types';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/**
 * SortDrill block (lesson.md §3.8): two-bin sorting. Click-to-assign buttons
 * (mobile-friendly); correct picks lock in with their verdict, wrong picks
 * shake and explain. End tally + elaborated recap when every card is parked.
 */
export default function SortDrillView({ block }: { block: SortDrillBlock }) {
  const reduced = prefersReducedMotion();
  /** per-card state: 'open' | 'sorted' | index of last wrong bin */
  const [sorted, setSorted] = useState<boolean[]>(() => block.cards.map(() => false));
  const [wrongBin, setWrongBin] = useState<(0 | 1 | null)[]>(() => block.cards.map(() => null));
  const [shaking, setShaking] = useState<number | null>(null);

  const sortedCount = sorted.filter(Boolean).length;
  const done = sortedCount === block.cards.length;

  const assign = (cardIdx: number, bin: 0 | 1) => {
    if (sorted[cardIdx]) return;
    const card = block.cards[cardIdx];
    if (card.bin === bin) {
      setSorted((s) => s.map((v, i) => (i === cardIdx ? true : v)));
      setWrongBin((w) => w.map((v, i) => (i === cardIdx ? null : v)));
    } else {
      setWrongBin((w) => w.map((v, i) => (i === cardIdx ? bin : v)));
      setShaking(cardIdx);
      window.setTimeout(() => setShaking((s) => (s === cardIdx ? null : s)), 450);
    }
  };

  return (
    <div className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card">
      <div className="flex items-center gap-2 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
        <ListChecks className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
        <span className="label text-ink-500">SORT DRILL</span>
        {block.title ? (
          <span className="body-strong ml-1 truncate text-[15px] text-ink-900">{block.title}</span>
        ) : null}
        <span className="label ml-auto shrink-0 text-ink-300">
          {sortedCount}/{block.cards.length} PARKED
        </span>
      </div>

      <div className="p-5">
        {/* bin headers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[4px] border-2 border-field-500 bg-field-100 px-3 py-2 text-center">
            <span className="label text-field-600">{block.bins[0]}</span>
          </div>
          <div className="rounded-[4px] border-2 border-signal-500 bg-signal-100 px-3 py-2 text-center">
            <span className="label text-signal-600">{block.bins[1]}</span>
          </div>
        </div>

        {/* cards */}
        <div className="mt-4 space-y-3">
          {block.cards.map((card, i) => {
            const isSorted = sorted[i];
            const wrong = wrongBin[i];
            return (
              <motion.div
                key={i}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                animate={shaking === i && !reduced ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                className={cn(
                  'rounded-[4px] border p-4 transition-colors',
                  isSorted
                    ? 'border-field-500 bg-field-100/60'
                    : wrong !== null
                      ? 'border-signal-500 bg-signal-100/50'
                      : 'border-line bg-paper',
                )}
              >
                <p className="prompt-text whitespace-pre-wrap text-[13px] text-ink-900">{card.text}</p>

                {isSorted ? (
                  <p className="small mt-3 flex items-start gap-2 text-field-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    <span>
                      <span className="label mr-2">{block.bins[card.bin]}</span>
                      {card.verdict}
                    </span>
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {([0, 1] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => assign(i, b)}
                          className={cn(
                            'rounded-[2px] border-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                            b === 0
                              ? 'border-field-500/60 text-field-600 hover:bg-field-100'
                              : 'border-signal-500/60 text-signal-600 hover:bg-signal-100',
                          )}
                        >
                          → {block.bins[b]}
                        </button>
                      ))}
                    </div>
                    {wrong !== null ? (
                      <p className="small mt-2 text-signal-600">
                        <span className="label mr-2">GO AROUND</span>
                        {card.verdict}
                      </p>
                    ) : null}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* end tally + recap */}
        <AnimatePresence>
          {done ? (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 rounded-[4px] border-2 border-field-500 bg-field-100 p-4"
              role="status"
            >
              <p className="label flex items-center gap-2 text-field-600">
                <PartyPopper className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {block.cards.length}/{block.cards.length} CONTAINERS PARKED
              </p>
              <p className="small mt-2 text-ink-700">{block.recap}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
