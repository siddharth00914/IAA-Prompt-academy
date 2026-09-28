import { GraduationCap, ShieldCheck } from 'lucide-react';
import AdminKpiCards from '@/components/admin/AdminKpiCards';
import LearnerRoster from '@/components/admin/LearnerRoster';
import LearnerStatusChart from '@/components/admin/LearnerStatusChart';
import MilesOverTimeChart from '@/components/admin/MilesOverTimeChart';
import RecentActivityFeed from '@/components/admin/RecentActivityFeed';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { IT_ADMIN_LABEL } from '@/lib/admin';
import { useAcademyRoster } from '@/lib/admin-roster';
import { useAdminViewSwitcher } from '@/lib/admin-view';

export default function AdminDashboard() {
  const { status, rows, retry } = useAcademyRoster();
  const { goLearnerAcademy } = useAdminViewSwitcher();

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
        <header className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label text-amber-600">{IT_ADMIN_LABEL} · IND</p>
            <h1 className="mt-2 font-sans text-[28px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[34px]">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl font-sans text-[15px] leading-relaxed text-ink-700">
              Live learner roster, progress, and mileage from Firestore.
            </p>
          </div>

          <div className="flex flex-col gap-2 self-start sm:flex-row sm:items-center md:self-auto">
            <button
              type="button"
              onClick={goLearnerAcademy}
              className="inline-flex items-center gap-2 rounded-[4px] border border-line bg-paper-bright px-4 py-2.5 font-sans text-[12px] font-bold uppercase tracking-wide text-ink-900 shadow-card transition-colors hover:border-amber-500 hover:text-amber-600 focus:outline-none focus:shadow-glow-ring"
            >
              <GraduationCap className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
              View Academy
            </button>
            <div className="inline-flex items-center gap-3 rounded-[4px] border border-line bg-paper-bright px-4 py-2.5 shadow-card">
              <ShieldCheck className="h-5 w-5 text-amber-600" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Admin clearance active
                </p>
                <p className="mt-0.5 font-sans text-[13px] font-bold text-ink-900">Admin Dashboard</p>
              </div>
            </div>
          </div>
        </header>

        {status === 'loading' ? (
          <div className="mt-8 flex min-h-[280px] items-center justify-center rounded-[6px] border border-line bg-paper-bright">
            <TaxiwayLoader label="LOADING MANIFEST" />
          </div>
        ) : null}

        {status === 'permission-denied' ? (
          <div
            role="alert"
            className="mt-8 rounded-[6px] border border-signal-500/40 bg-signal-500/10 px-6 py-10 text-center"
          >
            <p className="label text-signal-600">CLEARANCE DENIED</p>
            <p className="body mt-3 text-ink-700">
              Firestore refused this roster read. Confirm the signed-in profile is an active admin.
            </p>
            <button type="button" className="btn-primary mt-6" onClick={retry}>
              Retry
            </button>
          </div>
        ) : null}

        {status === 'error' ? (
          <div
            role="alert"
            className="mt-8 rounded-[6px] border border-signal-500/40 bg-signal-500/10 px-6 py-10 text-center"
          >
            <p className="label text-signal-600">MANIFEST UNAVAILABLE</p>
            <p className="body mt-3 text-ink-700">
              The roster could not be loaded. Try again in a moment.
            </p>
            <button type="button" className="btn-primary mt-6" onClick={retry}>
              Retry
            </button>
          </div>
        ) : null}

        {status === 'empty' ? (
          <div className="mt-8 space-y-6">
            <AdminKpiCards rows={[]} />
            <div className="rounded-[6px] border border-line bg-paper-bright px-6 py-12 text-center shadow-card">
              <p className="label text-ink-500">NO LEARNERS ON THE MANIFEST</p>
              <p className="body mt-3 text-ink-600">
                No learner profiles are stored in Firestore yet. IT Admin accounts are excluded.
              </p>
            </div>
          </div>
        ) : null}

        {status === 'ready' ? (
          <div className="mt-6 space-y-6">
            <AdminKpiCards rows={rows} />

            <div className="grid gap-4 lg:grid-cols-2">
              <LearnerStatusChart rows={rows} />
              <MilesOverTimeChart rows={rows} />
            </div>

            <RecentActivityFeed rows={rows} />

            <LearnerRoster rows={rows} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
