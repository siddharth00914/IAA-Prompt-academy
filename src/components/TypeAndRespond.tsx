import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

export interface TypeAndRespondVariant {
  prompt: string;
  response: string;
  /** Small caption under the response, e.g. what went wrong/right. */
  caption?: string;
}

interface TypeAndRespondProps {
  weak: TypeAndRespondVariant;
  strong: TypeAndRespondVariant;
  /** Diff chips that light sequentially once the strong output lands. */
  chips?: string[];
  /** Start the sequence when the player scrolls into view (once per visit). */
  autoPlay?: boolean;
  defaultVariant?: 'weak' | 'strong';
  /** Show a 1×/2× speed control. */
  speedControl?: boolean;
  className?: string;
}

type Phase = 'idle' | 'typing' | 'transmitting' | 'generating' | 'streaming' | 'done';

const CHAR_MS = 28;
const WORD_MS = 40;
const TRANSMIT_MS = 550;
const GENERATE_MS = 800;

/**
 * TypeAndRespond (design.md §6 + §5.2.3): the signature demo player.
 * Prompt types at ~28ms/char with a block caret → transmit pulse → 3-dot
 * generating indicator (800ms) → response streams word-by-word (~40ms/word).
 * Weak/strong toggle, replay, optional 1×/2× speed. All canned strings —
 * no live model calls. Reduced motion renders final states instantly.
 */
