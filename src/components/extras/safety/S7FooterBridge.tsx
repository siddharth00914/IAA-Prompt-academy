import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { isGateMastered, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** S7 — Footer bridge (safety.md §S7): on to Gate 5, or back to the journey. */
export default function S7FooterBridge() {
  const reduced = prefersReducedMotion();
  useProgress(); // re-render if mastery changes while on page
  const g5Done = isGateMastered('g5');

  return (
    <section className="relative bg-tarmac-950">
      <div className="mx-auto max-w-[720px] px-6 pb-32 pt-4 text-center">
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <span aria-hidden className="mx-auto block h-px w-24 bg-glow-amber/50" />
          <p className="body mt-8 text-fog-300">
            Briefing complete. Gate 5 puts all of this into practice — and the capstone is
            cleared only for those who fly by the book.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/gates/g5"
              className="btn-beacon inline-flex items-center gap-2 rounded-[2px] bg-glow-amber px-6 py-3 font-sans text-[17px] font-bold text-tarmac-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400"
            >
              {g5Done ? 'Review Gate 5 →' : 'Continue to Gate 5 →'}
            </Link>
            <Link
              to="/journey"
              className="inline-flex items-center gap-2 rounded-[2px] border-2 border-fog-500 px-6 py-3 font-sans text-[17px] font-bold text-fog-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-fog-300 hover:text-fog-100"
            >
              Back to Journey
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
