import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/smooth-scroll';

interface BoardingPassField {
  label: string;
  value: string;
}

interface BoardingPassCardProps {
  passenger: string;
  from: string;
  to: string;
  miles?: string | number;
  seat?: string;
  group?: string;
  /** Mono document code printed under the barcode. */
  code?: string;
  /** Extra mono data rows for the left panel. */
  fields?: BoardingPassField[];
  className?: string;
  /** Background color of the perforation notches — must match the section
   * background the pass sits on (default paper). */
  notchClassName?: string;
}

const BARCODE = [3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1, 2, 2, 1];

/**
 * BoardingPassCard (design.md §6): perforated ticket — left 70% passenger /
 * route / miles data in mono, right 30% stub with code-drawn barcode +
 * seat/group. Dashed perforation + notch cutouts; stub wiggles on hover
 * (perforation-tear, §5.2.8).
 */
export default function BoardingPassCard({
  passenger,
  from,
  to,
  miles,
  seat = '1A',
  group = 'NOW BOARDING',
  code = 'WTP-101',
  fields = [],
  className,
  notchClassName = 'bg-paper',
}: BoardingPassCardProps) {
  const reduced = prefersReducedMotion();
  const leftFields: BoardingPassField[] = [
    { label: 'PASSENGER', value: passenger },
    { label: 'FROM', value: from },
    { label: 'TO', value: to },
    ...fields,
    ...(miles !== undefined ? [{ label: 'MILES', value: String(miles) }] : []),
  ];

  return (
    <div
      className={cn(
        'relative flex overflow-hidden rounded-[6px] border border-line bg-paper-bright shadow-card',
        className,
      )}
    >
      {/* left panel — 70% */}
      <div className="min-w-0 flex-1 p-6 sm:p-8" style={{ flexBasis: '70%' }}>
        <div className="flex items-center gap-2">
          <img src="/logo-iaa-academy.svg" alt="" className="h-6 w-6" />
          <span className="label text-ink-500">IAA PROMPT ACADEMY · BOARDING PASS</span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {leftFields.map((f) => (
            <div key={f.label} className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {f.label}
              </p>
              <p className="mt-1 truncate font-mono text-[15px] font-semibold uppercase tracking-wide text-ink-900">
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* perforation notches */}
      <span
        aria-hidden
        className={cn(
          'absolute right-[30%] top-0 h-5 w-5 -translate-y-1/2 translate-x-1/2 rounded-full border border-line',
          notchClassName,
        )}
      />
      <span
        aria-hidden
        className={cn(
          'absolute bottom-0 right-[30%] h-5 w-5 translate-x-1/2 translate-y-1/2 rounded-full border border-line',
          notchClassName,
        )}
      />

      {/* stub — 30%, perforation-tear wiggle on hover */}
      <motion.div
        className="relative flex flex-col items-center justify-center gap-3 border-l-2 border-dashed border-ink-300 p-5"
        style={{ flexBasis: '30%' }}
        whileHover={reduced ? undefined : { x: 2, rotate: 0.6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        {/* barcode — bars draw in with 20ms stagger */}
        <svg viewBox="0 0 96 40" className="h-10 w-24" aria-hidden>
          {BARCODE.map((w, i) => (
            <motion.rect
              key={i}
              x={BARCODE.slice(0, i).reduce((a, b) => a + b, 0) + i}
              y={0}
              width={w}
              height={40}
              fill="#211E17"
              initial={reduced ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.02, duration: 0.25, ease: 'easeOut' }}
              style={{ originY: 1 }}
            />
          ))}
        </svg>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
          {code}
        </p>
        <div className="flex items-end gap-4">
          <div className="text-center">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              SEAT
            </p>
            <p className="font-sans text-2xl font-black leading-none text-ink-900">{seat}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              GROUP
            </p>
            <p className="font-mono text-[11px] font-semibold uppercase leading-6 text-amber-600">
              {group}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
