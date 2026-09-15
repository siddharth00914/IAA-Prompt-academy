import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import type { StatBlock } from '@/content/types';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/** Stat block (lesson.md §3.11): big mono number that counts up on enter. */
export default function StatView({ block }: { block: StatBlock }) {
  const reduced = prefersReducedMotion();
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(numRef, { once: true, amount: 0.6 });

  useEffect(() => {
    if (!inView || !numRef.current) return;
    if (reduced) {
      numRef.current.textContent = String(block.value);
      return;
    }
    const controls = animate(0, block.value, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, block.value, reduced]);

  return (
    <div className="rounded-[6px] border-2 border-ink-900 bg-paper-bright p-6 shadow-card">
      <p className="flex items-baseline gap-3">
        <span
          ref={numRef}
          className="font-mono text-[56px] font-semibold leading-none tracking-tight text-amber-600"
        >
          0
        </span>
        {block.suffix ? (
          <span className="label text-ink-500">{block.suffix.toUpperCase()}</span>
        ) : null}
      </p>
      <p className="small mt-3 text-ink-700">{block.caption}</p>
    </div>
  );
}
