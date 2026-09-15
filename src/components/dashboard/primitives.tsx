/**
 * Small dashboard primitives: scroll reveal wrapper, motion-value count-up,
 * and the jet-bridge progress bar (design.md §5.2.7 — segmented amber bar
 * with a plane nub at the leading edge).
 */
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

export const EASE_JET = [0.22, 1, 0.36, 1] as [number, number, number, number];

// ── Reveal — app-page scroll reveal: fade-up 24px, 0.5s, 15% trigger (§5.3) ──

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const reduced = prefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduced ? 0.2 : 0.5, delay, ease: EASE_JET }}
    >
      {children}
    </motion.div>
  );
}

// ── CountUp — renders a number that tweens to `value` when in view ──────────

interface CountUpProps {
  value: number;
  /** Start value (e.g. previous session's miles). */
  from?: number;
  duration?: number;
  className?: string;
  /** Disable the tween (reduced motion / static render). */
  immediate?: boolean;
}

export function CountUp({ value, from = 0, duration = 0.6, className, immediate }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(immediate ? value : from);
  const text = useTransform(mv, (v) => String(Math.round(v)));
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (immediate || reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: EASE_JET });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}

// ── JetBridge — segmented amber progress bar with plane nub (§5.2.7) ─────────

interface JetBridgeProps {
  /** 0..1 */
  pct: number;
  className?: string;
  /** Bar height in px (default 8). */
  height?: number;
  /** Night Ops variant (dark track, glow-amber fill). */
  night?: boolean;
  /** Number of segment notches (default 6). */
  segments?: number;
}

export function JetBridge({ pct, className, height = 8, night = false, segments = 6 }: JetBridgeProps) {
  const reduced = prefersReducedMotion();
  const clamped = Math.max(0, Math.min(1, pct));
  const fill = night ? '#F2A93B' : '#E09112';
  return (
    <div
      className={cn('relative', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('w-full overflow-hidden rounded-[2px]', night ? 'bg-tarmac-700' : 'bg-paper-dim')}
        style={{ height }}
      >
        <motion.div
          className="relative h-full rounded-[2px]"
          style={{ backgroundColor: fill }}
          initial={reduced ? false : { width: '0%' }}
          whileInView={{ width: `${clamped * 100}%` }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE_JET }}
        >
          {/* segment notches */}
          {Array.from({ length: segments - 1 }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn('absolute top-0 h-full w-[2px]', night ? 'bg-tarmac-950' : 'bg-paper-bright')}
              style={{ left: `${((i + 1) / segments) * 100}%` }}
            />
          ))}
        </motion.div>
      </div>
      {/* plane nub at the leading edge */}
      {clamped > 0.02 ? (
        <motion.span
          aria-hidden
          className="absolute top-1/2 flex items-center justify-center"
          initial={reduced ? false : { left: '0%', opacity: 0 }}
          whileInView={{ left: `${clamped * 100}%`, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE_JET }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <Plane
            size={16}
            strokeWidth={2}
            className={cn('rotate-45', night ? 'text-glow-amber' : 'text-amber-600')}
          />
        </motion.span>
      ) : null}
    </div>
  );
}
