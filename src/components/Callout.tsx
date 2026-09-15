import type { ReactNode } from 'react';
import { OctagonAlert, RadioTower } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalloutProps {
  /** tower = Tower Advisory (tips); hold-short = Hold Short (warnings/safety). */
  variant: 'tower' | 'hold-short';
  /** Override the default mono label. */
  label?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Callout (design.md §6): Tower Advisory (amber-100, tower icon) for tips,
 * Hold Short (signal-100, octagon icon) for warnings/safety. Mono label + body.
 */
export default function Callout({ variant, label, title, children, className }: CalloutProps) {
  const isTower = variant === 'tower';
  const Icon = isTower ? RadioTower : OctagonAlert;
  return (
    <aside
      className={cn(
        'rounded-[6px] border p-5',
        isTower ? 'border-amber-500/40 bg-amber-100' : 'border-signal-500/40 bg-signal-100',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn('h-4 w-4', isTower ? 'text-amber-600' : 'text-signal-600')}
          strokeWidth={1.5}
          aria-hidden
        />
        <span className={cn('label', isTower ? 'text-amber-600' : 'text-signal-600')}>
          {label ?? (isTower ? 'TOWER ADVISORY' : 'HOLD SHORT')}
        </span>
      </div>
      {title ? <p className="body-strong mt-3 text-ink-900">{title}</p> : null}
      <div className="small mt-2 text-ink-700 [&>p]:mt-1">{children}</div>
    </aside>
  );
}
