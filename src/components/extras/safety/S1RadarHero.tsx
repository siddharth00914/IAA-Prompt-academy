import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { prefersReducedMotion, scrollToTarget } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const HEADLINE = 'Fly safe. Prompt safe.';

/**
 * Headline split into word-level units (computed once, module scope).
 * Each word is a nowrap inline-block so lines can only break BETWEEN words
 * (never mid-word); `start` is the word's char offset for the stagger, and a
 * trailing animated space keeps the word gap. Char animation is unchanged.
 */
const HEADLINE_WORDS = (() => {
  let offset = 0;
  return HEADLINE.split(' ').map((word, wi, arr) => {
    const entry = { word, start: offset, trailingSpace: wi < arr.length - 1 };
    offset += word.length + 1; // +1 for the space
    return entry;
  });
})();

const BLIPS = [
  { left: '34%', top: '30%', delay: 0, red: false },
  { left: '63%', top: '52%', delay: 0.7, red: false },
  { left: '46%', top: '68%', delay: 1.3, red: true },
] as const;

/** S1 — Hero, "The Radar Room" (safety.md §S1). Night Ops, 100vh. */
export default function S1RadarHero() {
  const reduced = prefersReducedMotion();
  const radarRef = useRef<HTMLDivElement>(null);
  const radarInView = useInView(radarRef, { amount: 0.25 });

  return (
    <section className="relative overflow-hidden bg-tarmac-950">
      <div className="grain-night" aria-hidden />
      <div className="relative mx-auto grid min-h-[calc(100dvh-64px)] max-w-[1180px] items-center gap-12 px-6 py-16 lg:grid-cols-2">
        {/* text stack */}
        <div>
          <motion.p
            className="label text-glow-amber"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            MANDATORY BRIEFING · READ BEFORE GATE 5
          </motion.p>

          {/* headline — character-split rise, 40ms stagger; words are nowrap
              units so wrapping can only happen between words */}
          <h1 className="display-1 mt-6 text-fog-100" aria-label={HEADLINE}>
            {HEADLINE_WORDS.map(({ word, start, trailingSpace }) => (
              <span key={start} aria-hidden className="inline-block whitespace-nowrap">
                {word.split('').map((c, ci) => (
                  <span key={ci} className="inline-block overflow-hidden pb-1 align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={reduced ? false : { y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{
                        duration: 0.7,
                        ease: EASE_EXPO,
                        delay: 0.2 + (start + ci) * 0.04,
                      }}
                    >
                      {c}
                    </motion.span>
                  </span>
                ))}
                {trailingSpace ? (
                  <span className="inline-block overflow-hidden pb-1 align-bottom">
                    <motion.span
                      className="inline-block w-[0.28em]"
                      initial={reduced ? false : { y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{
                        duration: 0.7,
                        ease: EASE_EXPO,
                        delay: 0.2 + (start + word.length) * 0.04,
                      }}
                    >
                      {'\u00A0'}
                    </motion.span>
                  </span>
                ) : null}
              </span>
            ))}
          </h1>

          <motion.p
            className="body mt-6 max-w-[54ch] text-fog-300"
            initial={reduced ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.5 }}
          >
            Indianapolis Airport Authority is a public body in a safety-critical industry.
            That changes everything about how we use AI: every prompt may be a public record,
            every output is something the Authority effectively says, and some information can
            never leave controlled channels. None of this is reason to fear the tool. It's
            reason to fly it by the book — like everything else on this airfield.
          </motion.p>

          <motion.p
            className="data mt-8 text-[13px] uppercase tracking-[0.14em] text-fog-500"
            initial={reduced ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.62 }}
          >
            2 CASE STUDIES · 10 HOUSE RULES · 1 PLEDGE ·{' '}
            <span className="text-glow-red">0 EXCEPTIONS FOR SSI</span>
          </motion.p>

          <motion.div
            className="mt-10"
            initial={reduced ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.72 }}
          >
            <button
              type="button"
              onClick={() => scrollToTarget('#safety-hallucination', -80)}
              className="inline-flex items-center gap-2 rounded-[2px] border-2 border-glow-amber px-6 py-3 font-sans text-[17px] font-bold text-glow-amber transition-all duration-200 hover:-translate-y-0.5 hover:bg-tarmac-900"
            >
              Begin the briefing ↓
            </button>
          </motion.div>
        </div>

        {/* radar panel — image in a 2px frame + live conic sweep overlaid in code */}
        <motion.div
          ref={radarRef}
          className="relative border-2 border-tarmac-700"
          initial={reduced ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE_EXPO, delay: 0.3 }}
        >
          <img
            src="/safety-radar.webp"
            alt="Night-ops radar scope with a shield at center and aircraft blips"
            className="block h-auto w-full"
          />
          {/* conic sweep — opacity ≤ 0.12, 6s rotation, in-viewport only */}
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-[8%] rounded-full motion-reduce:hidden',
              radarInView && !reduced ? 'animate-radar-sweep' : '',
            )}
            style={{
              background:
                'conic-gradient(from 0deg, rgba(242,169,59,0.9) 0deg, rgba(242,169,59,0.25) 55deg, transparent 90deg)',
              opacity: 0.12,
            }}
          />
          {/* blips ping on a 2s staggered loop — one is flagged red */}
          {BLIPS.map((b, i) => (
            <span key={i} aria-hidden className="absolute" style={{ left: b.left, top: b.top }}>
              <span
                className={cn(
                  'absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border animate-node-ping motion-reduce:animate-none',
                  b.red ? 'border-glow-red' : 'border-glow-green',
                  !radarInView && '[animation-play-state:paused]',
                )}
                style={{ animationDelay: `${b.delay}s` }}
              />
              <span
                className={cn(
                  'block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
                  b.red ? 'bg-glow-red' : 'bg-glow-green',
                )}
              />
            </span>
          ))}
          <p className="absolute bottom-3 left-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-fog-500">
            SCOPE IND-05 · NIGHT OPS
          </p>
        </motion.div>
      </div>
    </section>
  );
}
