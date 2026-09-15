import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

function CountUp({ to, decimals = 0, suffix = '' }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = prefersReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, to, {
      duration: 1.2,
      ease: EASE_EXPO,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, reduced]);
  if (reduced) {
    return (
      <span ref={ref}>
        {to.toFixed(decimals)}
        {suffix}
      </span>
    );
  }
  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 14, decimals: 0, suffix: '×', caption: 'Best Airport in North America (ACI ASQ)' },
  { value: 10.6, decimals: 1, suffix: 'M', caption: 'passengers in 2025' },
  { value: 6, decimals: 0, suffix: '', caption: 'gates to certification' },
] as const;

/** S3 — Why This Course, Why Now (home.md §S3). */
export default function S3Why() {
  const reduced = prefersReducedMotion();
  return (
    <section className="bg-paper py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 lg:grid-cols-[45%_55%]">
        {/* image with clip-path wipe + Ken Burns */}
        <motion.div
          initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: EASE_EXPO }}
          className="overflow-hidden border-2 border-ink-900 bg-paper-bright p-2 shadow-card"
        >
          <motion.img
            src="/photo-ind-terminal.webp"
            alt="Flat illustration of the IND civic plaza terminal interior with arched windows, travelers, and a hanging sign reading GATES"
            className="block h-auto w-full"
            width={1600}
            height={900}
            loading="lazy"
            initial={reduced ? false : { scale: 1 }}
            whileInView={{ scale: 1.05 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </motion.div>

        {/* text stack */}
        <div>
          {[
            <p key="label" className="label text-amber-600">PRE-FLIGHT BRIEFING</p>,
            <h2 key="h" className="h1 mt-4 text-ink-900">
              The world's best-run airport deserves the world's best-prompted team.
            </h2>,
            <p key="p1" className="body mt-6 text-ink-700">
              Indianapolis International has been named Best Airport in North America fourteen
              straight years — because this team sweats details others don't even see. AI is the
              newest tool on the field, and it rewards the same discipline: clear instructions,
              the right context, verified outputs.
            </p>,
            <p key="p2" className="body mt-4 text-ink-700">
              Prompt engineering isn't a tech skill. It's a communication skill — and it's already
              part of operations summaries, passenger replies, tenant notices, HR answers, and
              grant narratives written every day at IND. This Academy teaches it the airport way:
              with real scenarios, instant feedback, and safety built in from the first leg.
            </p>,
          ].map((node, i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: EASE_EXPO, delay: i * 0.08 }}
            >
              {node}
            </motion.div>
          ))}

          {/* stat row */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {STATS.map((s) => (
              <div key={s.caption} className="relative pt-3">
                <motion.span
                  aria-hidden
                  className="absolute left-0 top-0 h-[2px] bg-amber-500"
                  initial={reduced ? false : { width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: EASE_EXPO }}
                />
                <p className="font-mono text-3xl font-semibold text-ink-900 sm:text-4xl">
                  <CountUp to={s.value} decimals={s.decimals} suffix={s.suffix} />
                </p>
                <p className="small mt-1 text-ink-500">{s.caption}</p>
              </div>
            ))}
          </div>

          {/* pull line */}
          <motion.blockquote
            initial={reduced ? false : { opacity: 0, letterSpacing: '0.02em' }}
            whileInView={{ opacity: 1, letterSpacing: '0em' }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1, ease: EASE_EXPO }}
            className="editorial mt-10 max-w-[34ch] text-amber-600"
          >
            "AI won't replace airport professionals. Airport professionals who prompt well will
            outperform those who don't."
          </motion.blockquote>
        </div>
      </div>
    </section>
  );
}
