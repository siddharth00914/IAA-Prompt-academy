import { memo } from 'react';
import type { ReactNode } from 'react';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WingBadgeProps {
  name: string;
  earned: boolean;
  /** One-line "how earned" shown in the tooltip. */
  howEarned: string;
  /** ISO date earned (earned badges only). */
  date?: string | null;
  /** Center glyph — defaults to a plane. */
  glyph?: ReactNode;
  /** Pixel width (height follows the 128×96 viewBox). */
  size?: number;
  className?: string;
}

const HEX = 'M64 20 L85 34 L85 62 L64 76 L43 62 L43 34 Z';

/**
 * WingBadge (design.md §6): winged hexagon. Locked = fog outline; earned =
 * amber fill + micro shine sweep. Hover/focus tooltip: name + how earned + date.
 */
function WingBadgeBase({ name, earned, howEarned, date, glyph, size = 96, className }: WingBadgeProps) {
  const stroke = earned ? '#211E17' : '#A9A294';
  const glyphColor = earned ? '#211E17' : '#A9A294';
  return (
    <div
      className={cn('group relative inline-block', className)}
      tabIndex={0}
      role="img"
      aria-label={`${name} wing — ${earned ? 'earned' : 'locked'}. ${howEarned}`}
    >
      <svg
        viewBox="0 0 128 96"
        width={size}
        height={(size * 96) / 128}
        fill="none"
        aria-hidden
      >
        {/* wings */}
        <g stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <path d="M43 40 L16 30" />
          <path d="M43 49 L12 47" />
          <path d="M43 58 L18 66" />
          <path d="M85 40 L112 30" />
          <path d="M85 49 L116 47" />
          <path d="M85 58 L110 66" />
        </g>
        {/* hexagon */}
        <path
          d={HEX}
          fill={earned ? '#E09112' : 'none'}
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* micro shine sweep (earned only) */}
        {earned ? (
          <>
            <clipPath id={`wing-clip-${name.replace(/\W+/g, '-')}`}>
              <path d={HEX} />
            </clipPath>
            <g clipPath={`url(#wing-clip-${name.replace(/\W+/g, '-')})`}>
              <rect
                x="30"
                y="10"
                width="14"
                height="80"
                fill="rgba(255,255,255,0.35)"
                className="wing-shine motion-reduce:hidden"
              />
            </g>
          </>
        ) : null}
        {/* center glyph */}
        <g transform="translate(52,36)" color={glyphColor}>
          {glyph ?? <Plane size={24} strokeWidth={1.5} />}
        </g>
      </svg>
      {/* tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-52 -translate-x-1/2 translate-y-1 rounded-[2px] border border-tarmac-700 bg-tarmac-900 p-3 opacity-0 shadow-modal transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <p className="small font-bold text-fog-100">{name}</p>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-fog-500">{howEarned}</p>
        {earned && date ? (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-glow-amber">
            EARNED {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        ) : (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-fog-500">
            {earned ? 'EARNED' : 'LOCKED'}
          </p>
        )}
      </div>
    </div>
  );
}

const WingBadge = memo(WingBadgeBase);
export default WingBadge;
