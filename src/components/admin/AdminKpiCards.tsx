import { Info } from 'lucide-react';
import {
  computeDashboardKpis,
  formatLearningTime,
} from '@/lib/admin-metrics';
import type { RosterRow } from '@/lib/admin-roster';

const TRACKING_TOOLTIP =
  'Tracked learning time counts focused, visible Academy sessions after learning-time tracking was deployed. Earlier study time is not included.';

export default function AdminKpiCards({ rows }: { rows: RosterRow[] }) {
  const kpis = computeDashboardKpis(rows);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Total learners" value={String(kpis.totalLearners)} />
      <KpiCard label="Average progress" value={`${kpis.averageProgress}%`} />
      <KpiCard label="Total learner miles" value={String(kpis.totalLearnerMiles)} />
      <KpiCard
        label="Tracked learning time"
        value={formatLearningTime(kpis.totalLearningSeconds)}
        tooltip={TRACKING_TOOLTIP}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-[6px] border border-line bg-paper-bright p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="label text-ink-500">{label}</p>
        {tooltip ? (
          <span
            className="inline-flex text-ink-400"
            title={tooltip}
            aria-label={tooltip}
          >
            <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-sans text-[26px] font-extrabold tabular-nums leading-none text-ink-900">
        {value}
      </p>
    </div>
  );
}
