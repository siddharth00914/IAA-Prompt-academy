/**
 * Lenis smooth-scroll singleton (design.md §5.1).
 * lerp 0.1, wheel multiplier 1.0. Disabled entirely when the user prefers
 * reduced motion — native scrolling applies and scrollTo falls back to
 * instant jumps.
 */
import Lenis from 'lenis';

let lenis: Lenis | null = null;
let rafId = 0;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function initSmoothScroll(): () => void {
  if (lenis || prefersReducedMotion()) return () => undefined;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1.0 });
  const raf = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
  return () => {
    cancelAnimationFrame(rafId);
    lenis?.destroy();
    lenis = null;
  };
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Smooth-scroll to a CSS selector or element (900ms per design.md §5.3). */
export function scrollToTarget(target: string | HTMLElement, offset = 0): void {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 0.9 });
    return;
  }
  const el =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
