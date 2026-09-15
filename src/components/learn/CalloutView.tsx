import { motion } from 'framer-motion';
import type { CalloutBlock } from '@/content/types';
import Callout from '@/components/Callout';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/**
 * Callout block (lesson.md §3.5): Tower Advisory / Hold Short via the shared
 * Callout. Entrance: slide-in from the left with a spine draw (scaleY 0→1).
 */
export default function CalloutView({ block }: { block: CalloutBlock }) {
  const reduced = prefersReducedMotion();
  const spine = block.variant === 'tower' ? 'bg-amber-500' : 'bg-signal-500';
  return (
    <motion.div
      className="relative"
      initial={reduced ? false : { opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.span
        aria-hidden
        className={`absolute -left-3 top-0 h-full w-[3px] origin-top rounded-full ${spine}`}
        initial={reduced ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
      <Callout variant={block.variant} title={block.title}>
        <p>{block.body}</p>
      </Callout>
    </motion.div>
  );
}
