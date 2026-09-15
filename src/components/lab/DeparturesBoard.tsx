import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import type { LabFunction, Scenario } from '@/content/types';
import { scenarioCode } from '@/content/scenarios';
import { isGateUnlocked, useProgress } from '@/lib/progress';
import SplitFlap from '@/components/SplitFlap';
import { cn } from '@/lib/utils';

const FUNCTION_FILTERS: { label: string; value: LabFunction | 'All' }[] = [
  { label: 'ALL FUNCTIONS', value: 'All' },
  { label: 'OPS', value: 'Operations' },
  { label: 'PUBLIC AFFAIRS', value: 'Public Affairs' },
  { label: 'PUBLIC SAFETY', value: 'Public Safety' },
  { label: 'MAINTENANCE', value: 'Maintenance' },
  { label: 'HR', value: 'Human Resources' },
  { label: 'FINANCE', value: 'Finance' },
  { label: 'PROPERTIES', value: 'Properties' },
  { label: 'TERMINAL SERVICES', value: 'Terminal Services' },
];

const GATE_FILTERS = ['All', 'g1', 'g2', 'g3', 'g4', 'g5'] as const;

interface DeparturesBoardProps {
  scenarios: Scenario[];
  onSelect: (id: string) => void;
}

function statusFor(
  scenario: Scenario,
  record: { attempts: number; bestScore: number } | undefined,
  capstoneOpen: boolean,
): { text: string; className: string; locked: boolean } {
  if (scenario.capstone && !capstoneOpen) {
    return { text: 'CAPSTONE — LOCKED', className: 'text-glow-red', locked: true };
  }
  if (record && record.attempts > 0 && record.bestScore > 0) {
    return { text: `CLEARED ${record.bestScore}%`, className: 'text-glow-green', locked: false };
  }
  return { text: 'OPEN', className: 'text-glow-amber', locked: false };
}

/**
 * The scenario departures board (promptlab.md §S1): ink-900 panel, mono rows,
 * filter chips above. Rows cascade with split-flap settle (50ms row stagger)
 * and re-flap on every filter change. Row hover = amber sweep.
 */
export default function DeparturesBoard({ scenarios, onSelect }: DeparturesBoardProps) {
  const progress = useProgress();
  const [fnFilter, setFnFilter] = useState<LabFunction | 'All'>('All');
  const [gateFilter, setGateFilter] = useState<(typeof GATE_FILTERS)[number]>('All');
  const [capstoneOnly, setCapstoneOnly] = useState(false);

  const capstoneOpen = isGateUnlocked('g5');

  const filtered = useMemo(
    () =>
      scenarios.filter(
        (s) =>
          (fnFilter === 'All' || s.fn === fnFilter) &&
          (gateFilter === 'All' || s.gateId === gateFilter) &&
          (!capstoneOnly || s.capstone),
      ),
    [scenarios, fnFilter, gateFilter, capstoneOnly],
  );

  // Re-flap trigger: remount rows whenever the filter signature changes.
  const flapKey = `${fnFilter}|${gateFilter}|${capstoneOnly}|${filtered.map((s) => s.id).join(',')}`;

  const chip = (active: boolean) =>
    cn(
      'rounded-[2px] border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
      active
        ? 'border-amber-500 bg-amber-500 text-ink-900'
        : 'border-line bg-paper-bright text-ink-500 hover:border-amber-500 hover:text-ink-900',
    );

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FUNCTION_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={chip(fnFilter === f.value)}
            onClick={() => setFnFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-line sm:inline-block" aria-hidden />
        {GATE_FILTERS.map((g) => (
          <button key={g} type="button" className={chip(gateFilter === g)} onClick={() => setGateFilter(g)}>
            {g === 'All' ? 'ALL GATES' : g.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          className={chip(capstoneOnly)}
          onClick={() => setCapstoneOnly((v) => !v)}
          aria-pressed={capstoneOnly}
        >
          CAPSTONE ONLY
        </button>
      </div>

      {/* The board */}
      <div className="overflow-hidden rounded-[10px] border-2 border-ink-900 bg-ink-900 shadow-card">
        <div className="flex items-center justify-between border-b border-fog-100/10 px-5 py-3">
          <p className="label text-fog-300">DEPARTURES · PRACTICE SCENARIOS</p>
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-fog-500">
            {filtered.length} OF {scenarios.length} FLIGHTS
          </p>
        </div>

        {/* Column headers */}
        <div className="hidden grid-cols-[92px_1fr_170px_56px_170px_64px] gap-3 border-b border-fog-100/10 px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-fog-500 md:grid">
          <span>SCN</span>
          <span>SCENARIO</span>
          <span>FUNCTION</span>
          <span>GATE</span>
          <span>STATUS</span>
          <span className="text-right">BEST</span>
        </div>

        <ul key={flapKey}>
          {filtered.map((s, i) => {
            const record = progress.lab[s.id];
            const status = statusFor(s, record, capstoneOpen);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={status.locked}
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    'group relative block w-full overflow-hidden border-b border-fog-100/5 px-5 py-3 text-left last:border-b-0',
                    status.locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  )}
                >
                  {/* amber row sweep on hover */}
                  {!status.locked ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 origin-left scale-x-0 bg-amber-500/15 transition-transform duration-200 ease-out group-hover:scale-x-100"
                    />
                  ) : null}
                  <span className="relative grid grid-cols-1 gap-1 md:grid-cols-[92px_1fr_170px_56px_170px_64px] md:items-center md:gap-3">
                    <span className="font-mono text-[13px] font-semibold tracking-[0.08em] text-glow-amber">
                      <SplitFlap text={scenarioCode(s.id)} startDelay={i * 50} stagger={30} />
                    </span>
                    <span className="font-mono text-[14px] font-medium text-fog-100">
                      <SplitFlap text={s.title.toUpperCase()} startDelay={i * 50 + 120} stagger={18} />
                      {s.capstone ? (
                        <span className="ml-2 whitespace-nowrap rounded-[999px] border border-slate-500 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500">
                          CHAIN {s.chainStep}/3
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-fog-300">
                      {s.fn}
                    </span>
                    <span className="font-mono text-[12px] uppercase text-fog-300">
                      {s.gateId.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors',
                        status.className,
                      )}
                    >
                      {status.locked ? <Lock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> : null}
                      {status.text}
                    </span>
                    <span className="font-mono text-[13px] font-medium text-fog-100 md:text-right">
                      {record && record.bestScore > 0 ? record.bestScore : '—'}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-5 py-8 text-center font-mono text-[13px] uppercase tracking-[0.12em] text-fog-500">
              NO FLIGHTS ON THIS BOARD — LOOSEN THE FILTERS
            </li>
          ) : null}
        </ul>

        <div className="border-t border-fog-100/10 px-5 py-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-fog-500">
            ALL DEPARTURES ON TIME · FEEDBACK IN &lt;1s · NOTHING LEAVES YOUR BROWSER
          </p>
        </div>
      </div>
    </div>
  );
}
