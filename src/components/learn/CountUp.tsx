import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Mono number that counts up when it scrolls into view (best-score readout). */
export default function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = prefersReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduced) {
      ref.current.textContent = `${value}${suffix}`;
      return;
    }
    const c = animate(0, value, {
      duration: 1,
      ease: EASE_EXPO,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => c.stop();
  }, [inView, value, suffix, reduced]);
  return (
    <span ref={ref} className="tabular-nums">
      0{suffix}
    </span>
  );
}
