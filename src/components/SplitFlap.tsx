import { memo, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

export const SPLIT_FLAP_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—·';

interface SplitFlapProps {
  /** Final text to settle on. */
  text: string;
  className?: string;
  /** Per-cell classes (board boxes etc.). */
  cellClassName?: string;
  /** Delay before the first cell settles (ms). */
  startDelay?: number;
  /** Stagger between cells (ms) — design vocabulary: 30–45ms. */
  stagger?: number;
  glyphSet?: string;
}

const TICK_MS = 50;

/**
 * Split-flap reveal (design.md §5.2.2): characters cycle through the glyph
 * stack with a per-cell stagger and a subtle rotateX flip, like a departure
 * board. Reduced motion: the final text renders instantly as a crossfade.
 */
function SplitFlapBase({
  text,
  className,
  cellClassName,
  startDelay = 0,
  stagger = 40,
  glyphSet = SPLIT_FLAP_GLYPHS,
}: SplitFlapProps) {
  const chars = useMemo(() => text.split(''), [text]);
  const reduced = prefersReducedMotion();
  const [tick, setTick] = useState(0);

  const settleTick = (i: number) =>
    Math.ceil(startDelay / TICK_MS) + Math.ceil((i * stagger) / TICK_MS) + 3;
  const lastSettle = chars.length > 0 ? settleTick(chars.length - 1) : 0;

  useEffect(() => {
    if (reduced) return;
    setTick(0);
    const id = window.setInterval(() => {
      setTick((t) => {
        if (t >= lastSettle + 1) {
          window.clearInterval(id);
          return t;
        }
        return t + 1;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reduced, startDelay, stagger]);

  const glyphFor = (i: number, target: string) => {
    if (reduced || tick >= settleTick(i)) return target;
    if (target === ' ') return ' ';
    const n = glyphSet.length;
    return glyphSet[(tick * 7 + i * 13) % n];
  };

  return (
    <span
      className={cn('inline-flex perspective-600', className)}
      role="text"
      aria-label={text}
    >
      {chars.map((c, i) => (
        <span
          key={`${i}-${c}`}
          aria-hidden
          className={cn(
            'inline-block preserve-3d animate-flap-flip motion-reduce:animate-none',
            c === ' ' && 'w-[0.5em]',
            cellClassName,
          )}
          style={{ animationDelay: `${startDelay + i * stagger}ms` }}
        >
          {glyphFor(i, c)}
        </span>
      ))}
    </span>
  );
}

const SplitFlap = memo(SplitFlapBase);
export default SplitFlap;
