/**
 * Miles ledger + Prompt Lab status (dashboard.md §S6). Mono table of the last
 * 6 miles events (effort-only — the footer line says so), rows sliding in
 * with a 70ms stagger; entries new since the last visit flash amber-100 for
 * 2s. Right: lab mini-panel with count-up stats and a jet-bridge bar.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { CountUp, EASE_JET, JetBridge } from '@/components/dashboard/primitives';
import type { JourneyState } from '@/components/dashboard/journey-data';
import type { MilesEvent } from '@/lib/progress';

const SEEN_KEY = 'iaa-pa:ledger-seen';

function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}

function LedgerRow({ event, isNew, index }: { event: MilesEvent; isNew: boolean; index: number }) {
  const reduced = prefersReducedMotion();
  return (
    <motion.li
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: reduced ? 0 : index * 0.07, ease: EASE_JET }}
      className="relative flex items-baseline gap-3 border-b border-line/70 px-2 py-3 last:border-0"
    >
      {/* 2s amber flash for entries new since last visit */}
      {isNew ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-amber-100"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      ) : null}
      <span className="relative shrink-0 font-mono text-[13px] font-semibold text-amber-600">
        +{event.amount} MILES
      </span>
      <span className="relative min-w-0 flex-1 truncate font-mono text-[13px] font-medium uppercase tracking-wide text-ink-700">
        {event.label}
      </span>
      <span className="relative hidden shrink-0 font-mono text-[11px] font-medium tracking-wide text-ink-500 sm:block">
        {formatStamp(event.at)}
      </span>
    </motion.li>
  );
}

export default function MilesLedger({ journey, ledger }: { journey: JourneyState; ledger: MilesEvent[] }) {
  const events = useMemo(() => ledger.slice(0, 6), [ledger]);
  // Entries above (newer than) the last-visit marker flash once.
  const [newIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    if (typeof window !== 'undefined') {
      const seen = window.localStorage.getItem(SEEN_KEY);
      for (const e of events) {
        if (e.id === seen) break;
        ids.add(e.id);
      }
    }
    return ids;
  });
  useEffect(() => {
    if (events.length === 0 || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SEEN_KEY, events[0].id);
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events[0]?.id]);

  const labPct = journey.labCleared / journey.labTotal;

  return (
    <div className="grid gap-6 lg:grid-cols-[55fr_45fr]">
      {/* ledger */}
      <div className="rounded-[6px] border border-line bg-paper-bright p-6 shadow-card">
        <p className="label text-ink-500">MILES LEDGER</p>
        {events.length > 0 ? (
          <ul className="mt-4">
            {events.map((e, i) => (
              <LedgerRow key={e.id} event={e} isNew={newIds.has(e.id)} index={i} />
            ))}
          </ul>
        ) : (
          <p className="data mt-4 text-ink-500">No miles yet — the first leg is waiting at Gate 0.</p>
        )}
        <p className="small mt-4 border-t border-line pt-4 text-ink-500">
          Miles are earned for effort. They are never ranked, and they never expire.
        </p>
      </div>

      {/* lab mini-panel */}
      <div className="flex flex-col rounded-[6px] border border-line bg-paper-bright p-6 shadow-card">
        <p className="label text-ink-500">PROMPT LAB</p>
        <h3 className="h3 mt-3 text-ink-900">Practice Range</h3>
        <p className="mt-4 font-mono text-[13px] font-medium uppercase tracking-[0.12em] text-ink-700">
          SCENARIOS CLEARED: <CountUp value={journey.labCleared} duration={0.8} className="font-semibold text-ink-900" />
          <span className="text-ink-500">/{journey.labTotal}</span>
          <span className="mx-2 text-ink-300">·</span>
          BEST SCORE:{' '}
          {journey.labBest !== null ? (
            <CountUp value={journey.labBest} duration={0.8} className="font-semibold text-ink-900" />
          ) : (
            <span className="text-ink-500">—</span>
          )}
        </p>
        <JetBridge pct={labPct} className="mt-4" />
        <Link
          to="/lab"
          className={cn(
            'group mt-auto inline-flex items-center gap-2 pt-6 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-amber-600 transition-colors hover:text-ink-900',
          )}
        >
          Open the Lab
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