export default function TypeAndRespond({
  weak,
  strong,
  chips = [],
  autoPlay = false,
  defaultVariant = 'weak',
  speedControl = false,
  className,
}: TypeAndRespondProps) {
  const reduced = prefersReducedMotion();

  const [variant, setVariant] = useState<'weak' | 'strong'>(defaultVariant);
  const [phase, setPhase] = useState<Phase>('idle');
  const [chars, setChars] = useState(0);
  const [words, setWords] = useState(0);
  const [runId, setRunId] = useState(0);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [litChips, setLitChips] = useState(0);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const data = variant === 'weak' ? weak : strong;
  const wordList = data.response.split(/\s+/).filter(Boolean);
  const wordCountOf = (v: TypeAndRespondVariant) => v.response.split(/\s+/).filter(Boolean).length;

  /** Reduced-motion: jump straight to the final state (event handlers only). */
  const jumpToEnd = useCallback(
    (v: 'weak' | 'strong') => {
      const d = v === 'weak' ? weak : strong;
      setChars(d.prompt.length);
      setWords(wordCountOf(d));
      setPhase('done');
    },
    [weak, strong],
  );

  /** Reset to the start of a run (called from event handlers, not effects). */
  const resetForRun = useCallback(() => {
    setLitChips(0);
    setPhase('typing');
    setChars(0);
    setWords(0);
  }, []);

  const start = useCallback(() => {
    if (reduced) {
      setLitChips(0);
      jumpToEnd(variant);
      return;
    }
    resetForRun();
    setRunId((n) => n + 1);
  }, [reduced, jumpToEnd, variant, resetForRun]);

  // main sequence (timed state machine — skipped entirely for reduced motion)
  useEffect(() => {
    if (runId === 0 || reduced) return;
    const v = variant === 'weak' ? weak : strong;
    const wordCount = v.response.split(/\s+/).filter(Boolean).length;

    const timeouts: number[] = [];
    const intervals: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms / speedRef.current);
      timeouts.push(id);
    };
    const every = (fn: () => boolean, ms: number) => {
      const id = window.setInterval(() => {
        if (fn()) window.clearInterval(id);
      }, ms / speedRef.current);
      intervals.push(id);
    };

    let c = 0;
    every(() => {
      c += 1;
      setChars(c);
      if (c >= v.prompt.length) {
        setPhase('transmitting');
        later(() => {
          setPhase('generating');
          later(() => {
            setPhase('streaming');
            let w = 0;
            every(() => {
              w += 1;
              setWords(w);
              if (w >= wordCount) {
                setPhase('done');
                return true;
              }
              return false;
            }, WORD_MS);
          }, GENERATE_MS);
        }, TRANSMIT_MS);
        return true;
      }
      return false;
    }, CHAR_MS);

    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      intervals.forEach((i) => window.clearInterval(i));
    };
  }, [runId, variant, weak, strong, reduced]);

  // chips light sequentially once the strong output completes
  useEffect(() => {
    if (phase !== 'done' || variant !== 'strong' || chips.length === 0 || reduced) return;
    const timers: number[] = [];
    chips.forEach((_, i) => {
      timers.push(window.setTimeout(() => setLitChips(i + 1), 150 + i * 100));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, variant, chips, reduced]);

  // reduced motion shows all chips as soon as the strong output is on screen
  const litCount = reduced && phase === 'done' && variant === 'strong' ? chips.length : litChips;

  const flipVariant = (v: 'weak' | 'strong') => {
    if (v === variant) return;
    setVariant(v);
    if (reduced) {
      setLitChips(0);
      jumpToEnd(v);
    } else {
      resetForRun();
      setRunId((n) => n + 1);
    }
  };

  const typing = phase === 'typing';
  const busy = phase === 'typing' || phase === 'transmitting' || phase === 'generating' || phase === 'streaming';
  const showResponse = phase === 'streaming' || phase === 'done';
  const typedPrompt = phase === 'idle' ? '' : data.prompt.slice(0, chars);
  const streamedResponse = wordList.slice(0, words).join(' ');

  return (
    <motion.div
      onViewportEnter={autoPlay ? () => start() : undefined}
      viewport={{ once: true, amount: 0.25 }}
      className={cn('overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card', className)}
    >
      {/* chrome bar */}
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
        <span className="label text-ink-500">TOWER FREQUENCY</span>
        {/* honesty tag: every output is pre-written — no live model call */}
        <span className="rounded-[2px] border border-amber-600/40 bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
          SIMULATED
        </span>
        <div className="ml-auto flex items-center gap-2">
          {/* weak/strong segmented toggle */}
          <div className="flex overflow-hidden rounded-[2px] border border-ink-900" role="group" aria-label="Prompt variant">
            {(['weak', 'strong'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => flipVariant(v)}
                className={cn(
                  'px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  variant === v ? 'bg-amber-500 text-ink-900' : 'bg-paper-bright text-ink-500 hover:text-ink-900',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          {speedControl ? (
            <div className="flex overflow-hidden rounded-[2px] border border-line" role="group" aria-label="Playback speed">
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={cn(
                    'px-2 py-1 font-mono text-[11px] font-semibold',
                    speed === s ? 'bg-ink-900 text-paper' : 'bg-paper-bright text-ink-500',
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-1.5 rounded-[2px] border border-line bg-paper-bright px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700 transition-colors hover:border-amber-500 hover:text-ink-900"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            Replay
          </button>
        </div>
      </div>

      {/* stage: output morph between variants */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={variant}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-0 lg:grid-cols-2"
        >
          {/* prompt pane */}
          <div className="relative border-b-2 border-ink-900/10 bg-paper-dim p-5 lg:border-b-0 lg:border-r-2">
            <p className="label text-ink-500">PROMPT · {variant === 'weak' ? 'VFR' : 'IFR'}</p>
            <p className="prompt-text mt-3 min-h-[120px] whitespace-pre-wrap text-ink-900">
              {typedPrompt}
              {phase === 'idle' ? (
                <button
                  type="button"
                  onClick={start}
                  className="ml-1 inline-flex items-center gap-1.5 rounded-[2px] bg-amber-500 px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-900"
                >
                  <Send className="h-3 w-3" strokeWidth={1.5} aria-hidden /> Transmit
                </button>
              ) : null}
              {typing ? (
                <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[9px] translate-y-[2px] animate-caret-blink bg-amber-500" />
              ) : null}
            </p>
            {/* transmit pulse */}
            <AnimatePresence>
              {phase === 'transmitting' ? (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 border-2 border-amber-500"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              ) : null}
            </AnimatePresence>
          </div>

          {/* response pane */}
          <div className="relative p-5">
            <p className="label text-ink-500">RESPONSE</p>
            <div className="mt-3 min-h-[120px]">
              {phase === 'generating' ? (
                <span className="inline-flex items-center gap-1.5" aria-label="Generating">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-amber-500 animate-taxiway-blink motion-reduce:animate-none"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </span>
              ) : null}
              {showResponse ? (
                <p className="prompt-text whitespace-pre-wrap text-ink-900">
                  {streamedResponse}
                  {phase === 'streaming' ? (
                    <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[9px] translate-y-[2px] animate-caret-blink bg-amber-500" />
                  ) : null}
                </p>
              ) : null}
              {phase === 'idle' || typing || phase === 'transmitting' ? (
                <p className="prompt-text text-ink-500">…</p>
              ) : null}
            </div>
            {phase === 'done' && data.caption ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.4 }}
                className="small mt-3 font-editorial italic text-ink-500"
              >
                {data.caption}
              </motion.p>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* diff chips */}
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper px-4 py-3">
          <span className="label mr-1 text-ink-500">DIFF STRIP</span>
          {chips.map((chip, i) => (
            <span
              key={chip}
              className={cn(
                'rounded-[2px] border px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-300',
                i < litCount
                  ? 'border-amber-500 bg-amber-100 text-amber-600'
                  : 'border-line bg-paper-bright text-ink-500',
              )}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {busy ? <span className="sr-only" aria-live="polite">Demo playing</span> : null}
    </motion.div>
  );
}
