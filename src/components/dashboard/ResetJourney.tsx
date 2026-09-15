/**
 * Reset journey (dashboard.md — Interactions & Behavior Notes): deliberately
 * unsexy small mono text at the very bottom of the page. Opens a confirm
 * dialog with a typed `RESET` confirmation and a signal-500 confirm button.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OctagonAlert } from 'lucide-react';
import { resetProgress } from '@/lib/progress';
import { useToast } from '@/components/Toast';
import { EASE_JET } from '@/components/dashboard/primitives';

const DASH_KEYS = ['iaa-pa:map-pos', 'iaa-pa:ledger-seen', 'iaa-pa:wings-seen', 'iaa-pa:miles-prev'];

export default function ResetJourney() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const confirm = () => {
    if (typed !== 'RESET') return;
    resetProgress();
    DASH_KEYS.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {
        /* storage unavailable */
      }
    });
    try {
      window.sessionStorage.removeItem('iaa-pa:map-drawn');
    } catch {
      /* storage unavailable */
    }
    setOpen(false);
    setTyped('');
    showToast('RAMP:', 'Journey reset — see you at Gate 0.');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 underline decoration-ink-500/50 underline-offset-4 transition-colors hover:text-signal-600 hover:decoration-signal-500"
      >
        Reset journey
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-tarmac-950/70 p-6"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Reset journey confirmation"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: EASE_JET }}
              className="w-full max-w-sm rounded-[6px] border border-line bg-paper-bright p-6 shadow-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <OctagonAlert className="h-4 w-4 text-signal-600" strokeWidth={1.5} aria-hidden />
                <p className="label text-signal-600">HOLD SHORT</p>
              </div>
              <h3 className="h4 mt-3 text-ink-900">Reset the entire journey?</h3>
              <p className="small mt-2 text-ink-700">
                This wipes every leg, check score, wing, mile, and lab attempt on this device. There
                is no undo — the flight plan goes back to Gate 0.
              </p>
              <label className="mt-4 block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  TYPE RESET TO CONFIRM
                </span>
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase())}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="RESET"
                  className="mt-2 w-full rounded-[2px] border border-line bg-paper px-3 py-2 font-mono text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-900 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none"
                />
              </label>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[2px] px-4 py-2 font-sans text-[14px] font-bold text-ink-700 transition-colors hover:text-ink-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={typed !== 'RESET'}
                  className="rounded-[2px] bg-signal-500 px-4 py-2 font-sans text-[14px] font-bold text-paper-bright transition-all enabled:hover:bg-signal-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reset everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
