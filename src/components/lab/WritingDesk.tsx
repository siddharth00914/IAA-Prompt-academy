import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Send } from 'lucide-react';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { countWords } from '@/lib/rubric';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { TECHNIQUE_CHIPS } from '@/components/lab/technique-chips';
import type { TechniqueChip } from '@/components/lab/technique-chips';
import { cn } from '@/lib/utils';

interface WritingDeskProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  attempts: number;
  bestScore: number;
  goldViewed: boolean;
  chipsUsed: string[];
  onChipUsed: (id: string) => void;
  editorRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * The writing desk (promptlab.md §S2): technique chip tray (fragments type
 * themselves in at 12ms/char), mono prompt editor with live word count, and
 * the transmit row (CTRL+ENTER). Empty submits get a gentle shake + tooltip.
 */
export default function WritingDesk({
  value,
  onChange,
  onSubmit,
  submitting,
  attempts,
  bestScore,
  goldViewed,
  chipsUsed,
  onChipUsed,
  editorRef,
}: WritingDeskProps) {
  const [typingChip, setTypingChip] = useState<string | null>(null);
  const [emptyFlash, setEmptyFlash] = useState(false);
  const typeTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  const shake = useAnimationControls();

  useEffect(
    () => () => {
      if (typeTimer.current !== null) window.clearInterval(typeTimer.current);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const insertChip = (chip: TechniqueChip) => {
    const ta = editorRef.current;
    if (!ta || typingChip || submitting) return;

    const finish = (before: string) => {
      onChipUsed(chip.id);
      requestAnimationFrame(() => {
        const pos = before.length + chip.insert.length;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    };

    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (prefersReducedMotion()) {
      onChange(before + chip.insert + after);
      finish(before);
      return;
    }

    let i = 0;
    setTypingChip(chip.id);
    typeTimer.current = window.setInterval(() => {
      i += 1;
      onChange(before + chip.insert.slice(0, i) + after);
      requestAnimationFrame(() => {
        const pos = before.length + i;
        ta.setSelectionRange(pos, pos);
      });
      if (i >= chip.insert.length) {
        if (typeTimer.current !== null) window.clearInterval(typeTimer.current);
        typeTimer.current = null;
        setTypingChip(null);
        finish(before);
      }
    }, 12);
  };

  const handleSubmit = () => {
    if (submitting || typingChip) return;
    if (!value.trim()) {
      void shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
      setEmptyFlash(true);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setEmptyFlash(false), 2600);
      return;
    }
    onSubmit();
  };

  const words = countWords(value);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Technique chip tray */}
      <div>
        <p className="label text-ink-500">TECHNIQUE TRAY — CLICK TO INSERT AT CARET</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Technique chips">
          {TECHNIQUE_CHIPS.map((chip) => {
            const used = chipsUsed.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                disabled={submitting || typingChip !== null}
                onClick={() => insertChip(chip)}
                className={cn(
                  'rounded-[2px] border px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  used
                    ? 'border-field-600/50 bg-field-100 text-field-600'
                    : 'border-line bg-paper-bright text-ink-700 hover:border-amber-500 hover:text-ink-900',
                )}
                title={`Inserts "${chip.insert.trim()}" · ${chip.gate} technique`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <motion.div animate={shake} className="relative flex-1">
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={submitting}
          rows={12}
          placeholder="Tower is listening. Write your full prompt — role, task, context, format, limits…"
          aria-label="Prompt editor"
          spellCheck
          className="prompt-text h-full min-h-[280px] w-full resize-y rounded-[6px] border-2 border-line bg-paper-dim p-4 text-ink-900 placeholder:text-ink-300 focus:border-amber-500 focus:shadow-glow-ring focus:outline-none disabled:opacity-60"
        />
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-[2px] bg-paper-dim/90 px-2 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-ink-500">
          {words}W · {value.length}C
        </div>
      </motion.div>

      {/* Transmit row — sticky bottom bar on mobile */}
      <div className="sticky bottom-3 z-20 lg:static">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[6px] border-2 border-line bg-paper-bright p-3 shadow-card lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {submitting ? (
            <TaxiwayLoader label="TRANSMITTING…" />
          ) : (
            <button type="button" className="btn-primary" onClick={handleSubmit}>
              Transmit
              <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
          )}
          <span className="hidden rounded-[2px] border border-line bg-paper px-2 py-1 font-mono text-[11px] font-medium tracking-[0.1em] text-ink-500 sm:inline">
            CTRL+ENTER
          </span>
          <span className="ml-auto font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-ink-500">
            ATTEMPT {attempts + 1}
            {bestScore > 0 ? ` · BEST ${bestScore}` : ''}
            {goldViewed ? ' · GOLD VIEWED' : ''}
          </span>
        </div>
        {emptyFlash ? (
          <p className="mt-2 font-mono text-[12px] text-signal-600" role="alert">
            The tower can&apos;t read an empty frequency.
          </p>
        ) : null}
      </div>
    </div>
  );
}
