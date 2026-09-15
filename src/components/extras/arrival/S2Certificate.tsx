import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Copy, PenLine, Printer } from 'lucide-react';
import StampOverlay from '@/components/StampOverlay';
import SplitFlap from '@/components/SplitFlap';
import { useToast } from '@/components/Toast';
import { getCertId, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { getStaffName, setStaffName } from '@/components/extras/arrival/cert-name';
import { cn } from '@/lib/utils';

const EASE_OVERSHOOT = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

const BARCODE = [3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1, 2, 2, 1];

/**
 * Print stylesheet (certificate.md §interactions — "a first-class citizen"):
 * the certificate prints alone, full-bleed landscape, backgrounds enabled.
 */
const PRINT_CSS = `
@page { size: landscape; margin: 8mm; }
@media print {
  header, footer, .grain-overlay, .arrival-hide-print { display: none !important; }
  [class*="z-[110]"] { display: none !important; }
  html, body { background: #ffffff !important; }
  main { padding-top: 0 !important; }
  #arrival-certificate-section { padding: 0 !important; }
  #arrival-certificate {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    box-shadow: none !important;
  }
}
`;

/** S2 — The Certificate (certificate.md §S2): aviator certificate × boarding pass. */
export default function S2Certificate() {
  const reduced = prefersReducedMotion();
  useProgress(); // re-render when certifiedAt lands
  const { showToast } = useToast();
  const certId = getCertId() ?? 'IAA-PP-————-————';

  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, amount: 0.35 });
  // reduced motion: stamp pre-applied, flap skipped (certificate.md §interactions)
  const [stamped, setStamped] = useState(reduced);
  const [name, setName] = useState(() => getStaffName());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [flapDone, setFlapDone] = useState(reduced);
  const [copied, setCopied] = useState(false);

  // stamp slams 900ms after the card enters
  useEffect(() => {
    if (!inView || reduced) return;
    const t1 = window.setTimeout(() => setStamped(true), 900);
    const t2 = window.setTimeout(() => setFlapDone(true), 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [inView, reduced]);

  const displayName = name.trim() || 'Your Name Here';
  const isPlaceholder = name.trim().length === 0;

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    const next = draft.trim();
    setName(next);
    setStaffName(next);
    if (next) showToast('RAMP:', 'Name logged on the manifest.');
  };

  const copyVerification = async () => {
    const line = `Certified Prompt Professional — IAA Prompt Academy · ${certId} · winthrop-tech.com`;
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
      showToast('RAMP:', 'Verification line copied.');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast('RAMP:', 'Copy blocked — select the line manually.');
    }
  };

  return (
    <section id="arrival-certificate-section" className="relative bg-paper pb-24">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto max-w-[880px] px-6">
        <motion.div
          ref={cardRef}
          initial={reduced ? false : { y: -60, rotate: -1.5, opacity: 0 }}
          whileInView={{ y: 0, rotate: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: EASE_OVERSHOOT }}
          className="relative"
        >
          <div
            id="arrival-certificate"
            className="relative overflow-hidden border-2 border-ink-900 bg-paper-bright shadow-modal"
          >
            {/* grain */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
              style={{ backgroundImage: "url('/texture-grain.webp')", backgroundSize: '600px 600px' }}
            />
            {/* inner frame with 8px gap + corner registration marks */}
            <span aria-hidden className="pointer-events-none absolute inset-2 border border-ink-900" />
            {[
              'left-1 top-1',
              'right-1 top-1',
              'bottom-1 left-1',
              'bottom-1 right-1',
            ].map((pos) => (
              <span key={pos} aria-hidden className={cn('absolute font-mono text-[10px] leading-none text-ink-500', pos)}>
                +
              </span>
            ))}

            <div className="relative px-6 pb-6 pt-8 text-center sm:px-12">
              {/* winged seal, centered top */}
              <motion.div
                initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : undefined}
                transition={{ duration: 0.6, ease: EASE_OVERSHOOT, delay: 0.2 }}
                className="mx-auto w-24 sm:w-28"
              >
                <img src="/seal-wings.svg" alt="IAA Prompt Academy winged seal" className="w-full" />
              </motion.div>
              <p className="label mt-1 text-[10px] text-ink-500">CLEARED TO PROMPT</p>

              <p className="data mt-6 text-[12px] uppercase tracking-[0.18em] text-ink-700">
                INDIANAPOLIS AIRPORT AUTHORITY × WINTHROP-TECH
              </p>
              <p className="label mt-6 text-amber-600">THIS CERTIFIES THAT</p>

              {/* name — split-flap reveal, then Fraunces; click to personalize */}
              <div className="mt-3 min-h-[64px]">
                {editing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditing(false);
                    }}
                    placeholder="Type your name"
                    aria-label="Certificate name"
                    className="w-full border-b-2 border-amber-500 bg-transparent text-center font-editorial text-[36px] italic text-ink-900 shadow-glow-ring focus:outline-none sm:text-[44px]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startEdit}
                    title="Click to personalize"
                    className="group inline-flex items-baseline gap-2"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {!flapDone && !isPlaceholder ? (
                        <motion.span key="flap" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                          <SplitFlap
                            text={displayName.toUpperCase().slice(0, 26)}
                            className="font-mono text-[26px] font-semibold tracking-[0.08em] text-ink-900 sm:text-[34px]"
                            stagger={40}
                          />
                        </motion.span>
                      ) : (
                        <motion.span
                          key={`script-${displayName}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: reduced ? 0 : 0.5 }}
                          className={cn(
                            'font-editorial text-[36px] font-medium italic leading-tight sm:text-[44px]',
                            isPlaceholder ? 'text-ink-300' : 'text-ink-900',
                          )}
                        >
                          {displayName}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <PenLine
                      className="h-4 w-4 self-center text-ink-300 transition-colors group-hover:text-amber-600"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </button>
                )}
              </div>

              <p className="body mx-auto mt-4 max-w-[60ch] text-ink-700">
                has completed the full IAA Prompt Academy flight plan — all six gates, all
                gate checks, and the capstone chain — and is hereby designated a
              </p>
              <p className="mt-3 font-sans text-[24px] font-extrabold uppercase tracking-[0.02em] text-ink-900 sm:text-[28px]">
                Certified Prompt Professional
              </p>
              <p className="data mt-4 text-[11px] uppercase tracking-[0.14em] text-ink-500 sm:text-[12px]">
                GATES 6/6 · CHECKS ≥80% · CAPSTONE COMPLETE · {certId}
              </p>

              {/* signatures */}
              <div className="mx-auto mt-10 grid max-w-[560px] grid-cols-2 gap-8">
                <div>
                  <p className="font-editorial text-[19px] italic text-ink-700">The Program Director</p>
                  <p className="mt-1 border-t border-ink-900 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Program Director · IAA Prompt Academy
                  </p>
                </div>
                <div>
                  <p className="font-editorial text-[19px] italic text-ink-700">Winthrop-Tech</p>
                  <p className="mt-1 border-t border-ink-900 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Winthrop-Tech · winthrop-tech.com
                  </p>
                </div>
              </div>

              {/* boarding-pass stub strip */}
              <div className="relative mt-10 border-t-2 border-dashed border-ink-300 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <svg viewBox="0 0 96 40" className="h-9 w-24" aria-hidden>
                      {BARCODE.map((w, i) => (
                        <motion.rect
                          key={i}
                          x={BARCODE.slice(0, i).reduce((a, b) => a + b, 0) + i}
                          y={0}
                          width={w}
                          height={40}
                          fill="#211E17"
                          initial={reduced ? false : { scaleY: 0 }}
                          animate={inView ? { scaleY: 1 } : undefined}
                          transition={{ delay: 0.6 + i * 0.02, duration: 0.25, ease: 'easeOut' }}
                          style={{ originY: 1 }}
                        />
                      ))}
                    </svg>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700">
                      {certId}
                    </p>
                  </div>
                  <div className="flex items-end gap-6">
                    <div className="text-right">
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                        SEAT
                      </p>
                      <p className="font-sans text-2xl font-black leading-none text-ink-900">1A</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                        GROUP
                      </p>
                      <p className="font-mono text-[11px] font-semibold uppercase leading-6 text-amber-600">
                        GRAD
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CERTIFIED stamp, slammed diagonally 900ms after enter */}
            <StampOverlay variant="CERTIFIED" show={stamped} />
          </div>
        </motion.div>

        {/* actions row */}
        <div className="arrival-hide-print mt-8 flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={() => window.print()} className="btn-primary">
            <Printer className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Download / Print
          </button>
          <button
            type="button"
            onClick={copyVerification}
            className={cn('btn-ghost', copied && 'border-field-600 text-field-600')}
          >
            {copied ? 'Copied ✓' : (
              <>
                <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Copy verification line
              </>
            )}
          </button>
          <Link to="/journey" className="btn-ghost">
            Replay the journey
          </Link>
        </div>
      </div>
    </section>
  );
}
