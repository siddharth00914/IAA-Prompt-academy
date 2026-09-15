import { motion } from 'framer-motion';
import SplitFlap from '@/components/SplitFlap';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

interface ScoreDialProps {
  /** 0–100. */
  percent: number;
  /** Split-flap center text, e.g. "4/5 · 80%". */
  centerText: string;
  /** Arc color — amber on pass per design, red arc on fail keeps stakes legible. */
  passed: boolean;
}

const SIZE = 180;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/**
 * Score dial (quiz.md §S3): 180px SVG ring, `line` track, arc animates to the
 * percentage over 1.1s expo-out; center mono score revealed with split-flap at
 * 400ms. Reduced motion: arc renders at final value instantly (crossfade only).
 */
export default function ScoreDial({ percent, centerText, passed }: ScoreDialProps) {
  const reduced = prefersReducedMotion();
  const targetOffset = C * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const arcColor = passed ? '#E09112' : '#C24A3B';

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`Score: ${centerText}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#DCD4C3"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={arcColor}
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeDasharray={C}
          initial={{ strokeDashoffset: reduced ? targetOffset : C }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={reduced ? { duration: 0.01 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="label text-ink-500">SCORE</span>
        <SplitFlap
          text={centerText}
          startDelay={reduced ? 0 : 400}
          stagger={45}
          className="font-mono text-2xl font-semibold text-ink-900"
        />
      </div>
    </div>
  );
}
