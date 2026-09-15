/**
 * Now Boarding — the next-up card (dashboard.md §S3). Full-width amber-100
 * card with a 2px amber spine: next item, why, and the resume CTA. Reveals
 * with a clip wipe on scroll enter; the label split-flaps in; the CTA arrow
 * nudges on hover. Reduced motion: simple crossfade.
 */
import { useRef } from "react";
import { Link } from "react-router";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SplitFlap from "@/components/SplitFlap";
import { scrollToTarget, prefersReducedMotion } from "@/lib/smooth-scroll";
import { EASE_JET } from "@/components/dashboard/primitives";
import type { NextUp } from "@/components/dashboard/journey-data";

interface NowBoardingProps {
  nextUp: NextUp;
}

export default function NowBoarding({ nextUp }: NowBoardingProps) {
  const reduced = prefersReducedMotion();
  // The IntersectionObserver target must NOT be the clip-animated element:
  // a fully self-clipped element (inset(0 100% 0 0)) has zero visible area,
  // so the observer never fires and the CTA stays invisible/unclickable.
  // Observe this never-clipped wrapper and animate the child instead.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <div ref={ref}>
      <motion.div
        initial={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, clipPath: "inset(0 100% 0 0)" }
        }
        animate={
          inView ? { opacity: 1, clipPath: "inset(0 0% 0 0)" } : undefined
        }
        transition={{ duration: reduced ? 0.2 : 0.6, ease: EASE_JET }}
        className="rounded-[6px] border-l-2 border-amber-500 bg-amber-100 shadow-card"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-10">
          {/* next item info */}
          <div className="lg:basis-[38%]">
            <p className="label text-amber-600">
              {inView ? (
                <SplitFlap text="NOW BOARDING" stagger={35} />
              ) : (
                "NOW BOARDING"
              )}
            </p>
            <h3 className="h3 mt-3 text-ink-900">{nextUp.title}</h3>
          </div>
          {/* why */}
          <p className="small max-w-[46ch] text-ink-700 lg:flex-1">
            {nextUp.body}
          </p>
          {/* CTA */}
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link to={nextUp.href} className="btn-primary group">
              {nextUp.cta}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
            <button
              type="button"
              onClick={() => scrollToTarget("#gates")}
              className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-700 underline decoration-amber-500 decoration-2 underline-offset-4 transition-colors hover:text-ink-900"
            >
              Browse all gates
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
