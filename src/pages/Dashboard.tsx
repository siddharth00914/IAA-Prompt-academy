/**
 * Dashboard — the Journey Map (`/journey`), dashboard.md §S1–S6.
 * The learner's home: greeting + miles, boarding-pass identity card, Night
 * Ops flight-path journey map, now-boarding next-up, gates grid, wings rack,
 * miles ledger + lab status. Every panel is a live view of the progress
 * store; scroll-triggered reveals only (no pinning, design.md §5.3).
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { checkIn, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';
import { CountUp, EASE_JET, Reveal } from '@/components/dashboard/primitives';
import { computeJourney, formatEta } from '@/components/dashboard/journey-data';
import DashboardPass from '@/components/dashboard/DashboardPass';
import JourneyMap from '@/components/dashboard/JourneyMap';
import NowBoarding from '@/components/dashboard/NowBoarding';
import GatesGrid from '@/components/dashboard/GatesGrid';
import WingsRack from '@/components/dashboard/WingsRack';
import MilesLedger from '@/components/dashboard/MilesLedger';
import ResetJourney from '@/components/dashboard/ResetJourney';

const MILES_PREV_KEY = 'iaa-pa:miles-prev';

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <Reveal className="mb-8">
      <p className="label text-amber-600">{label}</p>
      <h2 className="h2 mt-3 text-ink-900">{title}</h2>
    </Reveal>
  );
}

export default function Dashboard() {
  const progress = useProgress();
  const reduced = prefersReducedMotion();

  // First-visit check-in (+10 miles welcome entry; idempotent).
  useEffect(() => {
    checkIn();
  }, []);

  const journey = useMemo(() => computeJourney(progress), [progress]);
  const brandNew =
    journey.gates.every((g) => g.legsDone === 0 && g.checkAttempts === 0) &&
    journey.labCleared === 0 &&
    !progress.pledgeSigned;

  // Miles chip counts up from the previous session value (§S1).
  const [prevMiles] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(MILES_PREV_KEY);
    const parsed = raw !== null ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(MILES_PREV_KEY, String(journey.miles));
      } catch {
        /* storage unavailable */
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [journey.miles]);

  const headerStagger = (i: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.2 : 0.5, delay: reduced ? 0 : i * 0.06, ease: EASE_JET },
  });

  return (
    <div className="mx-auto max-w-[1180px] px-6">
      {/* ── S1 — Header band ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 pb-10 pt-10 lg:flex-row lg:items-end lg:justify-between lg:pt-14">
        <div>
          <motion.p {...headerStagger(0)} className="label text-amber-600">
            JOURNEY BOARD · IND
          </motion.p>
          <motion.h1 {...headerStagger(1)} className="h1 mt-4 text-ink-900">
            Good day, Captain.
          </motion.h1>
          <motion.p {...headerStagger(2)} className="data mt-4 text-ink-500">
            ROUTE: GATE 0 → GATE 5 · {journey.masteredCount} OF 6 GATES MASTERED · ETA TO
            CERTIFICATE: {journey.certified ? 'ARRIVED' : formatEta(journey.etaMinutes)}
          </motion.p>
        </div>
        <motion.div {...headerStagger(3)} className="shrink-0 lg:text-right">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
            <Plane className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.5} aria-hidden />
            <span
              aria-hidden
              className="h-2 w-2 animate-taxiway-blink rounded-full bg-amber-500 motion-reduce:animate-none"
            />
            <span className="font-mono text-[14px] font-semibold tracking-wide text-ink-900">
              <CountUp value={journey.miles} from={prevMiles} duration={0.6} /> MILES
            </span>
          </span>
          <p className="small mt-3 max-w-[34ch] text-ink-500 lg:ml-auto">
            Miles reward effort, never rank. There are no leaderboards on this airfield.
          </p>
        </motion.div>
      </section>

      {/* ── S2 — Boarding pass + flight path map ─────────────────────── */}
      <section className="grid gap-6 pb-14 lg:grid-cols-[380px_minmax(0,1fr)] lg:pb-20">
        <DashboardPass journey={journey} />
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.5, delay: reduced ? 0 : 0.15, ease: EASE_JET }}
        >
          <JourneyMap journey={journey} brandNew={brandNew} />
        </motion.div>
      </section>

      {/* ── S3 — Now boarding ────────────────────────────────────────── */}
      <section className="pb-14 lg:pb-20">
        <NowBoarding nextUp={journey.nextUp} />
      </section>

      {/* ── S4 — Gates grid ──────────────────────────────────────────── */}
      <section id="gates" className="scroll-mt-20 pb-14 lg:pb-20">
        <SectionHeader label="ALL GATES" title="The full route." />
        <GatesGrid gates={journey.gates} />
      </section>

      {/* ── S5 — Wings rack ──────────────────────────────────────────── */}
      <section className="pb-14 lg:pb-20">
        <SectionHeader label="WINGS" title="Earned on the field." />
        <Reveal>
          <WingsRack progress={progress} />
        </Reveal>
      </section>

      {/* ── S6 — Miles ledger + lab status ───────────────────────────── */}
      <section className="pb-16 lg:pb-24">
        <SectionHeader label="MILES LEDGER" title="Effort, on the record." />
        <Reveal>
          <MilesLedger journey={journey} ledger={progress.ledger} />
        </Reveal>
      </section>

      {/* ── Reset journey — deliberately unsexy ──────────────────────── */}
      <div
        className={cn('flex items-center justify-between border-t border-line pb-12 pt-6')}
      >
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-300">
          IAA PROMPT ACADEMY · INTERNAL TRAINING
        </p>
        <ResetJourney />
      </div>
    </div>
  );
}
