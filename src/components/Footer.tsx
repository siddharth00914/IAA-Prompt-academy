import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { GATES_NAV } from '@/components/Navbar';

const PROGRAM_LINKS = [
  { to: '/', label: 'About' },
  { to: '/manual', label: 'Flight Manual' },
  { to: '/safety', label: 'Safety' },
  { to: '/lab', label: 'Prompt Lab' },
] as const;

/**
 * Footer (design.md §6): Night Ops panel. Animated runway-centerline dashes
 * on top; Program / Gates columns; Winthrop-Tech credit; fine print.
 */
export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-tarmac-950 text-fog-300">
      <div className="grain-night" aria-hidden />
      {/* runway centerline dashes — crawl left→right, 60s linear loop */}
      <svg className="block h-3 w-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 1200 12">
        <line
          x1="0"
          y1="6"
          x2="1200"
          y2="6"
          stroke="#F2A93B"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeDasharray="24 24"
          className="animate-dash-crawl motion-reduce:animate-none"
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto grid max-w-[1180px] gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]"
      >
        {/* brand */}
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo-iaa-academy.svg" alt="" className="h-9 w-9" />
            <div>
              <p className="font-sans text-[15px] font-extrabold leading-none text-fog-100">
                IAA PROMPT ACADEMY
              </p>
              <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-fog-500">
                Presented by Winthrop-Tech
              </p>
            </div>
          </div>
          <p className="small mt-4 max-w-[30ch] text-fog-500">
            Cleared to prompt. A hands-on flight school for AI, built for the people who run
            Indianapolis International.
          </p>
        </div>

        {/* Program */}
        <nav aria-label="Program">
          <p className="label text-fog-500">PROGRAM</p>
          <ul className="mt-4 space-y-2.5">
            {PROGRAM_LINKS.map((l) => (
              <li key={l.to + l.label}>
                <Link to={l.to} className="small font-semibold text-fog-300 transition-colors hover:text-glow-amber">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Gates */}
        <nav aria-label="Gates">
          <p className="label text-fog-500">GATES</p>
          <ul className="mt-4 space-y-2.5">
            {GATES_NAV.map((g) => (
              <li key={g.id}>
                <Link to={`/gates/${g.id}`} className="small transition-colors hover:text-glow-amber">
                  <span className="font-mono font-semibold text-glow-amber">{g.number}</span>{' '}
                  <span className="font-semibold text-fog-300">{g.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* credit */}
        <div>
          <p className="label text-fog-500">GROUND CREW</p>
          <p className="small mt-4 text-fog-300">
            Designed &amp; built by{' '}
            <a
              href="https://winthrop-tech.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-glow-amber underline decoration-glow-amber/40 underline-offset-4 transition-colors hover:text-amber-400"
            >
              Winthrop-Tech
            </a>{' '}
            — winthrop-tech.com
          </p>
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-fog-500">
            Internal training platform for Indianapolis Airport Authority staff.
          </p>
        </div>
      </motion.div>

      <div className="relative border-t border-tarmac-800">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-6 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
            © {new Date().getFullYear()} WINTHROP-TECH × INDIANAPOLIS AIRPORT AUTHORITY
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
            NO GRADES · NO LEADERBOARDS · JUST REPS
          </p>
        </div>
      </div>
    </footer>
  );
}
