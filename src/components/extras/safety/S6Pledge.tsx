import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PenLine, ShieldCheck } from 'lucide-react';
import StampOverlay from '@/components/StampOverlay';
import WingBadge from '@/components/WingBadge';
import { useToast } from '@/components/Toast';
import { signPledge, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PLEDGES = [
  'I will verify every AI output before I use it.',
  'I will never paste SSI, PII, or badge/law-enforcement data into an AI tool.',
  'I will treat every prompt as a potential public record.',
  'I will keep a human — me — in charge of anything safety-critical.',
];

/** Freehand signature squiggle that "writes itself" via pathLength. */
const SIGNATURE_PATH =
  'M8 34 C 18 8, 30 8, 34 26 C 37 40, 46 40, 52 24 C 57 11, 66 14, 66 28 C 66 38, 76 38, 84 26 C 90 17, 98 20, 100 30 C 104 44, 118 40, 128 24 C 134 14, 142 18, 144 30 C 146 40, 158 38, 168 26';

/**
 * S6 — The IAA Prompt Pledge (safety.md §S6). Four checkboxes gate the
 * signature; signing calls signPledge() (+50 miles, Safety Sentinel wing),
 * slams the stamp, and docks the wing beside the signature line.
 */
export default function S6Pledge() {
  const reduced = prefersReducedMotion();
  const progress = useProgress();
  const { showToast } = useToast();
  const [checked, setChecked] = useState<boolean[]>(PLEDGES.map(() => false));
  const [justSigned, setJustSigned] = useState(false);

  const allChecked = checked.every(Boolean);
  const signed = progress.pledgeSigned;

  const toggle = (i: number) => {
    if (signed) return;
    setChecked((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  };

  const sign = () => {
    if (!allChecked || signed) return;
    signPledge();
    setJustSigned(true);
    showToast('TOWER:', 'Safety Sentinel wing awarded. +50 miles.');
  };

  return (
    <section className="relative bg-tarmac-950">
      <div className="grain-night" aria-hidden />
      <div className="relative mx-auto max-w-[720px] px-6 py-24">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
          className="relative overflow-hidden rounded-[10px] border border-glow-amber/50 bg-tarmac-800 p-6 sm:p-10"
        >
          {/* winged-seal watermark */}
          <img
            src="/seal-wings.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 w-64 opacity-[0.08]"
          />

          <p className="label text-glow-amber">THE IAA PROMPT PLEDGE</p>
          <h2 className="h2 mt-4 text-fog-100">Four lines. Sign before Gate 5.</h2>

          {/* pledge checkboxes */}
          <div className="mt-8 space-y-4">
            {PLEDGES.map((text, i) => {
              const on = signed || checked[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  disabled={signed}
                  aria-pressed={on}
                  className="flex w-full items-start gap-3 text-left disabled:cursor-default"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border-2 transition-colors',
                      on ? 'border-glow-amber bg-glow-amber/15' : 'border-fog-500 hover:border-fog-300',
                    )}
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                      <motion.path
                        d="M3 8.5 L6.5 12 L13 4"
                        fill="none"
                        stroke="#F2A93B"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={false}
                        animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                        transition={{ duration: reduced ? 0 : 0.25, ease: 'easeOut' }}
                      />
                    </svg>
                  </span>
                  <span className={cn('body-strong', on ? 'text-fog-100' : 'text-fog-300')}>
                    {text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* signature zone */}
          <div className="mt-10 border-t border-dashed border-tarmac-700 pt-6">
            <AnimatePresence mode="wait" initial={false}>
              {signed ? (
                <motion.div
                  key="signed"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-wrap items-end justify-between gap-6"
                >
                  <div>
                    <p className="label text-[10px] text-fog-500">SIGNED</p>
                    <svg viewBox="0 0 176 44" className="mt-2 h-11 w-44" aria-hidden>
                      <motion.path
                        d={SIGNATURE_PATH}
                        fill="none"
                        stroke="#F1EDE2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={false}
                        animate={{ pathLength: 1 }}
                        transition={
                          reduced || !justSigned
                            ? { duration: 0 }
                            : { duration: 0.9, ease: [0.65, 0, 0.35, 1] }
                        }
                      />
                    </svg>
                    <p className="mt-1 font-editorial italic text-fog-300">
                      Keeper of the never-transmit list
                    </p>
                  </div>

                  {/* wing docks beside the signature */}
                  <motion.div
                    initial={
                      reduced || !justSigned ? false : { x: 120, rotate: 12, opacity: 0 }
                    }
                    animate={{ x: 0, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.7 }}
                    className="flex flex-col items-center"
                  >
                    <WingBadge
                      name="Safety Sentinel"
                      earned
                      howEarned="Signed the IAA Prompt Pledge."
                      glyph={<ShieldCheck size={24} strokeWidth={1.5} />}
                      size={96}
                    />
                    <p className="label mt-1 text-[10px] text-glow-amber">SAFETY SENTINEL</p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="unsigned" exit={{ opacity: 0 }} className="flex flex-wrap items-center justify-between gap-4">
                  <p className="small max-w-[38ch] text-fog-500">
                    {allChecked
                      ? 'All four lines checked. The tower is listening — make it official.'
                      : 'Check all four lines to enable the signature.'}
                  </p>
                  <button
                    type="button"
                    onClick={sign}
                    disabled={!allChecked}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-[2px] px-6 py-3 font-sans text-[17px] font-bold transition-all duration-200',
                      allChecked
                        ? 'bg-glow-amber text-tarmac-950 hover:-translate-y-0.5 hover:bg-amber-400'
                        : 'cursor-not-allowed bg-tarmac-700 text-fog-500',
                    )}
                  >
                    <PenLine className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Sign the pledge →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* stamp slam on sign (kept on screen after signing) */}
          <StampOverlay variant="SAFETY SENTINEL" show={justSigned} />
          {signed && !justSigned ? (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <div className="rounded-[4px] border-[3px] border-glow-amber/70 p-1.5 opacity-60 [transform:rotate(-8deg)]">
                <span className="block rounded-[2px] border-2 border-glow-amber/70 px-5 py-2 font-mono text-xl font-semibold uppercase tracking-[0.14em] text-glow-amber/80">
                  SAFETY SENTINEL
                </span>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
