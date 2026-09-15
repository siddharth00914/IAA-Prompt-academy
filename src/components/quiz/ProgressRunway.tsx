import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

export type RunwayLightState = 'correct' | 'wrong' | 'current' | 'upcoming';

interface ProgressRunwayProps {
  lights: RunwayLightState[];
  className?: string;
}

/**
 * Progress runway (quiz.md §S2): threshold-light dots — answered-correct green,
 * answered-wrong red, current amber pulse, upcoming line. A freshly answered
 * light pings (scale 1→1.4→1). Reduced motion: static fills, no pulse.
 */
export default function ProgressRunway({ lights, className }: ProgressRunwayProps) {
  const reduced = prefersReducedMotion();
  return (
    <div className={cn('flex items-center gap-3', className)} role="presentation" aria-hidden>
      <span className="h-[2px] flex-1 bg-line" />
      {lights.map((state, i) => {
        const ping = (state === 'correct' || state === 'wrong') && !reduced;
        return (
          <motion.span
            key={`${i}-${state}`}
            initial={ping ? { scale: 1 } : false}
            animate={ping ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={ping ? { duration: 0.4, times: [0, 0.5, 1] } : { duration: 0.1 }}
            className={cn(
              'h-3 w-3 rounded-full border',
              state === 'correct' && 'border-field-600 bg-field-500',
              state === 'wrong' && 'border-signal-600 bg-signal-500',
              state === 'current' &&
                'border-amber-600 bg-amber-500 animate-taxiway-blink motion-reduce:animate-none',
              state === 'upcoming' && 'border-line bg-paper-dim',
            )}
          />
        );
      })}
      <span className="h-[2px] flex-1 bg-line" />
    </div>
  );
}
