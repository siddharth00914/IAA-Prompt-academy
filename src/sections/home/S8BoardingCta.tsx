import { Link } from 'react-router';
import { motion } from 'framer-motion';
import BoardingPassCard from '@/components/BoardingPassCard';
import { hasAnyProgress, isCertified, useProgress } from '@/lib/progress';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_OVERSHOOT = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

/** S8 — Boarding CTA (home.md §S8). */
export default function S8BoardingCta() {
  const reduced = prefersReducedMotion();
  useProgress();
  const resume = hasAnyProgress();
  const certified = isCertified();

  return (
    <section className="border-t border-line bg-paper py-24 lg:py-32">
      <div className="mx-auto max-w-[1180px] px-6 text-center">
        <p className="label text-amber-600">FINAL CALL</p>
        <h2 className="display-2 mt-3 text-ink-900">Your gate is open.</h2>

        <motion.div
          className="mx-auto mt-12 max-w-[860px] text-left"
          initial={reduced ? false : { y: -80, rotate: -2, opacity: 0 }}
          whileInView={{ y: 0, rotate: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE_OVERSHOOT }}
        >
          <BoardingPassCard
            passenger="IAA STAFF MEMBER"
            from="GATE 0 — WELCOME ABOARD"
            to="CERTIFIED PROMPT PROFESSIONAL"
            seat="1A"
            group="NOW BOARDING"
            code="WTP-101"
            miles={0}
          />
        </motion.div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/journey" className="btn-primary btn-beacon">
            {resume ? 'Resume Your Journey →' : 'Begin Boarding →'}
          </Link>
          {certified ? (
            <Link to="/arrival" className="btn-ghost">
              View your certificate →
            </Link>
          ) : null}
        </div>
        <p className="mt-6 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          NO INSTALLS · NO GRADES · RETAKE ANYTHING · ≈3 HRS TOTAL
        </p>
      </div>
    </section>
  );
}
