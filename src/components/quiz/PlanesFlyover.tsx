import { memo } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/**
 * Pass celebration (quiz.md §S3): three paper planes cross the top of the
 * screen once, dashed trails, 2.2s each, staggered 300ms. Celebratory but
 * professional — no confetti. Reduced motion: not rendered at all.
 * Isolated + memoized per react-dev.md perpetual-animation rules.
 */
const PLANES = [
  { top: 6, delay: 0, y: [0, -6, 0] },
  { top: 34, delay: 0.3, y: [0, 5, 0] },
  { top: 20, delay: 0.6, y: [0, -4, 0] },
] as const;

function PlanesFlyoverBase() {
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 overflow-hidden" aria-hidden>
      {PLANES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute flex items-center"
          style={{ top: p.top }}
          initial={{ x: '-12vw' }}
          animate={{ x: '112vw', y: p.y as unknown as number[] }}
          transition={{
            x: { duration: 2.2, delay: p.delay, ease: [0.4, 0.1, 0.6, 0.9] },
            y: { duration: 2.2, delay: p.delay, ease: 'easeInOut' },
          }}
        >
          <span className="mr-1 inline-block w-24 border-t-2 border-dashed border-amber-500/70" />
          <Send className="h-4 w-4 -rotate-12 text-ink-700" strokeWidth={1.5} fill="#F5F1E8" />
        </motion.div>
      ))}
    </div>
  );
}

const PlanesFlyover = memo(PlanesFlyoverBase);
export default PlanesFlyover;
