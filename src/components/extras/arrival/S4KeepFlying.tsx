import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { BookOpen, IdCard, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface NextStop {
  icon: LucideIcon;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  to: string;
}

const STOPS: NextStop[] = [
  {
    icon: BookOpen,
    kicker: 'THE FLIGHT MANUAL',
    title: 'Keep the reference close.',
    body: 'Every pattern, framework, and template from the course — searchable, copyable.',
    cta: 'Open the manual →',
    to: '/manual',
  },
  {
    icon: Radio,
    kicker: 'THE PRACTICE RANGE',
    title: 'Stay current.',
    body: 'The Lab keeps your scores. Retake any scenario and chase a 100. New scenarios join the board in future phases.',
    cta: 'Back to the Lab →',
    to: '/lab',
  },
  {
    icon: IdCard,
    kicker: 'YOUR BRIEFING CARD',
    title: 'Share the standard.',
    body: 'Print the 10 house rules for your team room. Prompting is a team sport at a public airport.',
    cta: 'Open the briefing →',
    to: '/safety',
  },
];

/** S4 — Keep Flying (certificate.md §S4): three next-step cards. */
export default function S4KeepFlying() {
  const reduced = prefersReducedMotion();
  return (
    <section className="arrival-hide-print relative bg-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-24">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-amber-600">LIFE AFTER CERTIFICATION</p>
          <h2 className="h1 mt-4 text-ink-900">Keep flying.</h2>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STOPS.map((s, i) => (
            <motion.div
              key={s.kicker}
              initial={reduced ? false : { y: 32, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: EASE_EXPO, delay: i * 0.1 }}
              whileHover={reduced ? undefined : { y: -6 }}
              className="group relative flex flex-col overflow-hidden rounded-[6px] border border-line bg-paper-bright p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              {/* amber top-edge sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-amber-500 transition-transform duration-300 group-hover:scale-x-100"
              />
              <s.icon className="h-6 w-6 text-amber-600" strokeWidth={1.5} aria-hidden />
              <p className="label mt-4 text-[10px] text-ink-500">{s.kicker}</p>
              <h3 className="h3 mt-2 text-ink-900">{s.title}</h3>
              <p className="small mt-2 flex-1 text-ink-700">{s.body}</p>
              <Link
                to={s.to}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-[2px] border-2 border-ink-900 px-4 py-2 font-sans text-[15px] font-bold text-ink-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-paper"
              >
                {s.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Fraunces sign-off above the global Night Ops footer */}
        <motion.p
          className="editorial mx-auto mt-24 max-w-[40ch] text-center text-ink-700"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          “Cleared to prompt — and cleared for whatever’s next.”
          <span className="mt-2 block font-mono text-[12px] not-italic uppercase tracking-[0.14em] text-ink-500">
            — WINTHROP-TECH
          </span>
        </motion.p>
      </div>
    </section>
  );
}
