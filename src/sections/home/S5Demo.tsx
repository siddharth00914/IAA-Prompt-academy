import { motion } from 'framer-motion';
import TypeAndRespond from '@/components/TypeAndRespond';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const WEAK = {
  prompt: 'Write a reply to a passenger about their lost bag.',
  response: 'Dear passenger, We are sorry about your bag. It should arrive soon. Thanks for flying with us.',
  caption: 'Generic, no next step, no empathy specifics, wrong channel tone.',
};

const STRONG = {
  prompt:
    'You are a customer service supervisor at Indianapolis International Airport. A passenger\u2019s checked bag was delayed 26 hours on an inbound flight yesterday. Write a 120-word email reply: apologize sincerely, explain that the bag has been located and will be delivered to their hotel by courier today, include the claim reference IND-4471, and close with a direct phone line. Tone: warm, accountable, no jargon.',
  response:
    'Dear Ms. Alvarez, I am truly sorry your bag did not arrive with you yesterday — after a long travel day, that is the last thing you deserved. The good news: we have located it. Your bag arrived on this morning\u2019s inbound flight and will be delivered to your hotel by courier today. Your claim reference is IND-4471 — please keep it handy. If you would like an update at any point, call me directly at (317) 555-0148 and I will pick up. Thank you for your patience, and for flying through Indianapolis. We will do better. — J. Carter, Customer Service Supervisor',
  caption: 'Role, context, structure, length, tone: all specified, all delivered.',
};

/** S5 — Live Demo: Weak vs. Strong (home.md §S5). */
export default function S5Demo() {
  const reduced = prefersReducedMotion();
  return (
    <section className="border-y border-line bg-paper-dim py-24 lg:py-28">
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div
          className="mx-auto max-w-[980px]"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: EASE_EXPO }}
        >
          <p className="label text-amber-600">TOWER DEMO · SCENARIO: DELAYED BAG</p>
          <h2 className="h2 mt-3 text-ink-900">Same request. Different altitude.</h2>
          <p className="body mt-4 max-w-[60ch] text-ink-700">
          Every response below is canned — the Academy never sends your words anywhere. Flip the
          toggle and watch what a fully-loaded prompt brings home.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mt-10 max-w-[980px]"
          initial={reduced ? false : { y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.1 }}
        >
          <TypeAndRespond
            weak={WEAK}
            strong={STRONG}
            chips={['ROLE', 'CONTEXT', 'FORMAT', 'LENGTH', 'TONE']}
            autoPlay
            speedControl
          />
        </motion.div>
      </div>
    </section>
  );
}
