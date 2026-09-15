import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Blocks, Play, RotateCcw } from 'lucide-react';
import type { PromptBuilderBlock } from '@/content/types';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const WORD_MS = 40;

/**
 * PromptBuilder block (lesson.md §3.7): tap-to-assemble. Parts snap from the
 * bin into the prompt frame; the mono preview fills in as parts land, each
 * placement narrates a caption, and "Run it" streams the canned response.
 * Placing EXAMPLES before the instruction earns the misplacement hint.
 */
export default function PromptBuilderView({ block }: { block: PromptBuilderBlock }) {
  const reduced = prefersReducedMotion();
  const [placed, setPlaced] = useState<string[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const [running, setRunning] = useState<'idle' | 'streaming' | 'done'>('idle');
  const [words, setWords] = useState(0);
  const timerRef = useRef<number | null>(null);

  const allPlaced = placed.length === block.parts.length;
  // Stream by words while preserving the original line breaks: precompute the
  // end index of each word, then slice the source string as words accrue.
  const wordEnds = useMemo(() => {
    const ends: number[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block.cannedResponse)) !== null) ends.push(m.index + m[0].length);
    return ends;
  }, [block.cannedResponse]);
  const totalWords = wordEnds.length;
  const visibleResponse =
    words <= 0 ? '' : block.cannedResponse.slice(0, wordEnds[Math.min(words, totalWords) - 1]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const place = (partId: string) => {
    if (placed.includes(partId)) return;
    const part = block.parts.find((p) => p.id === partId);
    if (!part) return;
    const next = [...placed, partId];
    setPlaced(next);
    // Misplacement hint: leading with examples before any instruction.
    if (partId === 'EXAMPLES' && !placed.includes('INSTRUCTION')) {
      setCaption('You can lead with examples — but instructions usually ride up front.');
    } else {
      setCaption(part.caption);
    }
  };

  const reset = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setPlaced([]);
    setCaption(null);
    setRunning('idle');
    setWords(0);
  };

  const run = () => {
    if (!allPlaced || running === 'streaming') return;
    if (reduced) {
      setWords(totalWords);
      setRunning('done');
      return;
    }
    setRunning('streaming');
    setWords(0);
    let w = 0;
    timerRef.current = window.setInterval(() => {
      w += 1;
      setWords(w);
      if (w >= totalWords) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setRunning('done');
      }
    }, WORD_MS);
  };

  // Preview with {{PART_ID}} tokens → placed (amber) / awaiting (dim) chips.
  const segments = block.previewTemplate.split(/(\{\{\w+\}\})/g);

  return (
    <div className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card">
      <div className="flex items-center gap-2 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
        <Blocks className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
        <span className="label text-ink-500">PROMPT ASSEMBLY</span>
        {block.title ? (
          <span className="body-strong ml-1 truncate text-[15px] text-ink-900">{block.title}</span>
        ) : null}
        <span className="label ml-auto shrink-0 text-ink-300">
          {placed.length}/{block.parts.length} LOADED
        </span>
      </div>

      <div className="p-5">
        {/* parts bin */}
        <p className="label text-ink-500">PARTS BIN — TAP TO LOAD</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {block.parts.map((part) => {
            const isPlaced = placed.includes(part.id);
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => place(part.id)}
                disabled={isPlaced}
                className={cn(
                  'rounded-[2px] border-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-all',
                  isPlaced
                    ? 'border-field-500 bg-field-100 text-field-600'
                    : 'border-dashed border-ink-500 bg-paper text-ink-900 hover:border-amber-500 hover:bg-amber-100',
                )}
              >
                {isPlaced ? `✓ ${part.label}` : part.label}
              </button>
            );
          })}
        </div>

        {/* narration caption */}
        <AnimatePresence mode="wait">
          {caption ? (
            <motion.p
              key={caption}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="small mt-3 border-l-2 border-amber-500 pl-3 font-editorial italic text-ink-700"
            >
              {caption}
            </motion.p>
          ) : (
            <motion.p key="empty" className="small mt-3 text-ink-300" exit={{ opacity: 0 }}>
              The cart is empty. Load the parts in any order — the captions tell you what each one does.
            </motion.p>
          )}
        </AnimatePresence>

        {/* live mono preview */}
        <div className="mt-4 rounded-[4px] border border-line bg-paper-dim p-4">
          <p className="label text-ink-500">PROMPT FRAME</p>
          <p className="prompt-text mt-2 whitespace-pre-wrap text-ink-900">
            {segments.map((seg, i) => {
              const m = /^\{\{(\w+)\}\}$/.exec(seg);
              if (!m) return <span key={i}>{seg}</span>;
              const partId = m[1];
              const part = block.parts.find((p) => p.id === partId);
              const isPlaced = placed.includes(partId);
              return (
                <span
                  key={i}
                  className={cn(
                    'mx-0.5 inline-block rounded-[2px] border px-1.5 py-0 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] align-middle',
                    isPlaced
                      ? 'border-amber-500 bg-amber-100 text-amber-600'
                      : 'border-dashed border-ink-300 text-ink-300',
                  )}
                >
                  {isPlaced ? part?.label : `AWAITING ${part?.label ?? partId}`}
                </span>
              );
            })}
          </p>
        </div>

        {/* run row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={!allPlaced || running === 'streaming'}
            className={cn(
              'inline-flex items-center gap-2 rounded-[2px] px-5 py-2.5 font-sans text-[15px] font-bold transition-all',
              allPlaced && running !== 'streaming'
                ? 'bg-amber-500 text-ink-900 hover:bg-amber-400'
                : 'cursor-not-allowed bg-paper-dim text-ink-300',
            )}
            title={allPlaced ? 'Run the assembled prompt' : 'Load all six parts first'}
          >
            <Play className="h-4 w-4" strokeWidth={2} aria-hidden />
            {running === 'done' ? 'Run it again' : 'Run it'}
          </button>
          {(placed.length > 0 || running !== 'idle') && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700 hover:border-amber-500"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              Unload cart
            </button>
          )}
          {!allPlaced ? (
            <span className="label text-ink-300">LOAD ALL SIX PARTS TO RUN</span>
          ) : null}
        </div>

        {/* canned response */}
        {running !== 'idle' ? (
          <div className="mt-4 rounded-[4px] border border-field-500/40 bg-field-100 p-4">
            <p className="label text-field-600">RESPONSE · CANNED — NOTHING LEAVES THE BUILDING</p>
            <p className="prompt-text mt-2 whitespace-pre-wrap text-ink-900">
              {visibleResponse}
              {running === 'streaming' ? (
                <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[9px] translate-y-[2px] animate-caret-blink bg-amber-500" />
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
