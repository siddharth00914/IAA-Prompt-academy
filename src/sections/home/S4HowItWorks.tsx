import { motion } from 'framer-motion';
import { Radio, RadioTower, Stamp } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const STEPS = [
  {
    label: 'LEARN',
    icon: RadioTower,
    title: 'Animated micro-lessons.',
    body: 'Four-to-seven-minute legs. Concepts build themselves on screen — watch a prompt assemble block by block, then fly the idea yourself.',
    meta: '24 LEGS',
  },
  {
    label: 'PRACTICE',
    icon: Radio,
    title: 'The Prompt Lab.',
    body: 'Twelve real IND scenarios — press releases, storm summaries, tenant notices. Write the prompt, transmit, get a scored debrief in seconds.',
    meta: '12 SCENARIOS',
  },
  {
    label: 'PROVE',
    icon: Stamp,
    title: 'Gate Checks & wings.',
    body: 'Short, retakeable checks at every gate. Score 80%+ to board the next one. Finish the route and earn your Certified Prompt Professional wings.',
    meta: '5 CHECKS + CAPSTONE',
  },
] as const;

/** S4 — How the Academy Works (home.md §S4). */
export default function S4HowItWorks() {
  const reduced = prefersReducedMotion();
  return (
    <section className="bg-paper py-24 lg:py-28">
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: EASE_EXPO }}
        >
          <p className="label text-amber-600">HOW THE ACADEMY WORKS</p>
          <h2 className="h2 mt-3 text-ink-900">Three legs of every flight.</h2>
        </motion.div>

        <div className="relative mt-12">
          {/* connector dashes + tiny planes (desktop) */}
          <svg
            aria-hidden
            className="pointer-events-none absolute left-0 top-16 hidden h-8 w-full lg:block"
            viewBox="0 0 1200 32"
            fill="none"
            preserveAspectRatio="none"
          >
            {[0, 1].map((seg) => (
              <motion.line
                key={seg}
                x1={390 + seg * 400}
                y1={16}
                x2={810 + seg * 400 - 190}
                y2={16}
                stroke="#A9A294"
                strokeWidth="2"
                strokeDasharray="8 7"
                initial={reduced ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.8, ease: EASE_EXPO, delay: 0.5 + seg * 0.8 }}
              />
            ))}
            {[0, 1].map((seg) => (
              <motion.path
                key={`p${seg}`}
                d="M0 0 l14 5 -14 5 4 -5 z"
                fill="#B9770E"
                initial={reduced ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.3, delay: 1.1 + seg * 0.8 }}
                transform={`translate(${505 + seg * 400}, 11)`}
              />
            ))}
          </svg>

          <div className="grid gap-8 lg:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.label}
                  initial={reduced ? false : { y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, ease: EASE_EXPO, delay: i * 0.12 }}
                  whileHover={reduced ? undefined : { y: -6 }}
                  className="group relative z-10 rounded-[6px] border border-line bg-paper-bright p-8 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
                >
                  <motion.span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-[6px] border-2 border-ink-900 bg-amber-100"
                    whileHover={reduced ? undefined : { rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className="h-6 w-6 text-ink-900" strokeWidth={1.5} aria-hidden />
                  </motion.span>
                  <p className="label mt-5 text-amber-600">{step.label}</p>
                  <h3 className="h3 mt-2 text-ink-900">{step.title}</h3>
                  <p className="body mt-3 text-[15px] text-ink-700">{step.body}</p>
                  <p className="mt-5 border-t border-line pt-3 font-mono text-[12px] font-semibold tracking-[0.14em] text-ink-500 transition-colors duration-200 group-hover:text-amber-600">
                    {step.meta}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
