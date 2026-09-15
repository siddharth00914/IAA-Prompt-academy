/**
 * Wings rack (dashboard.md §S5) — five wing badges drawn in SVG (the
 * badge-*.svg assets don't exist; glyphs below follow design.md §9: winged
 * hexagon with badge-specific center glyph). Locked = outline + how-to-earn
 * caption; earned = amber fill + shine sweep + stamp-slam pop on first view
 * after earning. Hover tilt: rotateX 8° / rotateY −8° spring.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import WingBadge from '@/components/WingBadge';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { WINGS_RACK } from '@/components/dashboard/journey-data';
import type { Progress } from '@/lib/progress';

const SEEN_KEY = 'iaa-pa:wings-seen';

/** Center glyphs (24×24, stroke currentColor) per design.md §9 badge set. */
function Glyph({ id }: { id: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  switch (id) {
    case 'delimiters-ace':
      // triple backtick
      return (
        <svg {...common} aria-hidden>
          <path d="M7 4 L5 10 M13 4 L11 10 M19 4 L17 10" />
          <path d="M4 15 H20 M4 20 H20" />
        </svg>
      );
    case 'persona-pilot':
      // uniformed silhouette with epaulets
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="7.5" r="3.5" />
          <path d="M4.5 20 C5.5 15 8.5 13.5 12 13.5 C15.5 13.5 18.5 15 19.5 20" />
          <path d="M6.5 15.5 h3 M14.5 15.5 h3" />
        </svg>
      );
    case 'cot-navigator':
      // stepped reasoning path
      return (
        <svg {...common} aria-hidden>
          <path d="M3 19 H9 V13 H15 V7 H21" />
          <path d="M17.5 7 H21 V10.5" />
        </svg>
      );
    case 'safety-sentinel':
      // shield with check
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" />
          <path d="M9 11.5 l2.5 2.5 L15.5 9.5" />
        </svg>
      );
    case 'gold-prompt':
      // star + cursor
      return (
        <svg {...common} aria-hidden>
          <path d="M10 2.5 L11.2 7.8 L16.5 9 L11.2 10.2 L10 15.5 L8.8 10.2 L3.5 9 L8.8 7.8 Z" />
          <path d="M15 14 l6.5 2.2 -2.7 1 -1 2.7 Z" />
        </svg>
      );
    default:
      return null;
  }
}

function readSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export default function WingsRack({ progress }: { progress: Progress }) {
  const reduced = prefersReducedMotion();
  // Earned-but-not-yet-celebrated wings get the stamp-slam on first view.
  const [fresh] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const seen = new Set(readSeen());
    return new Set(progress.wings.filter((w) => !seen.has(w)));
  });

  useEffect(() => {
    if (typeof window === 'undefined' || progress.wings.length === 0) return;
    const seen = new Set(readSeen());
    progress.wings.forEach((w) => seen.add(w));
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    } catch {
      /* storage unavailable — slam replays next visit */
    }
    // only the rack's first view marks wings as seen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const earnedDate = (wingId: string): string | null => {
    const label = `WING EARNED: ${wingId.replace(/-/g, ' ').toUpperCase()}`;
    return progress.ledger.find((e) => e.label === label)?.at ?? null;
  };

  return (
    <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-10 sm:justify-between">
      {WINGS_RACK.map((wing, i) => {
        const earned = progress.wings.includes(wing.id);
        const slam = earned && fresh.has(wing.id) && !reduced;
        return (
          <div key={wing.id} className="flex w-[120px] flex-col items-center text-center">
            <div className="perspective-600">
              <motion.div
                initial={slam ? { scale: 1.6, opacity: 0, rotate: -8 } : false}
                whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.3,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: slam ? 0.15 + i * 0.08 : 0,
                }}
                whileHover={reduced ? undefined : { rotateX: 8, rotateY: -8 }}
              >
                <WingBadge
                  name={wing.name}
                  earned={earned}
                  howEarned={wing.condition}
                  date={earned ? earnedDate(wing.id) : null}
                  glyph={<Glyph id={wing.id} />}
                  size={120}
                />
              </motion.div>
            </div>
            <p className={cn('small mt-3 font-bold', earned ? 'text-ink-900' : 'text-ink-500')}>
              {wing.name}
            </p>
            <p className="mt-1 font-mono text-[10px] font-medium uppercase leading-relaxed tracking-[0.1em] text-ink-500">
              {earned ? 'EARNED' : `LOCKED — ${wing.condition}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
