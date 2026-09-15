import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import TypeAndRespond from '@/components/TypeAndRespond';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PROMPT =
  'What was the on-time performance rank of Indianapolis International Airport in the 2019 global OAG report, and what score did it receive?';

const HALLUCINATED =
  'According to the 2019 OAG Punctuality League report, Indianapolis International Airport ranked #4 globally for on-time performance, with an OTP score of 87.1%. The report — OAG’s annual benchmark of the world’s most punctual airports and airlines — placed IND ahead of every other mid-sized North American airport that year.';

const GROUNDED =
  'I don’t have a verified copy of the 2019 OAG Punctuality League in this chat, so I can’t state IND’s rank or score without risking inventing them. Here’s how to pin it down: pull the published Punctuality League from oag.com or the ind.com media archive and cite the exact table. Paste the excerpt here — delimited — and I’ll summarize it faithfully.';

interface Claim {
  text: string;
  fabricated: boolean;
  verdict: string;
}

const CLAIMS: Claim[] = [
  {
    text: '“IND ranked #4 globally for on-time performance in 2019.”',
    fabricated: true,
    verdict: 'FABRICATED — NO SUCH RANKING EXISTS IN THIS FORM',
  },
  {
    text: '“IND’s on-time performance score was 87.1%.”',
    fabricated: true,
    verdict: 'FABRICATED — THE NUMBER WAS INVENTED, DIGITS AND ALL',
  },
  {
    text: '“Source: the OAG Punctuality League report.”',
    fabricated: false,
    verdict: 'VERIFIABLE — THE REPORT IS REAL; THE QUOTED “FACTS” ARE NOT',
  },
];

/** Dark chrome overrides for the shared TypeAndRespond player (Night Ops). */
const DARK_PLAYER = cn(
  '!border-tarmac-700 !bg-tarmac-900 shadow-none',
  '[&_.bg-paper-bright]:!bg-tarmac-800',
  '[&_.bg-paper-dim]:!bg-tarmac-800/60',
  '[&_.bg-paper]:!bg-tarmac-800',
  '[&_.border-ink-900]:!border-tarmac-700',
  '[&_.border-line]:!border-tarmac-700',
  '[&_.text-ink-900]:!text-fog-100',
  '[&_.text-ink-700]:!text-fog-300',
  '[&_.text-ink-500]:!text-fog-500',
  '[&_.text-ink-300]:!text-fog-500',
  '[&_.bg-amber-500.text-ink-900]:!text-ink-900',
  '[&_.bg-ink-900]:!bg-glow-amber',
);

/** S2 — "Confidently Wrong": hallucination demo + spot-the-fabrication game. */
export default function S2ConfidentlyWrong() {
  const reduced = prefersReducedMotion();
  const [revealed, setRevealed] = useState<boolean[]>(CLAIMS.map(() => false));
  const foundCount = CLAIMS.filter((c, i) => c.fabricated && revealed[i]).length;
  const done = foundCount === 2;

  const reveal = (i: number) => {
    setRevealed((prev) => (prev[i] ? prev : prev.map((r, idx) => (idx === i ? true : r))));
  };

  return (
    <section id="safety-hallucination" className="relative bg-tarmac-950">
      <div className="mx-auto max-w-[820px] px-6 py-24">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-glow-amber">EXHIBIT A · THE CONFIDENT LIE</p>
          <h2 className="h1 mt-4 text-fog-100">Confidently wrong.</h2>
        </motion.div>

        <motion.div
          className="mt-10"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <TypeAndRespond
            weak={{ prompt: PROMPT, response: HALLUCINATED }}
            strong={{
              prompt: PROMPT,
              response: GROUNDED,
              caption: 'The grounded play: state uncertainty, name a real source, give a verify path.',
            }}
            chips={['States uncertainty', 'Names a real source', 'Gives a verify path']}
            autoPlay
            speedControl
            className={DARK_PLAYER}
          />
          <p className="data mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-glow-red">
            2 OF 3 “FACTS” ABOVE ARE FABRICATED. THE MODEL NEVER HESITATED.
          </p>
        </motion.div>

        <motion.div
          className="body mt-8 text-fog-300"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p>
            This is a hallucination: output that reads like fact and isn’t. Models predict
            plausible text — they don’t verify it. The confidence is cosmetic. The fix is
            procedural, not technical:{' '}
            <strong className="text-fog-100">
              verify every fact, number, date, name, and citation against an authoritative source
              before you use it.
            </strong>
          </p>
        </motion.div>

        {/* spot-the-fabrication mini-game */}
        <motion.div
          className="mt-12"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-fog-500">DRILL · TAP THE TWO CLAIMS YOU DOUBT</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {CLAIMS.map((claim, i) => (
              <button
                key={i}
                type="button"
                onClick={() => reveal(i)}
                disabled={revealed[i]}
                className="group text-left perspective-600"
                aria-pressed={revealed[i]}
              >
                <motion.div
                  className="relative min-h-[168px] w-full preserve-3d"
                  initial={false}
                  animate={{ rotateY: revealed[i] ? 180 : 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 260, damping: 24, duration: 0.4 }
                  }
                >
                  {/* front — the claim */}
                  <div
                    className={cn(
                      'absolute inset-0 flex flex-col justify-between rounded-[6px] border bg-tarmac-800 p-4 transition-colors',
                      revealed[i] ? 'border-tarmac-700' : 'border-tarmac-700 group-hover:border-glow-amber',
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <p className="small text-fog-100">{claim.text}</p>
                    <p className="label mt-3 text-[10px] text-fog-500 group-hover:text-glow-amber">
                      CLAIM 0{i + 1} · TAP TO CHECK
                    </p>
                  </div>
                  {/* back — the verdict */}
                  <div
                    className={cn(
                      'absolute inset-0 flex flex-col justify-between rounded-[6px] border-2 p-4',
                      claim.fabricated
                        ? 'border-glow-red bg-glow-red/10'
                        : 'border-glow-green bg-glow-green/10',
                    )}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <p className="small text-fog-100">{claim.text}</p>
                    <p
                      className={cn(
                        'data mt-3 flex items-start gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]',
                        claim.fabricated ? 'text-glow-red' : 'text-glow-green',
                      )}
                    >
                      {claim.fabricated ? (
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                      ) : (
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                      )}
                      {claim.verdict}
                    </p>
                  </div>
                </motion.div>
              </button>
            ))}
          </div>

          <div className="mt-6 min-h-[56px]">
            {done ? (
              <motion.div
                initial={reduced ? false : { y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE_EXPO }}
                className="rounded-[6px] border border-glow-amber/40 bg-tarmac-900 p-4"
              >
                <p className="body-strong flex items-center gap-2 text-glow-amber">
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Found 2/2. That instinct — verify, then trust — is the whole lesson.
                </p>
                <p className="small mt-1 text-fog-500">
                  Note the trap: the report is real. Real source ≠ true claim — a model can quote a
                  genuine publication and still invent what it says.
                </p>
              </motion.div>
            ) : (
              <p className="data text-[12px] uppercase tracking-[0.14em] text-fog-500">
                {foundCount}/2 FABRICATIONS FOUND
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
