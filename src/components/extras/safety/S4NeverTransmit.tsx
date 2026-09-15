import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, OctagonAlert, RotateCcw, ShieldCheck } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface SortCard {
  text: string;
  /** 0 = CLEARED, 1 = HOLD SHORT */
  bin: 0 | 1;
  why: string;
}

const CARDS: SortCard[] = [
  {
    text: 'A public press release draft about the solar farm',
    bin: 0,
    why: 'Public information headed for publication anyway. Still review the output before it goes out.',
  },
  {
    text: "A passenger's name + flight + baggage claim number",
    bin: 1,
    why: 'PII. A name tied to travel details never goes into an AI tool.',
  },
  {
    text: 'Security checkpoint staffing schedules',
    bin: 1,
    why: 'SSI under 49 CFR 1520 — need-to-know only, civil penalties for disclosure. Never in an AI tool.',
  },
  {
    text: 'Your own meeting notes about a public event',
    bin: 0,
    why: 'Your own notes on public matters are fine — confirm nothing sensitive slipped in.',
  },
  {
    text: 'Badge numbers and door codes for Concourse B',
    bin: 1,
    why: 'Security data. Badge numbers and access codes are as sensitive as the doors they open.',
  },
  {
    text: 'A published board-meeting agenda',
    bin: 0,
    why: 'Already a public record — posted on ind.com for anyone to read.',
  },
  {
    text: 'An HR disciplinary case summary',
    bin: 1,
    why: 'Employee PII and confidential HR material. Full stop.',
  },
  {
    text: 'Lease terms for a concession still in negotiation',
    bin: 1,
    why: 'Business-confidential. Pre-decisional terms could distort a live negotiation.',
  },
  {
    text: 'Publicly posted flight delay statistics from the website',
    bin: 0,
    why: 'Published figures. Cite the source page when you reuse them.',
  },
  {
    text: 'A law-enforcement incident narrative',
    bin: 1,
    why: 'Law-enforcement data — reports, investigations, witness info — never leaves official channels.',
  },
];

/**
 * S4 — The Never-Transmit Sort (safety.md §S4). Ten cards dealt one at a
 * time; click-to-sort into CLEARED / HOLD SHORT bins. Wrong sorts shake,
 * flash red, explain, and re-deal. Same drill engine as Gate 5 · Leg 2.
 */
