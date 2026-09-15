import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import ManualCardItem from '@/components/extras/manual/ManualCardItem';
import CheatSheetBand from '@/components/extras/manual/CheatSheetBand';
import SplitFlap from '@/components/SplitFlap';
import type { ManualCategory } from '@/data/manual';
import { CATEGORY_META, TOTAL_CARDS, searchCards } from '@/data/manual';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

type CategoryFilter = ManualCategory | 'all';

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'core', label: CATEGORY_META.core.label },
  { id: 'pattern', label: CATEGORY_META.pattern.label },
  { id: 'task', label: CATEGORY_META.task.label },
  { id: 'framework', label: CATEGORY_META.framework.label },
  { id: 'safety', label: CATEGORY_META.safety.label },
];

/** Code-drawn windsock for the no-results state. */
function Windsock() {
  return (
    <svg viewBox="0 0 120 96" className="mx-auto h-24 w-28" fill="none" aria-hidden>
      {/* pole */}
      <line x1="30" y1="8" x2="30" y2="88" stroke="#6E685B" strokeWidth="2" />
      <line x1="20" y1="88" x2="40" y2="88" stroke="#6E685B" strokeWidth="2" />
      {/* cone, drooping — no wind */}
      <path
        d="M30 12 C 50 14, 66 20, 78 30 C 86 37, 92 44, 96 52"
        stroke="#E09112"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <path
        d="M30 20 C 46 22, 58 27, 68 35 C 76 42, 82 48, 86 55"
        stroke="#E09112"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <path
        d="M30 12 L 30 20"
        stroke="#E09112"
        strokeWidth="2"
      />
      <path d="M96 52 L 86 55" stroke="#E09112" strokeWidth="2" />
      {/* ground shadow dashes */}
      <line x1="48" y1="88" x2="76" y2="88" stroke="#DCD4C3" strokeWidth="2" strokeDasharray="6 4" />
    </svg>
  );
}

/** Flight Manual (glossary.md): searchable catalog of 30 reference cards. */
export default function Manual() {
  const reduced = prefersReducedMotion();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = useMemo(() => searchCards(query, category), [query, category]);
  const filterKey = `${category}|${query.trim().toLowerCase()}`;

  const jumpToCard = (code: string) => {
    setCategory('all');
    setQuery(code);
    setExpanded(code);
  };

  return (
    <div className="bg-paper">
      <div className="manual-screen">
      {/* S1 — header */}
      <section className="mx-auto max-w-[1180px] px-6 pb-8 pt-16">
        <motion.div
          initial={reduced ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_EXPO }}
        >
          <p className="label text-amber-600">FLIGHT MANUAL</p>
          <h1 className="display-2 mt-4 text-ink-900">Every technique. On the card.</h1>
          <p className="body mt-4 max-w-[56ch] text-ink-700">
            The whole course distilled to reference cards. Search it, filter it, copy the
            template, get back to work. The manual stays in the cockpit.
          </p>
        </motion.div>
      </section>

      {/* S1 — sticky search row */}
      <div className="sticky top-16 z-40 border-y border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-6 py-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-[380px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "persona", "summarize", "CO-STAR"…'
              aria-label="Search the flight manual"
              className="w-full rounded-[2px] border border-line bg-paper-bright py-2 pl-9 pr-3 font-mono text-[13px] text-ink-900 placeholder:text-ink-300 focus:border-amber-500 focus:outline-none focus:shadow-glow-ring"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategory(f.id)}
                aria-pressed={category === f.id}
                className={cn(
                  'rounded-[2px] border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  category === f.id
                    ? 'border-ink-900 bg-ink-900 text-paper'
                    : 'border-line bg-paper-bright text-ink-500 hover:text-ink-900',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="data ml-auto text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <SplitFlap
              key={`${results.length}-${TOTAL_CARDS}`}
              text={`${results.length} OF ${TOTAL_CARDS} CARDS`}
              stagger={30}
            />
          </p>
        </div>
      </div>

      {/* S2 — card grid */}
      <section className="mx-auto max-w-[1180px] px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={filterKey}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.15 } }}
            className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {results.map((card, i) => (
              <motion.div
                key={card.code}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: EASE_EXPO,
                  delay: reduced ? 0 : Math.min(i * 0.06, 0.9),
                }}
              >
                <ManualCardItem
                  card={card}
                  expanded={expanded === card.code}
                  onToggle={() => setExpanded(expanded === card.code ? null : card.code)}
                  onRelated={jumpToCard}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* no-results state */}
        {results.length === 0 ? (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_EXPO }}
            className="py-16 text-center"
          >
            <Windsock />
            <p className="body-strong mt-6 text-ink-900">
              No technique by that callsign.
            </p>
            <p className="small mt-2 text-ink-500">
              Try “rewrite”, “examples”, or “tone” — or clear the search to see all{' '}
              {TOTAL_CARDS} cards.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
              className="btn-ghost mt-6 px-4 py-2 text-[14px]"
            >
              Clear the search
            </button>
          </motion.div>
        ) : null}
      </section>
      </div>

      {/* S4 — cheat sheet band (screen) + printable one-pager (print) */}
      <CheatSheetBand />
    </div>
  );
}
