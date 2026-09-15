import { useEffect, useRef } from 'react';
import { animate, motion } from 'framer-motion';
import { Plane, Star } from 'lucide-react';
import { useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];
const PATH_D = 'M 24 132 C 300 36, 720 24, 1176 96';
const HEADLINE = "You've arrived.";

/** S1 — Arrival hero, "Wheels Down" (certificate.md §S1). */
export default function S1ArrivalHero() {
  const reduced = prefersReducedMotion();
  const progress = useProgress();
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const completedDate = progress.certifiedAt
    ? new Date(progress.certifiedAt)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        .toUpperCase()
    : '—';
  const scenarios = Object.keys(progress.lab).length;

  // plane rides the drawing path via getPointAtLength, then parks with a bounce.
  // viewBox uses preserveAspectRatio="none", so map viewBox coords → box coords.
  useEffect(() => {
    const path = pathRef.current;
    const plane = planeRef.current;
    const track = trackRef.current;
    if (!path || !plane || !track) return;
    const len = path.getTotalLength();
    const sx = track.clientWidth / 1200;
    const sy = track.clientHeight / 160;
    const place = (t: number, rotate: number) => {
      const pt = path.getPointAtLength(len * t);
      plane.style.transform = `translate(${pt.x * sx - 12}px, ${pt.y * sy - 12}px) rotate(${rotate}deg)`;
    };
    if (reduced) {
      place(1, -6);
      return;
    }
    const controls = animate(0, 1, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => place(t, 0),
      onComplete: () => {
        // tiny parking bounce: rotate 0 → −6° → 0
        animate(0, 1, {
          duration: 0.5,
          ease: 'easeInOut',
          onUpdate: (t: number) => place(1, t < 0.5 ? -12 * t : -12 * (1 - t)),
        });
      },
    });
    return () => controls.stop();
  }, [reduced]);

  return (
    <section className="arrival-hide-print relative overflow-hidden bg-paper">
      <div className="mx-auto flex min-h-[80dvh] max-w-[1180px] flex-col px-6 pb-16 pt-10">
        {/* flight path across the top: G0 → ARRIVAL */}
        <div ref={trackRef} className="relative">
          <svg
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            className="block h-32 w-full sm:h-40"
            aria-hidden
          >
            <defs>
              {/* draw-on mask: white window sweeps left → right */}
              <mask id="arrival-path-mask" maskUnits="userSpaceOnUse">
                <rect x="0" y="0" width="1200" height="160" fill={reduced ? 'white' : 'black'} />
                {!reduced ? (
                  <motion.rect
                    x="0"
                    y="0"
                    height="160"
                    fill="white"
                    initial={{ width: 0 }}
                    animate={{ width: 1200 }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
              </mask>
            </defs>
            <path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="#A9A294"
              strokeWidth="2"
              strokeDasharray="10 8"
              strokeLinecap="round"
              mask={reduced ? undefined : 'url(#arrival-path-mask)'}
            />
          </svg>
          {/* endpoints */}
          <span className="data absolute left-0 top-[104px] text-[12px] font-semibold text-ink-500 sm:top-[128px]">
            G0
          </span>
          <span className="absolute right-0 top-[64px] flex flex-col items-center sm:top-[76px]">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" strokeWidth={1.5} aria-hidden />
            <span className="data mt-1 text-[12px] font-semibold text-amber-600">ARRIVAL</span>
          </span>
          {/* the plane riding the path */}
          <div ref={planeRef} className="pointer-events-none absolute left-0 top-0 h-6 w-6 will-change-transform" aria-hidden>
            <Plane className="h-6 w-6 rotate-45 text-ink-900" strokeWidth={1.5} />
          </div>
        </div>

        {/* headline stack */}
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <motion.p
            className="label text-amber-600"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            ARRIVAL GATE · IAA PROMPT ACADEMY
          </motion.p>
          <h1 className="display-1 mt-5 text-ink-900" aria-label={HEADLINE}>
            {HEADLINE.split(' ').map((word, i) => (
              <span key={i} aria-hidden className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={reduced ? false : { y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.6 + i * 0.08 }}
                >
                  {word}
                  {i < HEADLINE.split(' ').length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="body mt-6 max-w-[50ch] text-ink-700"
            initial={reduced ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.85 }}
          >
            Six gates. Twenty-four legs. Twelve chances to practice. One new skill that will
            quietly improve every document you write. The Indianapolis Airport Authority team
            just got sharper — and you did that.
          </motion.p>
          <motion.p
            className="data mt-8 text-[13px] uppercase tracking-[0.14em] text-ink-500"
            initial={reduced ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: 1 }}
          >
            COMPLETED {completedDate} · {progress.miles} MILES · {progress.wings.length}/5 WINGS
            · {scenarios}/12 SCENARIOS
          </motion.p>
        </div>

        {/* three paper planes loop the header once */}
        {!reduced
          ? [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                aria-hidden
                className="pointer-events-none absolute top-1/3"
                initial={{ x: '-10vw', y: 40 + i * 30, opacity: 0, rotate: 45 }}
                animate={{ x: '110vw', y: -30 + i * 10, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, delay: 1.2 + i * 0.3, ease: 'easeInOut' }}
              >
                <Plane className="h-4 w-4 text-ink-300" strokeWidth={1.5} />
              </motion.div>
            ))
          : null}
      </div>
    </section>
  );
}
