import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Rule {
  rule: string;
  basis: string;
  citation: string;
}

const RULES: Rule[] = [
  {
    rule: 'Never paste SSI.',
    basis: 'Sensitive Security Information (49 CFR 1520) stays in controlled channels — need-to-know, civil penalties.',
    citation:
      'SSI covers airport security programs, Security Directives, vulnerability and threat information, screening equipment specs, and TSA correspondence marked SSI. A public AI tool is not a "covered person" with a need to know — pasting SSI is an unauthorized disclosure under 49 CFR Part 1520, full stop.',
  },
  {
    rule: "No PII — passengers' or coworkers'.",
    basis: 'No names+travel details, badge numbers, HR, medical, payroll, discipline, or law-enforcement data.',
    citation:
      'State and municipal policies (Pennsylvania\'s enterprise ChatGPT rules among them) bar PII, confidential, and employee information outright. One widely cited analysis found ~11% of what employees paste into public chatbots is confidential — assume yours would be too.',
  },
  {
    rule: 'Treat every prompt as a public record.',
    basis: 'Assume anything typed could be requested or headlined.',
    citation:
      'IAA is a municipal corporation; Indiana\'s public-records law (APRA) reaches our records, and IAA itself publishes a Public Records Request Form. San Jose\'s rule #1 says it plainly: "Presume anything you submit could end up on the front page of a newspaper."',
  },
  {
    rule: 'AI is never the source of truth.',
    basis: 'Verify every fact, number, date, gate, regulation, and name. AI is never cited as authority.',
    citation:
      'FAA Notice 1370.52: generative AI must not "be cited as direct evidence or authority for a determination/decision." And Air Canada (2024 BCCRT 149) settled who owns the words: the organization does.',
  },
  {
    rule: 'Human review before anything leaves your desk.',
    basis: 'You are responsible for validity, accuracy, completeness. (FAA Notice 1370.52 spirit.)',
    citation:
      'FAA Notice 1370.52 makes staff "responsible for reviewing all AI-produced content for validity, accuracy and completeness before publishing." Hallucinations are confident and well-formatted — Mata v. Avianca filed six of them.',
  },
  {
    rule: 'Approved tools only for work content.',
    basis: 'Consumer tools may train on your inputs; internal content belongs in approved enterprise tools — or nowhere.',
    citation:
      'Free consumer tools may retain and train on inputs — the 2023 Samsung source-code leak is the canonical example. Work content belongs only in enterprise tools with no-training agreements.',
  },
  {
    rule: 'Protect business-confidential material.',
    basis: 'Leases, concession data, bids/RFPs in progress, pre-decisional budgets, privileged matters.',
    citation:
      'Tenant lease terms, concession sales data, RFP and bid details in progress, pre-decisional budget figures, and attorney-client privileged matters get the same protection as PII — disclosure can distort live negotiations and waive privilege.',
  },
  {
    rule: 'Disclose and log AI assistance where required.',
    basis: 'Follow policy on citing AI use.',
    citation:
      'The San Jose model: footnote the tool and confirm the fact-check. Indiana\'s AI policy applies "just-in-time" notice principles to public-facing AI. Where a policy requires disclosure, disclose — a logged use is a defensible use.',
  },
  {
    rule: 'Humans in charge of safety-critical text.',
    basis: 'No AI-drafted NOTAMs, emergency instructions, security procedures, or regulatory correspondence without authorized review and sign-off.',
    citation:
      'FAA doctrine is incremental adoption — low-risk uses first. Safety-critical text requires review and sign-off by the authorized official, every time, no matter how clean the draft reads.',
  },
  {
    rule: 'When unsure, stop and ask.',
    basis: 'Supervisor, IT, or Legal — and report mistakes promptly; early reporting limits damage.',
    citation:
      'FAA\'s first-line-manager rule: discuss new GenAI uses with your manager before you start. And if something sensitive slips into a tool, report it immediately — an hour of embarrassment beats a week of incident response.',
  },
];

/** S5 — The 10 House Rules (safety.md §S5): mono ledger rows, expandable citations. */
export default function S5HouseRules() {
  const reduced = prefersReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative bg-tarmac-950">
      <div className="mx-auto max-w-[1180px] px-6 py-24">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-glow-amber">STANDING ORDERS</p>
          <h2 className="h1 mt-4 text-fog-100">The 10 house rules.</h2>
          <p className="body mt-4 max-w-[54ch] text-fog-300">
            Print them. Tape them to the monitor. They apply to every gate, every lab
            scenario, and every prompt you write after this course ends.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-3 lg:grid-cols-2">
          {RULES.map((r, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={reduced ? false : { y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: EASE_EXPO, delay: (i % 5) * 0.06 }}
                className={cn(
                  'rounded-[6px] border bg-tarmac-900 transition-colors',
                  isOpen ? 'border-glow-amber/50' : 'border-tarmac-700',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 p-4 text-left"
                >
                  <span className="data mt-0.5 shrink-0 text-[13px] font-semibold text-glow-amber">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="body-strong block text-fog-100">{r.rule}</span>
                    <span className="small mt-1 block text-fog-500">{r.basis}</span>
                  </span>
                  {isOpen ? (
                    <Minus className="mt-1 h-4 w-4 shrink-0 text-glow-amber" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <Plus className="mt-1 h-4 w-4 shrink-0 text-fog-500" strokeWidth={1.5} aria-hidden />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.3, ease: EASE_EXPO }}
                      className="overflow-hidden"
                    >
                      <p className="small border-t border-tarmac-700 px-4 py-3 pl-[52px] leading-relaxed text-fog-300">
                        {r.citation}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
