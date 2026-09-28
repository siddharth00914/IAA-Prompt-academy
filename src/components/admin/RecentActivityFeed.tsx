import { collectRecentActivity } from '@/lib/admin-metrics';
import type { RosterRow } from '@/lib/admin-roster';

export default function RecentActivityFeed({ rows }: { rows: RosterRow[] }) {
  const items = collectRecentActivity(
    rows.map((row) => ({
      uid: row.uid,
      name: row.name,
      email: row.email,
      ledger: row.ledger,
    })),
    5,
  );

  return (
    <section
      className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card"
      aria-labelledby="recent-activity-heading"
    >
      <h2 id="recent-activity-heading" className="h4 text-ink-900">
        Recent mileage activity
      </h2>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
        Milestone events from learner ledgers — not login history.
      </p>

      {items.length === 0 ? (
        <p className="body mt-6 text-ink-600">No recent mileage events yet.</p>
      ) : (
        <ol className="mt-4 divide-y divide-line">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-sans text-[14px] font-bold text-ink-900">
                  {item.learnerName}
                </p>
                <p className="mt-0.5 font-sans text-[13px] text-ink-700">{item.label}</p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="font-mono text-[13px] font-semibold text-amber-700">
                  {item.amount >= 0 ? '+' : ''}
                  {item.amount} mi
                </p>
                <p className="font-mono text-[11px] text-ink-400">{formatStamp(item.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}