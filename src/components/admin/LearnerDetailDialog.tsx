import { useEffect, useId, useRef, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import {
  LEARNING_STATUS_LABEL,
  formatLastActive,
  formatLearningTime,
} from '@/lib/admin-metrics';
import {
  fetchProgressHistoryPage,
  type ProgressHistoryRow,
} from '@/lib/admin-history';
import { rosterDisplayName, type RosterRow } from '@/lib/admin-roster';
import { getLenis } from '@/lib/smooth-scroll';

export default function LearnerDetailDialog({
  row,
  onClose,
}: {
  row: RosterRow | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const open = row !== null;

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // Lenis steals wheel events from nested overflow containers.
    const lenis = getLenis();
    lenis?.stop();

    if (!dialog.open) dialog.showModal();
    // Defer so the scroll body has layout after showModal.
    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo({ top: 0 });
      bodyRef.current?.focus({ preventScroll: true });
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      // Inline display:flex beats the UA `dialog[open] { display:block }` rule,
      // which otherwise breaks flex-1 / overflow scrolling and clips content.
      style={open ? { display: 'flex' } : undefined}
      className="fixed left-1/2 top-1/2 z-50 m-0 h-[min(90dvh,880px)] w-[min(960px,calc(100%-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[6px] border border-line bg-paper p-0 shadow-card open:flex backdrop:bg-ink-900/45"
      onClose={onClose}
    >
      {row ? (
        <>
          <div className="shrink-0 border-b border-line px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="label text-amber-600">LEARNER DETAIL · READ ONLY</p>
                <h2 id={titleId} className="h3 mt-3 text-ink-900">
                  {rosterDisplayName(row)}
                </h2>
                <p className="mt-2 font-mono text-[12px] text-ink-600">
                  {row.email?.trim() || 'No email on file'}
                </p>
                <p className="mt-2">
                  <StatusText status={row.learningStatus} />
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost self-start"
                onClick={() => dialogRef.current?.close()}
              >
                Close
              </button>
            </div>
          </div>
          <div
            ref={bodyRef}
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-8"
            tabIndex={-1}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <LearnerDetailBody row={row} />
          </div>
        </>
      ) : null}
    </dialog>
  );
}

function StatusText({ status }: { status: RosterRow['learningStatus'] }) {
  return (
    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-600">
      Status: {LEARNING_STATUS_LABEL[status]}
    </span>
  );
}

function LearnerDetailBody({ row }: { row: RosterRow }) {
  const detail = row.detail;
  const completedTitles = detail.gates.flatMap((gate) =>
    gate.completedLegTitles.map((title, index) => ({
      key: `${gate.gateId}-${index}`,
      label: `${gate.number} · ${title}`,
    })),
  );
  const completedGates = detail.gates.filter(
    (gate) => gate.legsDone >= gate.legsTotal && gate.legsTotal > 0,
  );

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Course progress" value={`${detail.coursePct}%`} />
        <Fact label="Miles earned" value={String(detail.miles)} />
        <Fact label="Current gate" value={detail.currentGate} />
        <Fact
          label="Completed legs"
          value={
            detail.completedLegs === 0
              ? 'None yet'
              : `${detail.completedLegs} of ${detail.totalLegs}`
          }
        />
        <Fact
          label="Total tracked learning time"
          value={formatLearningTime(row.totalActiveSeconds)}
        />
        <Fact label="Last active" value={formatLastActive(row.lastActiveAt)} />
        <Fact
          label="Account created"
          value={row.createdAt ? formatStamp(row.createdAt) : 'Not available'}
        />
        <Fact
          label="Certification date"
          value={row.certifiedAt ? formatStamp(row.certifiedAt) : 'Not certified'}
        />
        <Fact
          label="Completed gates"
          value={
            completedGates.length === 0
              ? 'None yet'
              : completedGates.map((g) => g.number).join(', ')
          }
        />
      </dl>

      <section aria-labelledby="completed-legs-heading">
        <h3 id="completed-legs-heading" className="label text-ink-500">
          Completed legs
        </h3>
        {completedTitles.length === 0 ? (
          <p className="body mt-3 text-ink-600">No legs completed yet.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {completedTitles.map((item) => (
              <li key={item.key} className="body text-ink-700">
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="gate-scores-heading">
        <h3 id="gate-scores-heading" className="label text-ink-500">
          Check attempts and scores
        </h3>
        <div className="mt-3 overflow-x-auto rounded-[6px] border border-line">
          <table className="min-w-full border-collapse text-left">
            <caption className="sr-only">Gate check scores and leg counts</caption>
            <thead>
              <tr className="border-b border-line bg-paper-dim">
                <Header>Gate</Header>
                <Header>Legs</Header>
                <Header>Check score</Header>
                <Header>Attempts</Header>
              </tr>
            </thead>
            <tbody>
              {detail.gates.map((gate) => (
                <tr key={gate.gateId} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-sans text-[14px] font-bold text-ink-900">
                    {gate.number} · {gate.title}
                  </th>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink-700">
                    {gate.legsDone}/{gate.legsTotal}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] font-semibold text-amber-600">
                    {gate.checkScore === null ? 'Not attempted' : `${gate.checkScore}%`}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink-700">
                    {gate.checkAttempts === 0 ? '—' : gate.checkAttempts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ledger-heading">
        <h3 id="ledger-heading" className="label text-ink-500">
          Recent mileage ledger
        </h3>
        {detail.ledger.length === 0 ? (
          <p className="body mt-3 text-ink-600">No ledger activity recorded yet.</p>
        ) : (
          <ol className="mt-3 divide-y divide-line rounded-[6px] border border-line">
            {detail.ledger.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <div>
                  <p className="font-mono text-[13px] font-semibold text-amber-600">
                    {event.amount >= 0 ? '+' : ''}
                    {event.amount} miles
                  </p>
                  <p className="mt-1 font-sans text-[14px] text-ink-900">{event.label}</p>
                </div>
                <p className="font-mono text-[11px] text-ink-400">{formatStamp(event.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ProgressHistorySection uid={row.uid} />
    </div>
  );
}

function ProgressHistorySection({ uid }: { uid: string }) {
  const [rows, setRows] = useState<ProgressHistoryRow[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const requestGen = useRef(0);

  useEffect(() => {
    const gen = ++requestGen.current;
    setRows([]);
    setCursor(null);
    setHasMore(false);
    setStatus('loading');

    void fetchProgressHistoryPage(uid)
      .then((page) => {
        if (requestGen.current !== gen) return;
        setRows(page.rows);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setStatus(page.rows.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (requestGen.current !== gen) return;
        setStatus('error');
      });
  }, [uid]);

  async function loadOlder() {
    if (!hasMore || !cursor || loadingMore) return;
    const gen = requestGen.current;
    setLoadingMore(true);
    try {
      const page = await fetchProgressHistoryPage(uid, cursor);
      if (requestGen.current !== gen) return;
      setRows((prev) => [...prev, ...page.rows]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      if (requestGen.current !== gen) return;
      setStatus('error');
    } finally {
      if (requestGen.current === gen) setLoadingMore(false);
    }
  }

  return (
    <section aria-labelledby="progress-history-heading">
      <h3 id="progress-history-heading" className="label text-ink-500">
        Progress history
      </h3>
      <p className="mt-1 font-mono text-[11px] text-ink-400">
        Read-only revisions. Loaded only when this dialog opens.
      </p>

      {status === 'loading' ? (
        <p className="body mt-4 text-ink-600">Loading history…</p>
      ) : null}

      {status === 'empty' ? (
        <p className="body mt-4 text-ink-600">No progress history revisions yet.</p>
      ) : null}

      {status === 'error' ? (
        <p role="alert" className="body mt-4 text-signal-600">
          Progress history could not be loaded.
        </p>
      ) : null}

      {status === 'ready' || (rows.length > 0 && status !== 'error') ? (
        <>
          <div className="mt-3 overflow-x-auto rounded-[6px] border border-line">
            <table className="min-w-full border-collapse text-left">
              <caption className="sr-only">Progress history revisions</caption>
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <Header>Revision</Header>
                  <Header>Changed</Header>
                  <Header>Source</Header>
                  <Header>Baseline</Header>
                  <Header>Progress</Header>
                  <Header>Miles</Header>
                  <Header>Certified</Header>
                </tr>
              </thead>
              <tbody>
                {rows.map((rev) => (
                  <tr key={rev.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-ink-900">
                      #{rev.revision}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-700">
                      {rev.changedAt ? formatStamp(rev.changedAt) : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] uppercase text-ink-700">
                      {rev.source}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-700">
                      {rev.isBaseline ? 'Yes' : 'No'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-amber-700">
                      {rev.coursePct}%
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-ink-900">{rev.miles}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-700">
                      {rev.certified ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore ? (
            <button
              type="button"
              className="btn-ghost mt-4"
              onClick={() => void loadOlder()}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load older'}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] border border-line bg-paper-bright p-4">
      <dt className="label text-ink-500">{label}</dt>
      <dd className="mt-2 font-sans text-[16px] font-bold text-ink-900">{value}</dd>
    </div>
  );
}

function Header({ children }: { children: string }) {
  return (
    <th
      scope="col"
      className="px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500"
    >
      {children}
    </th>
  );
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}
