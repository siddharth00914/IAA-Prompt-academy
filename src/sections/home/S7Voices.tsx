import { motion } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const VOICES = [
  {
    quote:
      'I write irregular-ops summaries every week. The iterate loop cut my drafting time in half — and my exec team noticed.',
    attribution: 'M. OKAFOR · AIRPORT OPERATIONS · GATE 4 GRAD',
    portrait: '/persona-ops.webp',
    alt: 'Illustrated portrait of an airport operations coordinator in a hi-vis vest and radio headset',
  },
  {
    quote:
      "The Lab called my first press-release prompt 'a VFR flight in IFR weather.' Harsh. Accurate. My second attempt scored 94.",
    attribution: 'D. REYES · PUBLIC AFFAIRS · GOLD PROMPT WING',
    portrait: '/persona-comms.webp',
    alt: 'Illustrated portrait of a public affairs officer in a blazer holding a press folder',
  },
  {
    quote:
      'Gate 5 changed how I think about what I paste into AI tools. That alone was worth the three hours.',
    attribution: 'S. TALLEY · PUBLIC SAFETY · SAFETY SENTINEL',
    portrait: '/persona-maint.webp',
    alt: 'Illustrated portrait of an airfield maintenance lead in a beanie and hi-vis jacket',
  },
] as const;

/** S7 — Voices from the Flight Crew (home.md §S7). */
export default function S7Voices() {
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
          <p className="label text-amber-600">VOICES FROM THE FLIGHT CREW</p>
          <h2 className="h2 mt-3 text-ink-900">Logbook entries.</h2>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {VOICES.map((v, i) => (
            <motion.figure
              key={v.attribution}
              initial={reduced ? false : { y: 32, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: EASE_EXPO, delay: i * 0.12 }}
              className="group relative rounded-[6px] border border-line bg-paper-bright p-8 shadow-card"
            >
              {/* oversized quote glyph brightens on hover */}
              <span
                aria-hidden
                className="absolute right-6 top-4 font-editorial text-7xl leading-none text-amber-100 transition-colors duration-300 group-hover:text-amber-400"
              >
                "
              </span>
              <motion.img
                src={v.portrait}
                alt={v.alt}
                width={600}
                height={600}
                loading="lazy"
                className="h-16 w-16 rounded-full border-2 border-ink-900 object-cover"
                initial={reduced ? false : { scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 + i * 0.2 }}
              />
              <blockquote className="relative mt-5 font-editorial text-[20px] italic leading-[1.4] text-ink-900">
                {v.quote}
              </blockquote>
              <figcaption className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {v.attribution}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
