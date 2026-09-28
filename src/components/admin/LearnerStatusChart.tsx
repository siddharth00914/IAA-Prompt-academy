import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  computeStatusBreakdown,
  LEARNING_STATUS_LABEL,
  type LearningStatus,
} from '@/lib/admin-metrics';
import type { RosterRow } from '@/lib/admin-roster';

const STATUS_COLOR: Record<LearningStatus, string> = {
  'not-started': '#A9A294',
  'in-progress': '#E09112',
  certified: '#3F7D5C',
};

export default function LearnerStatusChart({ rows }: { rows: RosterRow[] }) {
  const breakdown = computeStatusBreakdown(rows);
  const chartData = breakdown.map((item) => ({
    ...item,
    name: item.label,
    value: item.count,
  }));
  const total = rows.length;
  const summary = breakdown
    .map((item) => `${item.label}: ${item.count} (${item.pct}%)`)
    .join('. ');

  return (
    <section
      className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card"
      aria-labelledby="learner-status-heading"
    >
      <h2 id="learner-status-heading" className="h4 text-ink-900">
        Learner status
      </h2>
      <p className="sr-only">{summary || 'No learners yet.'}</p>

      {total === 0 ? (
        <p className="body mt-6 text-ink-600">No learners to chart yet.</p>
      ) : (
        <div className="mt-4 grid items-center gap-4 md:grid-cols-[180px_1fr]">
          <div className="mx-auto h-[160px] w-[160px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="#F7F4EE"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR[entry.status]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} learners`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2.5">
            {breakdown.map((item) => (
              <li key={item.status} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-sans text-[14px] text-ink-900">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[item.status] }}
                    aria-hidden
                  />
                  <span className="font-semibold">{LEARNING_STATUS_LABEL[item.status]}</span>
                </span>
                <span className="font-mono text-[13px] font-semibold tabular-nums text-ink-700">
                  {item.count} · {item.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
