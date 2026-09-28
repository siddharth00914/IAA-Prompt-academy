import { useId, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import LearnerDetailDialog from '@/components/admin/LearnerDetailDialog';
import { GATES } from '@/components/dashboard/journey-data';
import {
  LEARNING_STATUS_LABEL,
  buildRosterCsv,
  filterAndSortRoster,
  formatLastActive,
  formatLearningTime,
  learnerInitials,
  type LearningStatus,
  type RosterSortKey,
} from '@/lib/admin-metrics';
import { rosterDisplayName, type RosterRow } from '@/lib/admin-roster';

const controlClass =
  'mt-2 w-full rounded-[2px] border border-line bg-paper px-3 py-2.5 font-sans text-[16px] text-ink-900 focus:border-amber-500 focus:outline-none focus:shadow-glow-ring';

const STATUS_OPTIONS: Array<{ value: LearningStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'not-started', label: LEARNING_STATUS_LABEL['not-started'] },
  { value: 'in-progress', label: LEARNING_STATUS_LABEL['in-progress'] },
  { value: 'certified', label: LEARNING_STATUS_LABEL.certified },
];

const SORT_OPTIONS: Array<{ value: RosterSortKey; label: string }> = [
  { value: 'name-asc', label: 'Name' },
  { value: 'progress-desc', label: 'Progress: highest first' },
  { value: 'progress-asc', label: 'Progress: lowest first' },
  { value: 'miles-desc', label: 'Miles: highest first' },
  { value: 'learning-time-desc', label: 'Learning time: highest first' },
  { value: 'last-active-desc', label: 'Last active: most recent' },
];

