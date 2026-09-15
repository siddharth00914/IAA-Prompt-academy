import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const BLIPS = [
  { left: '30%', top: '38%', delay: 0 },
  { left: '62%', top: '30%', delay: 0.7 },
  { left: '58%', top: '66%', delay: 1.3 },
] as const;

/** S6 — Safety Strip, Night Ops (home.md §S6). */
export default function S6SafetyStrip() {
  const reduced = prefersReducedMotion();
  const radarRef = useRef<HTMLDivElement>(null);
  const radarInView = useInView(radarRef, { amount: 0.3 });

  return (
    <section className="relative overflow-hidden bg-tarmac-950">
      <div className="grain-night" aria-hidden />
      <div className="relative mx-auto grid min-h-[70vh] max-w-[1180px] items-center gap-12 px-6 py-24 lg:grid-cols-2">
        {/* text */}
        <div>
          {[
            <p key="l" className="label text-glow-amber">MANDATORY EQUIPMENT</p>,
            <h2 key="h" className="display-2 mt-4 text-fog-100">Fly safe. Prompt safe.</h2>,
            <p key="b" className="body mt-6 max-w-[52ch] text-fog-300">
              We are a public body in a safety-critical industry. So Gate 5 is non-negotiable:
              what AI gets wrong (confidently), what can never leave controlled channels — SSI
              under 49 CFR 1520, passenger PII, badge data — and why a human always has the
              final sign-off.
            </p>,
            <div key="cta" className="mt-8">
              <Link
                to="/safety"
                className="inline-flex items-center gap-2 rounded-[2px] border-2 border-glow-amber px-6 py-3 font-sans text-[17px] font-bold text-glow-amber transition-all duration-200 hover:-translate-y-0.5 hover:bg-tarmac-900"
              >
                Review the safety briefing →
              </Link>
            </div>,
          ].map((node, i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: EASE_EXPO, delay: i * 0.1 }}
            >
              {node}
            </motion.div>
          ))}
        </div>

        {/* radar ring (code-drawn; sweep runs only while in viewport) */}
        <div ref={radarRef} className="relative mx-auto aspect-square w-full max-w-[420px]">
          {[100, 75, 50, 25].map((pct, i) => (
            <motion.span
              key={pct}
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-tarmac-700"
              style={{ width: `${pct}%`, height: `${pct}%` }}
              initial={reduced ? false : { scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: EASE_EXPO, delay: i * 0.12 }}
            />
          ))}
          {/* crosshairs */}
          <span aria-hidden className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-tarmac-700/60" />
          <span aria-hidden className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-tarmac-700/60" />
          {/* sweep line — 6s linear infinite, only while visible */}
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 motion-reduce:hidden',
              radarInView && !reduced ? 'animate-radar-sweep' : '',
            )}
          >
            <span className="absolute left-1/2 top-1/2 h-[2px] w-1/2 origin-left bg-glow-amber/80" />
          </div>
          {/* blips with repeating pings */}
          {BLIPS.map((b, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute"
              style={{ left: b.left, top: b.top }}
              initial={reduced ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.2 }}
            >
              <span
                className={cn(
                  'absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-glow-green animate-node-ping motion-reduce:animate-none',
                  !radarInView && '[animation-play-state:paused]',
                )}
                style={{ animationDelay: `${b.delay}s` }}
              />
              <span className="absolute block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-green" />
            </motion.span>
          ))}
          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
            SCOPE 04 · ALL TRAFFIC ACCOUNTED FOR
          </p>
        </div>
      </div>
    </section>
  );
}
