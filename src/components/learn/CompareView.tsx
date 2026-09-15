import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MoveHorizontal } from 'lucide-react';
import type { CompareBlock } from '@/content/types';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

/**
 * Compare block (lesson.md §3.4): before/after slider — drag the handle to
 * reveal the strong output over the weak one. Entrance wipes both sides in,
 * then the handle pulses as a drag hint.
 */
export default function CompareView({ block }: { block: CompareBlock }) {
  const reduced = prefersReducedMotion();
  const [pos, setPos] = useState(50); // % of width covered by the strong layer
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const move = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, pct)));
  };

  return (
    <div>
      {block.title ? <p className="label mb-3 text-ink-500">{block.title}</p> : null}
      <div className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card">
        <div
          ref={trackRef}
          className="relative cursor-ew-resize select-none"
          onPointerDown={(e) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e.clientX);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) move(e.clientX);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          role="slider"
          aria-label="Reveal strong output over weak output"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(4, p - 5));
            if (e.key === 'ArrowRight') setPos((p) => Math.min(96, p + 5));
          }}
        >
          {/* weak layer (base) */}
          <motion.div
            className="bg-paper-dim p-5"
            initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
            whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="label inline-block rounded-[2px] border border-signal-500/60 bg-signal-100 px-2 py-0.5 text-signal-600">
              WEAK
            </span>
            <p className="prompt-text mt-3 whitespace-pre-wrap text-ink-700">{block.weak}</p>
          </motion.div>

          {/* strong layer (clipped) */}
          <motion.div
            className="absolute inset-0 bg-field-100 p-5"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="label inline-block rounded-[2px] border border-field-500/60 bg-paper-bright px-2 py-0.5 text-field-600">
              STRONG
            </span>
            <p className="prompt-text mt-3 whitespace-pre-wrap text-ink-900">{block.strong}</p>
          </motion.div>

          {/* handle */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 z-10 w-[3px] bg-ink-900"
            style={{ left: `calc(${pos}% - 1.5px)` }}
            animate={reduced ? undefined : { x: [0, 8, 0, -8, 0] }}
            transition={{ duration: 1.4, delay: 1, times: [0, 0.25, 0.5, 0.75, 1] }}
          >
            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-[2px] border-2 border-ink-900 bg-amber-500 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-900">
              <MoveHorizontal className="h-3 w-3" strokeWidth={2} />
              WEAK ↔ STRONG
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
