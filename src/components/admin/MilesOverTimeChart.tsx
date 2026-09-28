import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { aggregateMilesByWeek } from '@/lib/admin-metrics';
import type { RosterRow } from '@/lib/admin-roster';

export default function MilesOverTimeChart({ rows }: { rows: RosterRow[] }) {
  const buckets = aggregateMilesByWeek(
    rows.map((row) => ({ uid: row.uid, events: row.ledger })),
  );
  const hasMiles = buckets.some((bucket) => bucket.miles > 0);

  return (
    <section
      className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card"
      aria-labelledby="miles-over-time-heading"
    >
      <h2 id="miles-over-time-heading" className="h4 text-ink-900">
        Miles earned over time
      </h2>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
        Based on retained learner activity records.
      </p>

      {!hasMiles ? (
        <p className="body mt-8 text-ink-600">
          No mileage ledger events in the last six weeks yet.
        </p>
      ) : (
        <div className="mt-4 h-[220px] w-full" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E8E0D4" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={{ stroke: '#E8E0D4' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                formatter={(value: number) => [`${value} miles`, 'Miles']}
                labelFormatter={(label) => `Week of ${label}`}
                contentStyle={{
                  borderRadius: 4,
                  borderColor: '#E8E0D4',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="miles" fill="#D97706" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ul className="sr-only">
        {buckets.map((bucket) => (
          <li key={bucket.weekStartIso}>
            Week of {bucket.label}: {bucket.miles} miles
          </li>
        ))}
      </ul>
    </section>
  );
}
