/**
 * Boarding-pass identity card (dashboard.md §S2). Dashboard-specific variant
 * of the shared BoardingPassCard pattern (same perforation/notch/stub
 * conventions) extended with the spec'd extras: ink-900 header strip, STATUS
 * field, course-wide jet-bridge progress row, and a QR-ish stub square that
 * only activates at certification. Barcode + QR are drawn in code.
 */
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { JetBridge, EASE_JET } from '@/components/dashboard/primitives';
import type { JourneyState } from '@/components/dashboard/journey-data';

const BARCODE = [3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1, 2, 2, 1];

/** Deterministic 21×21 QR-ish module grid (decorative; seeded by `seed`). */
function QrSquare({ active }: { active: boolean }) {
  const N = 21;
  let seed = 0;
  const s = 'WTP-101';
  for (let i = 0; i < s.length; i += 1) seed = (seed * 31 + s.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const finderOn = (r: number, c: number) => {
    const lr = r >= N - 7 ? r - (N - 7) : r;
    const lc = c >= N - 7 ? c - (N - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    return lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
  };
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      const on = inFinder(r, c)
        ? finderOn(r, c)
        : r === 6 || c === 6
          ? (r + c) % 2 === 0
          : rand() > 0.52;
      if (on) cells.push({ x: c, y: r });
    }
  }
  return (
    <svg
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      className="h-20 w-20"
      role="img"
      aria-label={active ? 'Certificate link — cleared' : 'Certificate link — not yet certified'}
    >
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill={active ? '#FBF8F1' : '#EDE7D9'} />
      <g fill={active ? '#211E17' : '#A9A294'}>
        {cells.map((cell, i) => (
          <rect key={i} x={cell.x} y={cell.y} width="1" height="1" />
        ))}
      </g>
    </svg>
  );
}

interface DashboardPassProps {
  journey: JourneyState;
}

export default function DashboardPass({ journey }: DashboardPassProps) {
  const reduced = prefersReducedMotion();
  const status = journey.certified ? 'CERTIFIED' : journey.started ? 'IN FLIGHT' : 'CHECKED IN';
  // `wide` fields span both grid columns so long values render in full
  // (no ellipsis) even inside the narrow 380px dashboard column.
  const fields = [
    { label: 'PASSENGER', value: 'IAA STAFF MEMBER', wide: true },
    { label: 'FROM', value: 'GATE 0 · WELCOME ABOARD', wide: true },
    { label: 'TO', value: 'CERTIFIED PROMPT PROFESSIONAL', wide: true },
    { label: 'STATUS', value: status },
    { label: 'SEAT', value: '1A' },
    { label: 'GROUP', value: `${journey.posGate + 1}/6` },
    { label: 'MILES', value: String(journey.miles) },
    { label: 'GATES MASTERED', value: `${journey.masteredCount}/6` },
  ];

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.6, ease: EASE_JET }}
      className="relative flex h-full flex-col overflow-hidden rounded-[6px] border border-line bg-paper-bright shadow-card sm:flex-row"
    >
      {/* left panel */}
      <div className="min-w-0 flex-1 sm:basis-[70%]">
        {/* header strip */}
        <div className="flex items-center gap-2 bg-ink-900 px-5 py-2.5">
          <Plane className="h-3.5 w-3.5 text-glow-amber" strokeWidth={1.5} aria-hidden />
          <span className="label text-fog-100">IAA PROMPT ACADEMY · BOARDING PASS</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 p-5">
          {fields.map((f) => (
            <div key={f.label} className={cn('min-w-0', f.wide && 'col-span-2')}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {f.label}
              </p>
              <p className="mt-1 truncate font-mono text-[12px] font-semibold uppercase tracking-wide text-ink-900">
                {f.value}
              </p>
            </div>
          ))}
        </div>
        {/* course progress row */}
        <div className="border-t border-dashed border-line px-5 pb-5 pt-4">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              COURSE PROGRESS
            </p>
            <p className="font-mono text-[13px] font-semibold text-amber-600">
              {Math.round(journey.coursePct * 100)}%
            </p>
          </div>
          <JetBridge pct={journey.coursePct} className="mt-3" />
        </div>
      </div>

      {/* perforation notches */}
      <span
        aria-hidden
        className="absolute right-[30%] top-0 hidden h-5 w-5 -translate-y-1/2 translate-x-1/2 rounded-full border border-line bg-paper sm:block"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-[30%] hidden h-5 w-5 translate-x-1/2 translate-y-1/2 rounded-full border border-line bg-paper sm:block"
      />

      {/* stub — 30%, wraps below the main panel on small screens;
          perforation = dashed divider (+ notches ≥ sm); tear wiggle on hover */}
      <motion.div
        className="relative flex min-w-0 flex-col items-center justify-center gap-3 border-t-2 border-dashed border-ink-300 p-5 sm:basis-[30%] sm:border-l-2 sm:border-t-0"
        whileHover={reduced ? undefined : { x: 2, rotate: 0.4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        {/* barcode — re-draws when miles change (progress update) */}
        <svg key={journey.miles} viewBox="0 0 96 40" className="h-9 w-24" aria-hidden>
          {BARCODE.map((w, i) => (
            <motion.rect
              key={i}
              x={BARCODE.slice(0, i).reduce((a, b) => a + b, 0) + i}
              y={0}
              width={w}
              height={40}
              fill="#211E17"
              initial={reduced ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.02, duration: 0.25, ease: 'easeOut' }}
              style={{ originY: 1 }}
            />
          ))}
        </svg>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
          WTP-101
        </p>
        {/* QR-ish certificate link — activates at Gate 5 completion */}
        {journey.certified ? (
          <Link
            to="/arrival"
            className="rounded-[2px] transition-shadow hover:shadow-glow-ring"
            aria-label="Certificate ready — go to arrival"
          >
            <QrSquare active />
          </Link>
        ) : (
          <div aria-disabled className="cursor-not-allowed">
            <QrSquare active={false} />
          </div>
        )}
        <p
          className={cn(
            'text-center font-mono text-[9px] font-semibold uppercase tracking-[0.14em]',
            journey.certified ? 'text-field-600' : 'text-ink-500',
          )}
        >
          {journey.certified ? 'CLEARED — VIEW CERTIFICATE' : 'CERTIFIES AT GATE 5'}
        </p>
      </motion.div>
    </motion.div>
  );
}
