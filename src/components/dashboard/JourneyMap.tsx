/**
 * FlightPathMap (dashboard.md §S2) — Night Ops radar panel, fully code-drawn
 * (the map-journey.svg asset does not exist; drawn here per design.md §9):
 * tarmac background, thin lat/long grid, abstract Indiana outline, IND star
 * node with radar rings + slow sweep, five reliever dots. Overlaid: dashed
 * amber route G0→G5 → certificate star, state-aware gate nodes with
 * tooltips, and the plane at the learner's furthest point (flies the newly
 * completed segment on first load; teleports under reduced motion).
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, useInView } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import type { JourneyState } from '@/components/dashboard/journey-data';

// ── Map geometry (viewBox 1600×1000 — the panel keeps an exact 8/5 ratio) ────

const VB_W = 1600;
const VB_H = 1000;

/** Gate node coordinates in viewBox units. Index 6 = certificate star. */
const NODES: { x: number; y: number }[] = [
  { x: 230, y: 820 }, // G0 — DEPARTURE (bottom-left)
  { x: 430, y: 630 }, // G1
  { x: 640, y: 750 }, // G2
  { x: 850, y: 540 }, // G3
  { x: 1070, y: 630 }, // G4
  { x: 1260, y: 410 }, // G5
  { x: 1430, y: 210 }, // ARRIVAL star (top-right)
];

const ROUTE_D = [
  `M ${NODES[0].x} ${NODES[0].y}`,
  `C 300 800, 360 720, ${NODES[1].x} ${NODES[1].y}`,
  `C 500 540, 560 660, ${NODES[2].x} ${NODES[2].y}`,
  `C 720 840, 770 630, ${NODES[3].x} ${NODES[3].y}`,
  `C 930 450, 990 540, ${NODES[4].x} ${NODES[4].y}`,
  `C 1150 720, 1180 500, ${NODES[5].x} ${NODES[5].y}`,
  `C 1340 320, 1350 290, ${NODES[6].x} ${NODES[6].y}`,
].join(' ');

/** Abstract simplified Indiana (notched NW lake corner, jagged Ohio River south). */
const INDIANA_D =
  'M 372 205 L 418 246 L 418 178 L 905 178 L 905 700 L 880 742 L 846 726 ' +
  'L 812 768 L 770 742 L 724 792 L 676 764 L 640 812 L 596 786 L 552 828 ' +
  'L 508 800 L 470 838 L 448 792 L 448 300 Z';

const IND = { x: 610, y: 500 };
const RELIEVERS = [
  { x: 520, y: 430 },
  { x: 470, y: 560 },
  { x: 700, y: 470 },
  { x: 770, y: 570 },
  { x: 655, y: 425 },
];

const NODE_R = 32;
const POS_KEY = 'iaa-pa:map-pos';
const DRAWN_KEY = 'iaa-pa:map-drawn';

const pct = (x: number, y: number) => ({ left: `${(x / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%` });

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface JourneyMapProps {
  journey: JourneyState;
  /** No legs done, no check attempts, no lab work — show START HERE at G0. */
  brandNew: boolean;
}