export default function LearnerRoster({ rows }: { rows: RosterRow[] }) {
  const searchId = useId();
  const statusId = useId();
  const gateId = useId();
  const sortId = useId();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<LearningStatus | 'all'>('all');
  const [gateFilter, setGateFilter] = useState<string | 'all'>('all');
  const [sort, setSort] = useState<RosterSortKey>('name-asc');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const selected = rows.find((row) => row.uid === selectedUid) ?? null;

  const visible = useMemo(
    () =>
      filterAndSortRoster(rows, {
        query,
        status,
        gateId: gateFilter,
        sort,
      }),
    [gateFilter, query, rows, sort, status],
  );

  function exportCsv() {
    const csvRows = visible.map((row) => ({
      name: rosterDisplayName(row),
      email: row.email?.trim() || '',
      status: LEARNING_STATUS_LABEL[row.learningStatus],
      currentGate: row.currentGateLabel,
      progressPct: row.coursePct,
      miles: row.miles,
      learningTimeSeconds: row.totalActiveSeconds ?? ('' as const),
      learningTimeFormatted: formatLearningTime(row.totalActiveSeconds),
      lastActive: formatLastActive(row.lastActiveAt),
      certificationDate: row.certifiedAt
        ? formatStamp(row.certifiedAt)
        : 'Not certified',
    }));
    const blob = new Blob([buildRosterCsv(csvRows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `iaa-learner-roster-${new Date().toISOString().slice(0, 10)}.csv`;
    // Anchor must be in the DOM for Firefox to honour the click-triggered download.
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Defer revocation so the browser has time to initiate the download.
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label text-ink-500">LEARNER ROSTER · READ ONLY</p>
          <h2 className="h4 mt-2 text-ink-900">Crew manifest</h2>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="inline-flex items-center gap-2 self-start rounded-[4px] border border-line bg-paper-bright px-4 py-2.5 font-sans text-[12px] font-bold uppercase tracking-wide text-ink-900 shadow-card transition-colors hover:border-amber-500 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          Export CSV
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor={searchId} className="label text-ink-500">
            Search
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email"
            className={controlClass}
          />
        </div>
        <div>
          <label htmlFor={statusId} className="label text-ink-500">
            Status
          </label>
          <select
            id={statusId}
            value={status}
            onChange={(event) => setStatus(event.target.value as LearningStatus | 'all')}
            className={controlClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={gateId} className="label text-ink-500">
            Current gate
          </label>
          <select
            id={gateId}
            value={gateFilter}
            onChange={(event) => setGateFilter(event.target.value)}
            className={controlClass}
          >
            <option value="all">All gates</option>
            {GATES.map((gate) => (
              <option key={gate.id} value={gate.id}>
                {gate.number} · {gate.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={sortId} className="label text-ink-500">
            Sort
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => setSort(event.target.value as RosterSortKey)}
            className={controlClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} of {rows.length} learners shown.
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-[6px] border border-line bg-paper-bright px-6 py-10 text-center shadow-card">
          <p className="label text-ink-500">NO MATCHING LEARNERS</p>
          <p className="body mt-3 text-ink-600">No learners match the current search or filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="mt-6 hidden overflow-x-auto rounded-[6px] border border-line bg-paper-bright shadow-card md:block">
            <table className="min-w-[960px] w-full border-collapse text-left">
              <caption className="sr-only">
                Academy learners, learning status, progress, miles, and activity.
              </caption>
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <Header>Learner</Header>
                  <Header>Email</Header>
                  <Header>Status</Header>
                  <Header>Current gate</Header>
                  <Header>Progress</Header>
                  <Header>Miles</Header>
                  <Header>Learning time</Header>
                  <Header>Last active</Header>
                  <Header>Details</Header>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.uid} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={learnerInitials(row.name, row.email)} />
                        <span className="font-sans text-[14px] font-bold text-ink-900">
                          {rosterDisplayName(row)}
                        </span>
                      </div>
                    </th>
                    <td className="px-3 py-3 font-mono text-[12px] text-ink-700">
                      {row.email?.trim() || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={row.learningStatus} />
                    </td>
                    <td className="px-3 py-3 font-sans text-[13px] text-ink-900">
                      {row.currentGateLabel}
                    </td>
                    <td className="px-3 py-3">
                      <ProgressCell pct={row.coursePct} />
                    </td>
                    <td className="px-3 py-3 font-mono text-[13px] font-semibold text-ink-900">
                      {row.miles}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-ink-700">
                      {formatLearningTime(row.totalActiveSeconds)}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-ink-600">
                      {formatLastActive(row.lastActiveAt)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="rounded-[2px] border border-line px-3 py-2 font-sans text-[11px] font-bold uppercase tracking-wide text-ink-700 transition-colors hover:border-amber-500 hover:text-amber-600 focus:outline-none focus:shadow-glow-ring"
                        onClick={() => setSelectedUid(row.uid)}
                      >
                        View details
                        <span className="sr-only"> for {rosterDisplayName(row)}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-6 space-y-3 md:hidden">
            {visible.map((row) => (
              <li
                key={row.uid}
                className="rounded-[6px] border border-line bg-paper-bright p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar initials={learnerInitials(row.name, row.email)} />
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[15px] font-bold text-ink-900">
                        {rosterDisplayName(row)}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-ink-600">
                        {row.email?.trim() || 'No email'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={row.learningStatus} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <MobileFact label="Gate" value={row.currentGateLabel} />
                  <MobileFact label="Progress" value={`${row.coursePct}%`} />
                  <MobileFact label="Miles" value={String(row.miles)} />
                  <MobileFact label="Time" value={formatLearningTime(row.totalActiveSeconds)} />
                  <MobileFact label="Last active" value={formatLastActive(row.lastActiveAt)} />
                </dl>
                <button
                  type="button"
                  className="mt-3 w-full rounded-[2px] border border-line px-3 py-2.5 font-sans text-[12px] font-bold uppercase tracking-wide text-ink-700"
                  onClick={() => setSelectedUid(row.uid)}
                >
                  View details
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <LearnerDetailDialog row={selected} onClose={() => setSelectedUid(null)} />
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-paper-dim font-mono text-[11px] font-bold text-ink-900"
      aria-hidden
    >
      {initials}
    </span>
  );
}

function StatusBadge({ status }: { status: LearningStatus }) {
  const styles: Record<LearningStatus, string> = {
    'not-started': 'border-ink-300 bg-paper-dim text-ink-700',
    'in-progress': 'border-amber-500/40 bg-amber-100 text-amber-600',
    certified: 'border-field-500/40 bg-field-100 text-field-600',
  };
  const symbols: Record<LearningStatus, string> = {
    'not-started': '○',
    'in-progress': '◐',
    certified: '●',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}
    >
      <span aria-hidden>{symbols[status]}</span>
      {LEARNING_STATUS_LABEL[status]}
    </span>
  );
}

function ProgressCell({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="min-w-[110px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold tabular-nums text-amber-700">
          {clamped}%
        </span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-dim"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% course progress`}
      >
        <div className="h-full rounded-full bg-amber-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function Header({ children }: { children: string }) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500"
    >
      {children}
    </th>
  );
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-sans text-[13px] font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}