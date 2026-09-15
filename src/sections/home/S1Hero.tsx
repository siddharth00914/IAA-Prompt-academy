import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import SplitFlap from '@/components/SplitFlap';
import { hasAnyProgress, useProgress } from '@/lib/progress';
import { scrollToTarget, prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** S1 — Hero ("Departures Hall"), home.md §S1. */
export default function S1Hero() {
  const reduced = prefersReducedMotion();
  useProgress(); // re-render when progress loads/changes
  const resume = hasAnyProgress();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll parallax (framer-motion only in this tree): illustration −40px,
  // text +20px / opacity →0.4 over the first viewport of scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const illoY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  const headline = 'Cleared to prompt.'.split(' ');

  return (
    <section
      ref={sectionRef}
      className="relative -mt-16 flex min-h-[100dvh] items-center overflow-hidden bg-paper pt-16"
    >
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 px-6 py-20 lg:grid-cols-[55%_45%]">
        {/* text stack */}
        <motion.div style={reduced ? undefined : { y: textY, opacity: textOpacity }}>
          <p className="label text-amber-600">WINTHROP-TECH × INDIANAPOLIS AIRPORT AUTHORITY</p>

          {/* split-flap board */}
          <div className="mt-6 inline-flex overflow-hidden border-2 border-ink-900 bg-paper-bright">
            <SplitFlap
              text="NOW BOARDING · GATE 0"
              startDelay={300}
              stagger={45}
              className="font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-900 sm:text-[15px]"
              cellClassName="border-r border-line/70 px-[7px] py-2.5 last:border-r-0"
            />
          </div>

          {/* headline — word-level rise from clipped masks */}
          <h1 className="display-1 mt-6 text-ink-900">
            {headline.map((word, i) => (
              <span key={word + i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={reduced ? false : { y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.5 + i * 0.09 }}
                >
                  {word}
                  {i < headline.length - 1 ? '\u00A0' : ''}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={reduced ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_EXPO, delay: 1.1 }}
          >
            <p className="body mt-6 max-w-[52ch] text-ink-700">
              A hands-on flight school for AI. Six Gates, twelve airport scenarios, and one goal:
              every IAA team member writing prompts as precisely as we run this airfield.
            </p>
            <p className="data mt-5 text-ink-500">6 GATES · 24 LEGS · 12 LAB SCENARIOS · ≈3 HRS TOTAL</p>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={reduced ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_EXPO, delay: 1.3 }}
          >
            <Link to="/journey" className="btn-primary btn-beacon">
              {resume ? 'Resume Your Journey →' : 'Begin Boarding →'}
            </Link>
            <button type="button" onClick={() => scrollToTarget('#flight-plan')} className="btn-ghost">
              See the Flight Plan ↓
            </button>
          </motion.div>
        </motion.div>

        {/* illustration (60% on mobile, below CTAs) */}
        <div className="mx-auto w-[60%] sm:w-[80%] lg:w-full">
          <motion.div
            className="relative mx-auto w-full max-w-[560px]"
            style={reduced ? undefined : { y: illoY }}
            initial={reduced ? false : { scale: 1.04, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE_EXPO, delay: 0.4 }}
          >
          <div className="relative border-2 border-ink-900 bg-paper-bright p-2 shadow-card">
            {/* corner registration marks */}
            <span aria-hidden className="absolute -left-3 -top-3 h-5 w-5 border-l-2 border-t-2 border-ink-900" />
            <span aria-hidden className="absolute -right-3 -top-3 h-5 w-5 border-r-2 border-t-2 border-ink-900" />
            <span aria-hidden className="absolute -bottom-3 -left-3 h-5 w-5 border-b-2 border-l-2 border-ink-900" />
            <span aria-hidden className="absolute -bottom-3 -right-3 h-5 w-5 border-b-2 border-r-2 border-ink-900" />
            <img
              src="/hero-ind-skyline.webp"
              alt="Flat illustration of the Indianapolis skyline and IND terminal at golden hour, with two aircraft on climbing departure arcs"
              className="block h-auto w-full"
              width={2400}
              height={1350}
              loading="eager"
            />
            {/* looping dashed plane trail across the frame's top corner */}
            <svg
              aria-hidden
              viewBox="0 0 160 70"
              className="absolute -left-4 -top-12 w-40 overflow-visible"
            >
              <path
                d="M4 62 C 40 58, 70 40, 96 24 C 112 14, 132 10, 156 10"
                fill="none"
                stroke="#B9770E"
                strokeWidth="2"
                strokeDasharray="6 5"
                pathLength={100}
                strokeDashoffset={100}
                className="trail-loop-path motion-reduce:hidden"
              />
              <g className="trail-loop-plane motion-reduce:hidden">
                <path d="M150 4 l12 6 -12 6 3 -6 z" fill="#B9770E" />
              </g>
            </svg>
          </div>
          <p className="mt-3 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">
            FIELD ELEV 797 FT · COL K. INDY INTL
          </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
