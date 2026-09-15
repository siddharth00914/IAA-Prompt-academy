import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitFlap from '@/components/SplitFlap';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GATES = [
  { n: 'G0', title: 'Welcome Aboard', line: 'What prompt engineering is — and why wording changes everything', meta: '4 LEGS · 25 MIN' },
  { n: 'G1', title: 'Clearance for Takeoff', line: 'Clear, specific instructions, delimiters, and output formats', meta: '4 LEGS · 30 MIN' },
  { n: 'G2', title: 'Flight Crew Roles', line: 'Personas, audience, context, and grounding', meta: '4 LEGS · 30 MIN' },
  { n: 'G3', title: 'Navigation by Examples', line: 'Few-shot examples and step-by-step reasoning', meta: '4 LEGS · 30 MIN' },
  { n: 'G4', title: 'On the Job at IND', line: 'Summarize, infer, transform, expand — and the iterate loop', meta: '4 LEGS · 35 MIN' },
  { n: 'G5', title: 'Safety & Security of AI', line: 'Hallucinations, SSI red lines, human-in-charge + capstone', meta: '4 LEGS · 40 MIN' },
] as const;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

/**
 * S2 — The Flight Plan (home.md §S2). Sticky stage + GSAP ScrollTrigger
 * scrub: dashed route draws top→bottom, a plane glyph rides the path tip,
 * gate cards activate as the plane passes. GSAP-only tree (no Framer Motion).
 * Reduced motion: everything renders fully drawn, no scrub.
 */
