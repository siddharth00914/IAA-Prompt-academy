import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

export type OptionVisualState = 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed';

interface QuizOptionCardProps {
  /** Runway designator letter (A/B/C/D). */
  letter: string;
  text: string;
  state: OptionVisualState;
  /** Radio group name (per question). */
  name: string;
  disabled: boolean;
  onSelect: () => void;
}

/**
 * QuizOption (design.md §6): answer card with a runway-designator letter in a
 * 2px-frame square. States per quiz.md §S2: default (1px line) / hover (amber
 * edge + 2px lift) / selected (amber-100) / revealed-correct (field-100, green
 * check, 2px green edge) / revealed-wrong (signal-100, red ✗, 300ms x-shake
 * ±6px) / dimmed (45%). Real radio input for screen readers (quiz.md notes).
 */
export default function QuizOptionCard({ letter, text, state, name, disabled, onSelect }: QuizOptionCardProps) {
  const reduced = prefersReducedMotion();
  const isWrong = state === 'wrong';

  return (
    <label
      className={cn(
        'block',
        disabled ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      {/* No aria-label override: the accessible name comes from the wrapping
          <label>, so screen readers announce the full answer text (the letter
          square is aria-hidden). */}
      <input
        type="radio"
        name={name}
        className="sr-only"
        disabled={disabled}
        checked={state === 'selected' || state === 'correct' || state === 'wrong'}
        onChange={() => {
          if (!disabled) onSelect();
        }}
      />
      <motion.div
        animate={
          isWrong && !reduced
            ? { x: [0, -6, 6, -6, 6, 0], opacity: 1 }
            : { x: 0, opacity: state === 'dimmed' ? 0.45 : 1 }
        }
        transition={
          isWrong && !reduced
            ? { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
            : { duration: 0.2 }
        }
        whileHover={!disabled && state === 'default' ? { y: -2 } : undefined}
        className={cn(
          'flex min-h-[48px] items-center gap-4 rounded-[6px] border px-4 py-3 transition-colors duration-200',
          state === 'default' && 'border-line bg-paper-bright hover:border-amber-500',
          state === 'selected' && 'border-amber-500 bg-amber-100',
          state === 'correct' && 'border-2 border-field-500 bg-field-100',
          state === 'wrong' && 'border-2 border-signal-500 bg-signal-100',
          state === 'dimmed' && 'border-line bg-paper-bright',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center border-2 font-mono text-sm font-semibold',
            state === 'correct'
              ? 'border-field-600 text-field-600'
              : state === 'wrong'
                ? 'border-signal-600 text-signal-600'
                : state === 'selected'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-ink-900 text-ink-900',
          )}
        >
          {letter}
        </span>
        <span className="body-strong flex-1 text-[15px] leading-snug text-ink-900">{text}</span>
        {state === 'correct' ? (
          <Check className="h-5 w-5 shrink-0 text-field-600" strokeWidth={2.5} aria-hidden />
        ) : null}
        {state === 'wrong' ? (
          <X className="h-5 w-5 shrink-0 text-signal-600" strokeWidth={2.5} aria-hidden />
        ) : null}
      </motion.div>
    </label>
  );
}
