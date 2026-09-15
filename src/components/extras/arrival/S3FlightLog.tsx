import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Code2, Route, ShieldCheck, Star, User } from 'lucide-react';
import WingBadge from '@/components/WingBadge';
import { WINGS, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const WING_META: {
  id: string;
  name: string;
  howEarned: string;
  glyph: React.ReactNode;
  ledgerKey: string;
}[] = [
  {
    id: WINGS.DELIMITERS_ACE,
    name: 'Delimiters Ace',
    howEarned: 'Score 90%+ on Gate Check 1.',
    glyph: <Code2 size={24} strokeWidth={1.5} />,
    ledgerKey: 'DELIMITERS ACE',
  },
  {
    id: WINGS.PERSONA_PILOT,
    name: 'Persona Pilot',
    howEarned: 'Score 90%+ on Gate Check 2.',
    glyph: <User size={24} strokeWidth={1.5} />,
    ledgerKey: 'PERSONA PILOT',
  },
  {
    id: WINGS.COT_NAVIGATOR,
    name: 'CoT Navigator',
    howEarned: 'Score 90%+ on Gate Check 3.',
    glyph: <Route size={24} strokeWidth={1.5} />,
    ledgerKey: 'COT NAVIGATOR',
  },
  {
    id: WINGS.SAFETY_SENTINEL,
    name: 'Safety Sentinel',
    howEarned: 'Sign the IAA Prompt Pledge on the Safety page.',
    glyph: <ShieldCheck size={24} strokeWidth={1.5} />,
    ledgerKey: 'SAFETY SENTINEL',
  },
  {
    id: WINGS.GOLD_PROMPT,
    name: 'Gold Prompt',
    howEarned: 'Earn a GOLD PROMPT verdict (90+) on any Lab scenario.',
    glyph: <Star size={24} strokeWidth={1.5} />,
    ledgerKey: 'GOLD PROMPT',
  },
];

/** Count-up stat (1s expo, triggered at 15% viewport). */
function CountUp({ value, className }: { value: number; className?: string }) {
  const reduced = prefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className={className}>
      {(reduced ? value : display).toLocaleString()}
    </span>
  );
}

/** S3 — Journey recap, "Flight Log" (certificate.md §S3). */
export default function S3FlightLog() {
  const reduced = prefersReducedMotion();
  const progress = useProgress();

  const labEntries = Object.entries(progress.lab).filter(([, v]) => v.attempts > 0);
  const best = labEntries.reduce<{ id: string; score: number } | null>(
    (acc, [id, v]) => (acc === null || v.bestScore > acc.score ? { id, score: v.bestScore } : acc),
    null,
  );
  const checkScores = ['g1', 'g2', 'g3', 'g4', 'g5']
    .map((g) => progress.gates[g]?.checkScore)
    .filter((s): s is number => typeof s === 'number');
  const checkAvg =
    checkScores.length > 0
      ? Math.round(checkScores.reduce((a, b) => a + b, 0) / checkScores.length)
      : 0;

  const wingDate = (ledgerKey: string): string | null =>
    progress.ledger.find((e) => e.label === `WING EARNED: ${ledgerKey}`)?.at ?? null;

  const unearned = WING_META.filter((w) => !progress.wings.includes(w.id));

  return (
    <section className="arrival-hide-print relative bg-paper-dim/60">
      <div className="mx-auto max-w-[1180px] px-6 py-24">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-amber-600">JOURNEY RECAP</p>
          <h2 className="h1 mt-4 text-ink-900">Flight log.</h2>
        </motion.div>

        {/* stat band */}
        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-3"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <div className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card">
            <p className="label text-ink-500">TOTAL MILES</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-ink-900">
              <CountUp value={progress.miles} />
            </p>
          </div>
          <div className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card">
            <p className="label text-ink-500">BEST LAB SCORE</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-ink-900">
              {best ? <CountUp value={best.score} /> : '—'}
              {best ? (
                <span className="ml-2 align-middle font-mono text-sm font-medium text-amber-600">
                  {best.id}
                </span>
              ) : null}
            </p>
          </div>
          <div className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card">
            <p className="label text-ink-500">GATE CHECK AVERAGE</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-ink-900">
              <CountUp value={checkAvg} />
              <span className="text-xl text-ink-500">%</span>
            </p>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* miles ledger */}
          <motion.div
            initial={reduced ? false : { y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE_EXPO }}
            className="rounded-[6px] border border-line bg-paper-bright shadow-card"
          >
            <p className="label border-b border-line px-5 py-3 text-ink-500">
              MILES LEDGER · EVERY MILE EARNED
            </p>
            <div className="max-h-[264px] overflow-y-auto">
              <table className="w-full">
                <tbody>
                  {progress.ledger.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.05 }}
                      className="border-b border-line/60 last:border-0"
                    >
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[13px] font-semibold text-field-600">
                        {e.amount > 0 ? `+${e.amount}` : '★'}
                      </td>
                      <td className="w-full px-2 py-2.5 font-mono text-[12px] uppercase tracking-[0.06em] text-ink-700">
                        {e.label}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono text-[11px] text-ink-500">
                        {new Date(e.at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </motion.tr>
                  ))}
                  {progress.ledger.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-center font-mono text-[12px] text-ink-500">
                        NO ENTRIES YET
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* wings rack */}
          <motion.div
            initial={reduced ? false : { y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.1 }}
            className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card"
          >
            <p className="label text-ink-500">WINGS RACK</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {WING_META.map((w) => {
                const earned = progress.wings.includes(w.id);
                return (
                  <WingBadge
                    key={w.id}
                    name={w.name}
                    earned={earned}
                    howEarned={w.howEarned}
                    date={earned ? wingDate(w.ledgerKey) : null}
                    glyph={w.glyph}
                    size={72}
                  />
                );
              })}
            </div>
            {unearned.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-600">
                  {unearned.length} WING{unearned.length === 1 ? '' : 'S'} STILL ON THE FIELD
                </p>
                <p className="small mt-1 text-ink-500">
                  Still on the field. The Lab reopens whenever you are.
                </p>
              </div>
            ) : (
              <p className="mt-4 border-t border-line pt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-field-600">
                FULL RACK — ALL 5 WINGS EARNED
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
