import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { DebriefReport } from '@/content/types';
import { cn } from '@/lib/utils';

/** One recorded lab submission, kept per scenario in localStorage. */
export interface LabAttemptEntry {
  attempt: number;
  score: number;
  safetyHold: boolean;
  prompt: string;
  report: DebriefReport;
  at: string; // ISO timestamp
}

interface AttemptLogProps {
  entries: LabAttemptEntry[];
}

/**
 * Attempt history (promptlab.md interactions): collapsible mono log under the
 * debrief — `ATTEMPT 1 — 62 · ATTEMPT 2 — 84` — each expandable to the
 * submitted prompt plus its verdict and top suggestion.
 */
export default function AttemptLog({ entries }: AttemptLogProps) {
  const [openAttempt, setOpenAttempt] = useState<number | null>(null);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-[6px] border border-line bg-paper-bright">
      <p className="border-b border-line px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        ATTEMPT LOG · THIS SCENARIO
      </p>
      <ul>
        {entries.map((e) => {
          const open = openAttempt === e.attempt;
          return (
            <li key={e.attempt} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenAttempt(open ? null : e.attempt)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-paper"
                aria-expanded={open}
              >
                <span className="font-mono text-[13px] font-semibold tracking-[0.06em] text-ink-900">
                  ATTEMPT {e.attempt}
                </span>
                <span className="font-mono text-[13px] text-ink-300">—</span>
                <span
                  className={cn(
                    'font-mono text-[13px] font-medium',
                    e.safetyHold
                      ? 'text-signal-600'
                      : e.score >= 80
                        ? 'text-field-600'
                        : e.score >= 60
                          ? 'text-amber-600'
                          : 'text-signal-600',
                  )}
                >
                  {e.safetyHold ? 'HOLD SHORT' : e.score}
                </span>
                <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.1em] text-ink-300">
                  {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 text-ink-500 transition-transform duration-200', open && 'rotate-180')}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line bg-paper px-4 py-3">
                      <pre className="prompt-text max-h-48 overflow-y-auto whitespace-pre-wrap rounded-[4px] border border-line bg-paper-dim p-3 text-ink-700">
                        {e.prompt}
                      </pre>
                      <p className="mt-2 font-mono text-[12px] text-ink-500">
                        {e.safetyHold
                          ? 'Score withheld — safety hold.'
                          : `Verdict: ${e.report.verdict} · ${e.report.total}/100`}
                        {!e.safetyHold && e.report.nextAltitude[0]
                          ? ` · Top fix: ${e.report.nextAltitude[0]}`
                          : ''}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
