import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

export type StampVariant =
  | 'CLEARED'
  | 'MASTERED'
  | 'GO AROUND'
  | 'HOLD SHORT'
  | 'GATE UNLOCKED'
  | 'SAFETY SENTINEL'
  | 'LEG COMPLETE'
  | 'CERTIFIED';

interface StampOverlayProps {
  variant: StampVariant;
  /** Controls visibility — slam plays when this flips true. */
  show: boolean;
  /** Extra classes for the positioning wrapper (default: centered in nearest relative parent). */
  className?: string;
  onComplete?: () => void;
}

const TONE: Record<StampVariant, 'green' | 'red' | 'amber'> = {
  CLEARED: 'green',
  MASTERED: 'green',
  'GO AROUND': 'red',
  'HOLD SHORT': 'red',
  'GATE UNLOCKED': 'amber',
  'SAFETY SENTINEL': 'amber',
  'LEG COMPLETE': 'amber',
  CERTIFIED: 'amber',
};

const TONE_CLASSES = {
  green: 'border-field-600 text-field-600',
  red: 'border-signal-600 text-signal-600',
  amber: 'border-amber-600 text-amber-600',
} as const;

/**
 * Stamp slam (design.md §5.2.5): rubber-stamp graphic scales 1.6→1 at
 * rotation −8°, 300ms overshoot ease, ink-bleed opacity flicker and a small
 * landing shake. Absolutely positioned inside the nearest relative parent.
 */
export default function StampOverlay({ variant, show, className, onComplete }: StampOverlayProps) {
  const tone = TONE[variant];
  const reduced = prefersReducedMotion();
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className={cn(
            'pointer-events-none absolute inset-0 z-30 flex items-center justify-center',
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <motion.div
            initial={
              reduced
                ? { opacity: 0.88, scale: 1, rotate: -8 }
                : { opacity: 0, scale: 1.6, rotate: -16 }
            }
            animate={
              reduced
                ? { opacity: 0.88, scale: 1, rotate: -8 }
                : {
                    opacity: [0, 1, 0.55, 1],
                    scale: 1,
                    rotate: -8,
                    x: [0, -4, 3, -1, 0],
                  }
            }
            transition={{
              duration: reduced ? 0.01 : 0.3,
              ease: [0.34, 1.56, 0.64, 1],
              x: { delay: 0.28, duration: 0.18 },
              opacity: reduced ? { duration: 0.01 } : { duration: 0.34, times: [0, 0.4, 0.65, 1] },
            }}
            onAnimationComplete={onComplete}
            className={cn(
              'rounded-[4px] border-[3px] p-1.5 opacity-90',
              TONE_CLASSES[tone],
            )}
          >
            <span
              className={cn(
                'block rounded-[2px] border-2 px-5 py-2 font-mono text-xl font-semibold uppercase tracking-[0.14em]',
                TONE_CLASSES[tone],
              )}
            >
              {variant}
            </span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
