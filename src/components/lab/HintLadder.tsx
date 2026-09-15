import { useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lightbulb, Lock, Puzzle, Star } from 'lucide-react';
import type { Scenario } from '@/content/types';
import { cn } from '@/lib/utils';

interface HintLadderProps {
  scenario: Scenario;
  /** Attempts recorded for this scenario (gold unlocks at ≥ 1). */
  attempts: number;
  /** True once the gold prompt has been opened (honesty cap, from progress). */
  goldViewed: boolean;
  /** Called the first time the gold rung is opened — page marks goldViewed. */
  onOpenGold: () => void;
}

interface RungProps {
  icon: typeof Lightbulb;
  step: string;
  title: string;
  locked?: boolean;
  lockNote?: string;
  flagged?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function Rung({ icon: Icon, step, title, locked, lockNote, flagged, open, onToggle, children }: RungProps) {
  return (
    <div
      className={cn(
        'rounded-[6px] border',
        locked ? 'border-line bg-paper' : 'border-amber-500/40 bg-amber-100/60',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={locked}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          locked ? 'cursor-not-allowed opacity-70' : 'hover:bg-amber-100',
        )}
        aria-expanded={open}
      >
        <Icon
          className={cn('h-4 w-4 shrink-0', locked ? 'text-ink-300' : 'text-amber-600')}
          strokeWidth={1.5}
          aria-hidden
        />
        <span className={cn('label', locked ? 'text-ink-300' : 'text-amber-600')}>{step}</span>
        <span className="body-strong flex-1 text-[15px] text-ink-900">{title}</span>
        {flagged ? (
          <span className="hidden rounded-[2px] border border-amber-600/50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600 sm:inline">
            {flagged}
          </span>
        ) : null}
        {locked ? (
          <Lock className="h-4 w-4 text-ink-300" strokeWidth={1.5} aria-hidden />
        ) : (
          <ChevronDown
            className={cn('h-4 w-4 text-ink-500 transition-transform duration-200', open && 'rotate-180')}
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </button>
      {locked && lockNote ? (
        <p className="px-4 pb-3 font-mono text-[12px] text-ink-500">{lockNote}</p>
      ) : null}
      <AnimatePresence initial={false}>
        {open && !locked ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-amber-500/30 px-4 py-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * HintLadder (promptlab.md §S3.5 + design.md §6): progressive disclosure —
 * HINT (free, conceptual) → EXAMPLE FRAGMENT → GOLD PROMPT (locked until ≥1
 * submission; opening flags GOLD VIEWED and caps wing eligibility at 89 —
 * "Wings are earned unaided.").
 */
export default function HintLadder({ scenario, attempts, goldViewed, onOpenGold }: HintLadderProps) {
  const [openRung, setOpenRung] = useState<number | null>(null);
  const goldLocked = attempts < 1;

  const toggle = (rung: number) => {
    if (rung === 2 && goldLocked) return;
    const next = openRung === rung ? null : rung;
    setOpenRung(next);
    if (rung === 2 && next === 2) onOpenGold();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="label text-ink-500">STUCK? CLIMB THE LADDER</p>
        {goldViewed ? (
          <p
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-amber-600"
            title="Wings are earned unaided — the Gold Prompt wing caps at 89 for this scenario."
          >
            GOLD VIEWED · WING CAP 89
          </p>
        ) : null}
      </div>

      <Rung icon={Lightbulb} step="RUNG 1 · FREE" title="Hint" open={openRung === 0} onToggle={() => toggle(0)}>
        <p className="small text-ink-700">{scenario.hint}</p>
      </Rung>

      <Rung
        icon={Puzzle}
        step="RUNG 2"
        title="Example fragment"
        flagged="SHOWS 1–2 LINES"
        open={openRung === 1}
        onToggle={() => toggle(1)}
      >
        <pre className="prompt-text whitespace-pre-wrap rounded-[4px] border border-line bg-paper-bright p-3 text-ink-700">
          {scenario.exampleFragment}
        </pre>
      </Rung>

      <Rung
        icon={Star}
        step="RUNG 3"
        title="Gold prompt"
        locked={goldLocked}
        lockNote="LOCKED — transmit at least one attempt first. The debrief is the lesson."
        flagged={goldViewed ? 'VIEWED' : 'WING CAP 89'}
        open={openRung === 2}
        onToggle={() => toggle(2)}
      >
        <pre className="prompt-text whitespace-pre-wrap rounded-[4px] border border-line bg-paper-bright p-3 text-ink-700">
          {scenario.goldPrompt}
        </pre>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">
          Study it, then write your own — wings are earned unaided.
        </p>
      </Rung>
    </div>
  );
}