export default function S2FlightPlan() {
  const reduced = prefersReducedMotion();
  const isDesktop = useIsDesktop();
  const outerRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(reduced ? GATES.length : 0);

  const pathX = isDesktop ? 50 : 9;

  useGSAP(
    () => {
      if (reduced) return;
      const outer = outerRef.current;
      const path = pathRef.current;
      const plane = planeRef.current;
      const map = mapRef.current;
      if (!outer || !path || !plane || !map) return;

      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

      const positionPlane = (progress: number) => {
        const FLY_OFF = 0.94;
        const mapRect = map.getBoundingClientRect();
        if (progress <= FLY_OFF) {
          const l = len * (progress / FLY_OFF);
          const pt = path.getPointAtLength(l);
          const pt2 = path.getPointAtLength(Math.min(len, l + 0.6));
          const dxPx = ((pt2.x - pt.x) / 100) * mapRect.width;
          const dyPx = ((pt2.y - pt.y) / 100) * mapRect.height;
          const angle = Math.atan2(dyPx, dxPx) * (180 / Math.PI);
          gsap.set(plane, { left: `${pt.x}%`, top: `${pt.y}%`, rotate: angle, xPercent: -50, yPercent: -50 });
        } else {
          // unpin: fly off-screen right
          const t = (progress - FLY_OFF) / (1 - FLY_OFF);
          gsap.set(plane, {
            left: `${pathX + t * 130}%`,
            top: '97%',
            rotate: 0,
            xPercent: -50,
            yPercent: -50,
          });
        }
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            positionPlane(self.progress);
            const n = Math.min(GATES.length, Math.floor((self.progress / 0.9) * GATES.length + 0.35));
            setActive((prev) => (prev === n ? prev : n));
          },
        },
      });

      tl.to(path, { strokeDashoffset: 0, duration: 0.94, ease: 'none' }, 0);

      // gate cards activate as the plane passes
      const cards = gsap.utils.toArray<HTMLElement>('.fp-gate-card');
      const pings = gsap.utils.toArray<HTMLElement>('.fp-node-ping');
      cards.forEach((card, i) => {
        const at = (i + 0.45) / GATES.length * 0.9;
        tl.fromTo(
          card,
          { x: !isDesktop ? 40 : i % 2 === 0 ? -60 : 60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.09, ease: 'expo.out' },
          at,
        );
        if (pings[i]) {
          tl.fromTo(
            pings[i],
            { scale: 0, opacity: 0.9 },
            { scale: 1.6, opacity: 0, duration: 0.07, ease: 'power1.out' },
            at,
          );
        }
      });

      // header words rise on section entry
      const words = gsap.utils.toArray<HTMLElement>('.fp-head-word');
      gsap.fromTo(
        words,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.07,
          scrollTrigger: { trigger: outer, start: 'top 65%', toggleActions: 'play none none reverse' },
        },
      );

      positionPlane(0);
      if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: outerRef, dependencies: [reduced, isDesktop, pathX] },
  );

  return (
    <section id="flight-plan" ref={outerRef} className="relative h-[160vh] bg-paper lg:h-[220vh]">
      <div className="sticky top-0 flex h-[100dvh] flex-col overflow-hidden pt-16">
        {/* section header */}
        <div className="mx-auto w-full max-w-[1180px] px-6 pt-10">
          <p className="label text-amber-600">THE FLIGHT PLAN</p>
          <h2 className="display-2 mt-3 text-ink-900">
            {'Six gates. One departure: you.'.split(' ').map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <span className="fp-head-word inline-block">
                  {w}
                  {i < 5 ? ' ' : ''}
                </span>
              </span>
            ))}
          </h2>
        </div>

        {/* map area */}
        <div ref={mapRef} className="relative mx-auto w-full max-w-[1180px] flex-1 px-6">
          {/* flight path: planned route (faint dashes) + flown route (amber draw) */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={`M ${pathX} 1 L ${pathX} 99`}
              fill="none"
              stroke="#DCD4C3"
              strokeWidth="2"
              strokeDasharray="7 6"
              vectorEffect="non-scaling-stroke"
            />
            <path
              ref={pathRef}
              d={`M ${pathX} 1 L ${pathX} 99`}
              fill="none"
              stroke="#E09112"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* node dots + ping rings */}
          {GATES.map((g, i) => (
            <div
              key={g.n}
              className="absolute"
              style={{ left: `${pathX}%`, top: `${((i + 0.52) / GATES.length) * 100}%` }}
              aria-hidden
            >
              <span className="fp-node-ping absolute block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500" />
              <span
                className={cn(
                  'absolute block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                  i < active ? 'border-amber-500 bg-amber-500' : 'border-ink-300 bg-paper',
                )}
              />
            </div>
          ))}

          {/* plane glyph riding the path tip */}
          <div
            ref={planeRef}
            className="absolute z-10 will-change-transform"
            style={{ left: `${pathX}%`, top: '1%' }}
            aria-hidden
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 12 L22 3 L14 21 L11 13 Z"
                fill="#E09112"
                stroke="#211E17"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M11 13 L22 3" stroke="#211E17" strokeWidth="1.2" />
            </svg>
          </div>

          {/* gate cards */}
          <div className="flex h-full flex-col justify-between py-6">
            {GATES.map((g, i) => (
              <div
                key={g.n}
                className={cn(
                  'fp-gate-card w-full pl-14 lg:w-[42%] lg:pl-0',
                  i % 2 === 0 ? 'lg:self-start' : 'lg:self-end',
                  reduced || i < active ? 'opacity-100' : 'opacity-0',
                )}
              >
                <div className="rounded-[6px] border-2 border-ink-900 bg-paper-bright p-4 shadow-card sm:p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-sans text-[44px] font-black leading-none text-amber-600 sm:text-[56px]">
                      {i < active || reduced ? (
                        <SplitFlap text={g.n} stagger={60} />
                      ) : (
                        <span className="opacity-0">{g.n}</span>
                      )}
                    </span>
                    <span className="label shrink-0 text-ink-500">BOARDING ORDER {i + 1}/6</span>
                  </div>
                  <h3 className="h4 mt-2 text-ink-900">{g.title}</h3>
                  <p className="small mt-1 text-ink-500">{g.line}</p>
                  <p className="mt-3 border-t border-line pt-2 font-mono text-[12px] font-semibold tracking-wide text-ink-700">
                    {g.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
