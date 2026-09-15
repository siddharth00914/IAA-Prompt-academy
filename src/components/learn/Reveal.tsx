import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/**
 * Standard lesson-block entrance (lesson.md §S1): fade-up as the block enters
 * the viewport (15% offset), once. Reduced motion renders instantly.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = prefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.5, ease: EASE_EXPO, delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