function JourneyMapBase({ journey, brandNew }: JourneyMapProps) {
  const reduced = prefersReducedMotion();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const inView = useInView(panelRef, { amount: 0.15 });
  const [hdg, setHdg] = useState(45);
  const [routeDrawn, setRouteDrawn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return reduced || window.sessionStorage.getItem(DRAWN_KEY) === '1';
  });

  const { gates, positionIndex } = journey;
  const posIndex = Math.min(positionIndex, NODES.length - 1);
  const rest = NODES[posIndex];

  // Node lengths along the route + resting heading; plane fly-in.
  useEffect(() => {
    const path = routeRef.current;
    const plane = planeRef.current;
    if (!path || !plane) return;

    const total = path.getTotalLength();
    const SAMPLES = 400;
    const pts: { len: number; x: number; y: number }[] = [];
    for (let i = 0; i <= SAMPLES; i += 1) {
      const len = (i / SAMPLES) * total;
      const p = path.getPointAtLength(len);
      pts.push({ len, x: p.x, y: p.y });
    }
    const lengthAt = (x: number, y: number) => {
      let best = pts[0];
      let bestD = Infinity;
      for (const p of pts) {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      return best.len;
    };

    const target = lengthAt(rest.x, rest.y);

    const placeAt = (len: number) => {
      const a = path.getPointAtLength(Math.max(0, Math.min(total, len)));
      const b = path.getPointAtLength(Math.max(0, Math.min(total, len + 2)));
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      plane.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${deg})`);
      return { a, b };
    };

    // Heading readout at the resting point (aviation: 000 = up/north).
    const { a, b } = placeAt(target);
    const heading = Math.round(((Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI + 360) % 360);
    setHdg(Number.isFinite(heading) ? heading : 0);

    // Fly the newly completed segment (forward only); teleport otherwise.
    const stored = Number(window.localStorage.getItem(POS_KEY) ?? posIndex);
    const prevIndex = Number.isFinite(stored) ? Math.max(0, Math.min(NODES.length - 1, stored)) : posIndex;
    if (reduced || prevIndex >= posIndex) {
      placeAt(target);
    } else {
      const from = lengthAt(NODES[prevIndex].x, NODES[prevIndex].y);
      const DURATION = 1400;
      const DELAY = 350;
      let raf = 0;
      const t0 = performance.now() + DELAY;
      const tick = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - t0) / DURATION));
        placeAt(from + (target - from) * easeInOut(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      window.localStorage.setItem(POS_KEY, String(posIndex));
      return () => cancelAnimationFrame(raf);
    }
    window.localStorage.setItem(POS_KEY, String(posIndex));
    return undefined;
  }, [posIndex, reduced, rest.x, rest.y]);

  const markDrawn = () => {
    if (routeDrawn) return;
    setRouteDrawn(true);
    try {
      window.sessionStorage.setItem(DRAWN_KEY, '1');
    } catch {
      /* session storage unavailable — redraw next visit */
    }
  };

  const nodeState = (i: number): 'mastered' | 'current' | 'open' | 'locked' => {
    const g = gates[i];
    if (!g) return 'locked';
    if (g.mastered) return 'mastered';
    if (!g.unlocked) return 'locked';
    if (i === posIndex && posIndex < 6) return 'current';
    return 'open';
  };

  const tooltip = useMemo(
    () =>
      gates.map((g, i) => {
        const state = nodeState(i);
        const cta =
          state === 'locked'
            ? `LOCKED — PASS THE G${i - 1} CHECK`
            : state === 'mastered'
              ? 'REVIEW'
              : brandNew && i === 0
                ? 'START'
                : 'CONTINUE';
        return { g, state, cta };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gates, posIndex, brandNew],
  );

  return (
    <div
      ref={panelRef}
      // contain:inline-size stops the min-w-[544px] pan-surface below from
      // propagating intrinsic width up to the page grid (which forced the
      // /journey page ~570px wide on a 390px viewport). The inner
      // overflow-x-auto still gives drag-pan on small screens.
      className="relative overflow-hidden rounded-[10px] border border-tarmac-700 bg-tarmac-950 [contain:inline-size]"
    >
      <div className="grain-night" aria-hidden />
      {/* horizontal pan on small screens: edge fade + drag caption */}
      <div
        className="h-full overflow-x-auto lg:overflow-visible"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0, black 26px, black calc(100% - 26px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 26px, black calc(100% - 26px), transparent 100%)',
        }}
      >
        <div className="relative mx-auto aspect-[8/5] w-full min-w-[544px]">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Journey radar map: the route from Gate 0 to Gate 5 and on to the certificate"
          >
            <defs>
              {/* the one permitted gradient: faint radial radar glow (§2.3a) */}
              <radialGradient id="ind-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F2A93B" stopOpacity="0" />
              </radialGradient>
              <mask id="route-reveal">
                <motion.path
                  d={ROUTE_D}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="10"
                  strokeLinecap="round"
                  initial={reduced || routeDrawn ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
                  onAnimationComplete={markDrawn}
                />
              </mask>
            </defs>

            {/* lat/long grid */}
            <g stroke="#3A352A" strokeWidth="1" opacity="0.45">
              {Array.from({ length: 15 }, (_, i) => (
                <line key={`v${i}`} x1={(i + 1) * 100} y1="0" x2={(i + 1) * 100} y2={VB_H} />
              ))}
              {Array.from({ length: 9 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={(i + 1) * 100} x2={VB_W} y2={(i + 1) * 100} />
              ))}
            </g>

            {/* Indiana + reliever fields */}
            <path d={INDIANA_D} fill="none" stroke="#3A352A" strokeWidth="1.5" />
            <g fill="#96907F" opacity="0.55">
              {RELIEVERS.map((r, i) => (
                <circle key={i} cx={r.x} cy={r.y} r="7" />
              ))}
            </g>

            {/* IND star + radar rings + glow + sweep */}
            <circle cx={IND.x} cy={IND.y} r="300" fill="url(#ind-glow)" />
            <g fill="none" stroke="#F2A93B">
              <circle cx={IND.x} cy={IND.y} r="40" opacity="0.3" />
              <circle cx={IND.x} cy={IND.y} r="80" opacity="0.18" />
              <circle cx={IND.x} cy={IND.y} r="120" opacity="0.1" />
            </g>
            {!reduced ? (
              <g
                className="animate-radar-sweep"
                style={{
                  transformOrigin: `${IND.x}px ${IND.y}px`,
                  animationDuration: '12s',
                  animationPlayState: inView ? 'running' : 'paused',
                }}
              >
                <line x1={IND.x} y1={IND.y} x2={IND.x + 260} y2={IND.y} stroke="#F2A93B" strokeWidth="2" opacity="0.15" />
                <path d={`M ${IND.x} ${IND.y} L ${IND.x + 260} ${IND.y} A 260 260 0 0 0 ${IND.x + 225} ${IND.y - 130} Z`} fill="#F2A93B" opacity="0.05" />
              </g>
            ) : null}
            <path
              d={`M ${IND.x} ${IND.y - 16} L ${IND.x + 4} ${IND.y - 4} L ${IND.x + 16} ${IND.y} L ${IND.x + 4} ${IND.y + 4} L ${IND.x} ${IND.y + 16} L ${IND.x - 4} ${IND.y + 4} L ${IND.x - 16} ${IND.y} L ${IND.x - 4} ${IND.y - 4} Z`}
              fill="#F2A93B"
            />

            {/* dashed amber route (revealed once via mask, then crawls gently) */}
            <g mask={reduced || routeDrawn ? undefined : 'url(#route-reveal)'}>
              <path
                ref={routeRef}
                d={ROUTE_D}
                fill="none"
                stroke="#F2A93B"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="14 10"
                className={reduced ? undefined : 'animate-dash-crawl'}
              />
            </g>

            {/* gate nodes */}
            {gates.map((g, i) => {
              const n = NODES[i];
              const state = nodeState(i);
              return (
                <g key={g.id}>
                  {state === 'mastered' ? (
                    <circle cx={n.x} cy={n.y} r={NODE_R + 10} fill="none" stroke="#6FB98D" strokeWidth="2" strokeDasharray="5 6" opacity="0.85" />
                  ) : null}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={NODE_R}
                    fill={state === 'mastered' ? '#6FB98D' : state === 'current' ? '#F2A93B' : '#1E1B14'}
                    stroke={state === 'mastered' ? '#6FB98D' : state === 'locked' ? '#3A352A' : '#F2A93B'}
                    strokeWidth="3"
                  />
                  {state === 'mastered' ? (
                    <path
                      d={`M ${n.x - 13} ${n.y + 1} l 9 10 l 17 - 20`}
                      fill="none"
                      stroke="#F5F1E8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                  {state === 'current' ? <circle cx={n.x} cy={n.y} r="7" fill="#16140F" /> : null}
                </g>
              );
            })}

            {/* certificate star — ARRIVAL */}
            <g transform={`translate(${NODES[6].x} ${NODES[6].y})`}>
              <path
                d="M 0 -30 L 7 -7 L 30 0 L 7 7 L 0 30 L -7 7 L -30 0 L -7 -7 Z"
                fill={journey.certified ? '#F2A93B' : '#1E1B14'}
                stroke="#F2A93B"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>

            {/* plane at the learner's furthest point (transform driven in effect) */}
            <g ref={planeRef} transform={`translate(${rest.x} ${rest.y})`}>
              <g transform="scale(2.1)">
                <path
                  d="M -11 -8 L 15 0 L -11 8 L -5 0 Z"
                  fill="#F1EDE2"
                  stroke="#16140F"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </svg>

          {/* ── HTML overlay: labels, pings, hit areas, tooltips ── */}
          {tooltip.map(({ g, state, cta }, i) => {
            const n = NODES[i];
            const align =
              i === 0 ? 'left-0' : i >= 4 ? 'right-0' : 'left-1/2 -translate-x-1/2';
            return (
              <div key={g.id}>
                {/* one-shot staggered ping on load (framer composes x/y + scale) */}
                {!reduced ? (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute h-6 w-6 rounded-full border-2 border-glow-amber"
                    style={{ ...pct(n.x, n.y), x: '-50%', y: '-50%' }}
                    initial={{ scale: 0.2, opacity: 0.9 }}
                    whileInView={{ scale: 1.8, opacity: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ delay: 1 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                  />
                ) : null}
                {/* continuous radar pulse on the current node (negative margins
                    center it — the keyframe owns the transform) */}
                {state === 'current' && !reduced ? (
                  <span aria-hidden className="pointer-events-none absolute h-0 w-0" style={pct(n.x, n.y)}>
                    <span className="absolute -left-3.5 -top-3.5 h-7 w-7 animate-node-ping rounded-full border-2 border-glow-amber" />
                  </span>
                ) : null}
                {/* gate label */}
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -translate-x-1/2 font-mono text-[11px] font-semibold tracking-[0.14em]',
                    state === 'locked' ? 'text-fog-500' : 'text-fog-100',
                  )}
                  style={{ left: `${(n.x / VB_W) * 100}%`, top: `${((n.y + 58) / VB_H) * 100}%` }}
                >
                  {g.number}
                </span>
                {/* hit area + tooltip (aria-disabled keeps tooltip focusable) */}
                <button
                  type="button"
                  aria-disabled={state === 'locked'}
                  onClick={() => {
                    if (state !== 'locked') navigate(`/gates/${g.id}`);
                  }}
                  aria-label={
                    state === 'locked'
                      ? `${g.number} ${g.title} — locked, pass the Gate ${i - 1} check first`
                      : `${g.number} ${g.title} — ${g.legsDone} of 4 legs — open gate`
                  }
                  className={cn(
                    'group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
                    state === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                  style={pct(n.x, n.y)}
                >
                  {state === 'locked' ? (
                    <Lock className="h-3 w-3 text-fog-500" strokeWidth={1.5} aria-hidden />
                  ) : null}
                  {/* tooltip — mini gate card */}
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-full z-30 mb-2 w-48 rounded-[6px] border border-tarmac-700 bg-tarmac-900 p-3 text-left opacity-0 shadow-modal transition-all duration-200',
                      'translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100',
                      align,
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[13px] font-semibold text-glow-amber">{g.number}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-500">
                        {g.legsDone}/4 LEGS
                      </span>
                    </span>
                    <span className="mt-1 block font-sans text-[14px] font-bold leading-tight text-fog-100">
                      {g.title}
                    </span>
                    {g.checkScore !== null ? (
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-glow-green">
                        CHECK: {g.checkScore}%
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'mt-2 inline-block rounded-[2px] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]',
                        state === 'locked'
                          ? 'bg-tarmac-800 text-fog-500'
                          : state === 'mastered'
                            ? 'bg-field-100 text-field-600'
                            : 'bg-glow-amber text-tarmac-950',
                      )}
                    >
                      {cta}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}

          {/* arrival star label + hit area */}
          <span
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 font-mono text-[11px] font-semibold tracking-[0.14em] text-glow-amber"
            style={{ left: `${(NODES[6].x / VB_W) * 100}%`, top: `${((NODES[6].y + 52) / VB_H) * 100}%` }}
          >
            ARRIVAL
          </span>
          {posIndex === 6 && !reduced ? (
            <span aria-hidden className="pointer-events-none absolute h-0 w-0" style={pct(NODES[6].x, NODES[6].y)}>
              <span className="absolute -left-3.5 -top-3.5 h-7 w-7 animate-node-ping rounded-full border-2 border-glow-amber" />
            </span>
          ) : null}

          {/* DEPARTURE tag + START HERE bounce for brand-new learners */}
          <span
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 font-mono text-[11px] tracking-[0.14em] text-fog-500"
            style={{ left: `${(NODES[0].x / VB_W) * 100}%`, top: `${((NODES[0].y - 92) / VB_H) * 100}%` }}
          >
            DEPARTURE
          </span>
          {brandNew ? (
            <motion.span
              className="pointer-events-none absolute rounded-[2px] bg-glow-amber px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-tarmac-950"
              style={{
                left: `${(NODES[0].x / VB_W) * 100}%`,
                top: `${((NODES[0].y - 132) / VB_H) * 100}%`,
                x: '-50%',
              }}
              animate={reduced ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              START HERE
            </motion.span>
          ) : null}

          {/* plane radar ring (cursor pointer, navigates to next-up) */}
          <button
            type="button"
            onClick={() => navigate(journey.nextUp.href)}
            aria-label={`Your plane — currently at ${journey.posLabel === 'ARRIVED' ? 'arrival' : `Gate ${journey.posGate}, ${journey.posLabel}`}. Go to next up.`}
            className="absolute block h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
            style={pct(rest.x, rest.y)}
          >
            {!reduced ? (
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-full animate-node-ping rounded-full border border-glow-amber"
              />
            ) : null}
          </button>

          {/* POS readout — bottom-left mono */}
          <p className="pointer-events-none absolute bottom-3 left-4 font-mono text-[11px] font-medium tracking-[0.12em] text-fog-500">
            POS: {posIndex === 6 ? journey.posLabel : `GATE ${journey.posGate} · ${journey.posLabel}`} · HDG {String(hdg).padStart(3, '0')}
          </p>
          {/* drag caption (mobile pan affordance) */}
          <p className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-[0.14em] text-fog-500 lg:hidden">
            DRAG →
          </p>
        </div>
      </div>
    </div>
  );
}

const JourneyMap = memo(JourneyMapBase);
export default JourneyMap;