export default function S4NeverTransmit() {
  const reduced = prefersReducedMotion();
  const [current, setCurrent] = useState(0); // index into CARDS; === CARDS.length when done
  const [epoch, setEpoch] = useState(0); // remount key for re-deals
  const [wrong, setWrong] = useState(false);
  const [flight, setFlight] = useState<'left' | 'right' | null>(null);
  const [sorted, setSorted] = useState<{ cleared: number[]; hold: number[] }>({ cleared: [], hold: [] });
  const [misses, setMisses] = useState(0);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const done = current >= CARDS.length;
  const card = done ? null : CARDS[current];

  const answer = (bin: 0 | 1) => {
    if (wrong || flight || done || !card) return;
    if (bin === card.bin) {
      const dir = bin === 0 ? 'left' : 'right';
      // advance immediately — the card unmounts and exits toward its bin
      // (AnimatePresence mode="wait" deals the next card after the flight)
      setFlight(dir);
      setSorted((s) =>
        bin === 0 ? { ...s, cleared: [...s.cleared, current] } : { ...s, hold: [...s.hold, current] },
      );
      setCurrent((c) => c + 1);
      setEpoch((e) => e + 1);
      later(() => setFlight(null), reduced ? 120 : 450);
    } else {
      setWrong(true);
      setMisses((m) => m + 1);
      later(() => {
        setWrong(false);
        setEpoch((e) => e + 1); // re-deal the same card
      }, reduced ? 200 : 1200);
    }
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setCurrent(0);
    setEpoch((e) => e + 1);
    setWrong(false);
    setFlight(null);
    setSorted({ cleared: [], hold: [] });
    setMisses(0);
  };

  return (
    <section className="relative bg-tarmac-950">
      <div className="mx-auto max-w-[900px] px-6 py-24">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-glow-amber">DRILL · THE NEVER-TRANSMIT SORT</p>
          <h2 className="h1 mt-4 text-fog-100">Cleared, or hold short?</h2>
          <p className="body mt-4 text-fog-300">
            Ten items from a real inbox. Route each one: safe to paste into an AI tool, or
            never leaves controlled channels.
          </p>
        </motion.div>

        {/* deal tray */}
        <div className="mt-10 rounded-[10px] border border-tarmac-700 bg-tarmac-900 p-5 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="label text-fog-500">DEAL TRAY</p>
            <p className="data text-[12px] uppercase tracking-[0.14em] text-fog-500">
              {done ? 'ALL 10 ROUTED' : `CARD ${current + 1} OF ${CARDS.length}`}
            </p>
          </div>

          <div className="relative mt-5 min-h-[240px]">
            <AnimatePresence mode="wait">
              {card && !done ? (
                <motion.div
                  key={`${current}-${epoch}`}
                  initial={reduced ? false : { y: -20, opacity: 0 }}
                  animate={
                    wrong
                      ? { x: [0, -8, 8, -6, 6, 0], opacity: 1, y: 0 }
                      : { x: 0, opacity: 1, y: 0 }
                  }
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : {
                          x: flight === 'left' ? -260 : 260,
                          y: 120,
                          rotate: flight === 'left' ? -10 : 10,
                          opacity: 0,
                          transition: { type: 'spring', stiffness: 260, damping: 24 },
                        }
                  }
                  transition={
                    wrong
                      ? { duration: 0.4 }
                      : { duration: 0.2, ease: EASE_EXPO }
                  }
                  className={cn(
                    'rounded-[6px] border-2 bg-tarmac-800 p-6 transition-colors',
                    wrong ? 'border-glow-red bg-glow-red/10' : 'border-tarmac-700',
                  )}
                >
                  <p className="body-strong text-fog-100">“{card.text}”</p>
                  {wrong ? (
                    <p className="small mt-3 flex items-start gap-2 text-glow-red">
                      <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                      {card.why}
                    </p>
                  ) : null}

                  {/* sort buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => answer(0)}
                      disabled={wrong}
                      className="inline-flex items-center gap-2 rounded-[2px] border-2 border-glow-green px-4 py-2 font-sans text-[15px] font-bold text-glow-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-glow-green/10 disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> CLEARED
                    </button>
                    <button
                      type="button"
                      onClick={() => answer(1)}
                      disabled={wrong}
                      className="inline-flex items-center gap-2 rounded-[2px] border-2 border-glow-red px-4 py-2 font-sans text-[15px] font-bold text-glow-red transition-all duration-200 hover:-translate-y-0.5 hover:bg-glow-red/10 disabled:opacity-40"
                    >
                      HOLD SHORT <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="tally"
                  initial={reduced ? false : { y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE_EXPO }}
                  className="rounded-[6px] border-2 border-glow-amber bg-tarmac-800 p-6 text-center"
                >
                  <p className="label text-glow-amber">SORT COMPLETE</p>
                  <p className="display-2 mt-3 text-fog-100">
                    10/10 <span className="text-glow-amber">— SENTINEL MATERIAL</span>
                  </p>
                  <p className="data mt-3 text-[12px] uppercase tracking-[0.14em] text-fog-500">
                    {misses === 0 ? 'A CLEAN SORT — NO MISSES' : `${misses} RE-ROUTE${misses === 1 ? '' : 'S'} ALONG THE WAY — THE RE-DEAL IS THE TEACHER`}
                  </p>
                  <p className="small mt-4 text-fog-300">
                    When unsure: stop and ask your supervisor or IT. And remember — anything you
                    type into an AI tool may be a public record.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-5 inline-flex items-center gap-2 rounded-[2px] border-2 border-fog-500 px-4 py-2 font-sans text-[14px] font-bold text-fog-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-fog-300 hover:text-fog-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Sort again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* bins */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[6px] border border-glow-green/50 bg-tarmac-900 p-4">
            <p className="label flex items-center gap-2 text-glow-green">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              CLEARED TO TRANSMIT · {sorted.cleared.length}/4
            </p>
            <ul className="mt-3 space-y-1.5">
              {sorted.cleared.map((i) => (
                <li key={i} className="small truncate text-fog-500">
                  ✓ {CARDS[i].text}
                </li>
              ))}
              {sorted.cleared.length === 0 ? (
                <li className="small italic text-fog-500/60">Awaiting arrivals…</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-[6px] border border-glow-red/50 bg-tarmac-900 p-4">
            <p className="label flex items-center gap-2 text-glow-red">
              <OctagonAlert className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              HOLD SHORT — NEVER PASTE · {sorted.hold.length}/6
            </p>
            <ul className="mt-3 space-y-1.5">
              {sorted.hold.map((i) => (
                <li key={i} className="small truncate text-fog-500">
                  ✕ {CARDS[i].text}
                </li>
              ))}
              {sorted.hold.length === 0 ? (
                <li className="small italic text-fog-500/60">Holding position…</li>
              ) : null}
            </ul>
          </div>
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-fog-500">
          Same engine as GATE 5 · LEG 2 — the drill you fly here counts toward that leg.
        </p>
      </div>
    </section>
  );
}
