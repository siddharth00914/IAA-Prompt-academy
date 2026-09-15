import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { MANUAL_CARDS } from '@/data/manual';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Print rules: the manual page chrome hides; the one-pager prints alone. */
const PRINT_CSS = `
@media print {
  header, footer, .grain-overlay, .manual-screen { display: none !important; }
  [class*="z-[110]"] { display: none !important; }
  html, body { background: #ffffff !important; }
  main { padding-top: 0 !important; }
  #manual-cheatsheet-print { display: block !important; }
}
@page { size: portrait; margin: 10mm; }
`;

/** S4 — Cheat sheet band (glossary.md §S4) + the hidden printable one-pager. */
export default function CheatSheetBand() {
  const reduced = prefersReducedMotion();

  // stable random-ish deal order for the thumbnail cells
  const thumbOrder = useMemo(
    () =>
      MANUAL_CARDS.map((c, i) => ({ code: c.code, sort: (i * 7919) % 31 }))
        .sort((a, b) => a.sort - b.sort)
        .map((c) => c.code),
    [],
  );

  return (
    <>
      <style>{PRINT_CSS}</style>

      {/* the band (screen) */}
      <section className="manual-screen relative overflow-hidden bg-amber-100">
        <motion.div
          initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE_EXPO }}
          className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 py-20 lg:grid-cols-2"
        >
          <div>
            <p className="label text-amber-600">TAKE IT WITH YOU</p>
            <h2 className="h1 mt-4 text-ink-900">The one-pager.</h2>
            <p className="body mt-4 max-w-[48ch] text-ink-700">
              All 30 cards condensed to a single printable sheet — taped to a lot of monitors
              by spring.
            </p>
            <button type="button" onClick={() => window.print()} className="btn-ghost mt-8">
              <Printer className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Print the cheat sheet →
            </button>
          </div>

          {/* preview thumbnail — code-drawn mini grid, decorative */}
          <div aria-hidden className="rounded-[6px] border border-ink-900/20 bg-paper-bright p-4 shadow-card">
            <div className="grid grid-cols-6 gap-1.5">
              {thumbOrder.map((code, i) => (
                <motion.span
                  key={code}
                  initial={reduced ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="rounded-[2px] bg-paper-dim px-1 py-1.5 text-center font-mono text-[8px] font-semibold text-ink-500"
                >
                  {code}
                </motion.span>
              ))}
            </div>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
              IAA PROMPT ACADEMY · REFERENCE ONE-PAGER
            </p>
          </div>
        </motion.div>
      </section>

      {/* the printable sheet (print only) */}
      <div id="manual-cheatsheet-print" style={{ display: 'none' }}>
        <h1 style={{ fontFamily: 'Overpass, sans-serif', fontSize: 20, fontWeight: 800 }}>
          IAA Prompt Academy — Flight Manual one-pager
        </h1>
        <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, marginTop: 4 }}>
          30 CARDS · CODE → TEMPLATE · {'{curly}'} = FILL IN YOUR OWN · winthrop-tech.com
        </p>
        <div
          style={{
            marginTop: 12,
            columnCount: 2,
            columnGap: 16,
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 8.5,
            lineHeight: 1.45,
          }}
        >
          {MANUAL_CARDS.map((c) => (
            <div key={c.code} style={{ breakInside: 'avoid', marginBottom: 8 }}>
              <strong>{c.code} · {c.title.toUpperCase()}</strong>
              <br />
              {c.template}
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, marginTop: 8 }}>
          SAFETY REMINDER: NO SSI (49 CFR 1520), NO PII, NO BADGE/LE DATA · EVERY PROMPT MAY BE A PUBLIC RECORD · VERIFY BEFORE USE
        </p>
      </div>
    </>
  );
}
