import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TaxiwayLoaderProps {
  /** Mono label shown to the right of the dots. */
  label?: string;
  className?: string;
  dots?: number;
  /** Dot color — amber on Day Ops, glow-amber inside Night Ops panels. */
  tone?: 'day' | 'night';
}

/**
 * Taxiway-blink loading row (design.md §5.2.6). Centerline dots pulse in
 * sequence, 120ms stagger, amber. Used for ALL async states — never a
 * generic spinner.
 */
function TaxiwayLoaderBase({ label, className, dots = 5, tone = 'day' }: TaxiwayLoaderProps) {
  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <div className="relative flex items-center gap-2 px-1 py-1">
        <span
          aria-hidden
          className={cn(
            'absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed',
            tone === 'day' ? 'border-ink-300/50' : 'border-tarmac-700',
          )}
        />
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              'relative h-2 w-2 rounded-full animate-taxiway-blink motion-reduce:animate-none',
              tone === 'day' ? 'bg-amber-500' : 'bg-glow-amber',
            )}
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      {label ? (
        <span className={cn('label', tone === 'day' ? 'text-ink-500' : 'text-fog-500')}>
          {label}
        </span>
      ) : null}
    </div>
  );
}

const TaxiwayLoader = memo(TaxiwayLoaderBase);
export default TaxiwayLoader;
