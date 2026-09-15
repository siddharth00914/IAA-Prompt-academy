import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Copy, GraduationCap } from 'lucide-react';
import { useToast } from '@/components/Toast';
import type { ManualCard } from '@/data/manual';
import { CATEGORY_META } from '@/data/manual';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { cn } from '@/lib/utils';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props {
  card: ManualCard;
  expanded: boolean;
  onToggle: () => void;
  /** Jump to a related card by code. */
  onRelated: (code: string) => void;
}

/** One reference card (glossary.md §S2): hover lift + amber edge, expand in
 * place, copy-able template with toast. */
export default function ManualCardItem({ card, expanded, onToggle, onRelated }: Props) {
  const reduced = prefersReducedMotion();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const meta = CATEGORY_META[card.category];

  const copyTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(card.template);
      setCopied(true);
      showToast('RAMP:', `${card.code} template copied.`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast('RAMP:', 'Copy blocked — select the text manually.');
    }
  };

  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[6px] border bg-paper-bright p-6 shadow-card transition-colors',
        expanded ? 'border-amber-500/70' : 'border-line',
      )}
    >
      {/* amber edge draw on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-amber-500 transition-transform duration-200 group-hover:scale-x-100"
      />

      {/* header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-[2px] border border-ink-900/20 bg-paper px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-ink-900">
          {card.code}
        </span>
        <span
          className={cn(
            'rounded-[2px] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]',
            meta.tagClass,
          )}
        >
          {meta.label}
        </span>
      </div>

      <h4 className="h4 mt-3 text-ink-900">{card.title}</h4>
      <p className="small mt-1.5 flex-1 text-ink-700">{card.blurb}</p>

      {/* actions */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 font-sans text-[14px] font-bold text-amber-600 transition-colors hover:text-ink-900"
        >
          {expanded ? 'Close card' : 'Open card'}{' '}
          <ArrowRight
            className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-90')}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={copyTemplate}
          aria-label={`Copy ${card.code} template`}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-[2px] border transition-all',
            copied
              ? 'border-field-500 bg-field-100 text-field-600 opacity-100'
              : 'border-line text-ink-500 opacity-0 hover:border-amber-500 hover:text-amber-600 focus-visible:opacity-100 group-hover:opacity-100',
          )}
        >
          {copied ? (
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>

      {/* expanded accordion */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: EASE_EXPO }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-5 border-t border-line pt-5">
              <div>
                <p className="label text-[10px] text-ink-500">WHAT IT IS</p>
                <p className="small mt-1.5 text-ink-700">{card.blurb}</p>
              </div>
              <div>
                <p className="label text-[10px] text-ink-500">WHEN TO USE IT</p>
                <ul className="mt-1.5 space-y-1">
                  {card.whenToUse.map((w, i) => (
                    <li key={i} className="small flex items-start gap-2 text-ink-700">
                      <span aria-hidden className="mt-[7px] h-1 w-3 shrink-0 bg-amber-500" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="label text-[10px] text-ink-500">TEMPLATE</p>
                  <button
                    type="button"
                    onClick={copyTemplate}
                    className="inline-flex items-center gap-1 rounded-[2px] border border-line px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500 transition-colors hover:border-amber-500 hover:text-amber-600"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" strokeWidth={2} aria-hidden />
                    ) : (
                      <Copy className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                    )}
                    Copy
                  </button>
                </div>
                <pre className="prompt-text mt-1.5 whitespace-pre-wrap rounded-[4px] bg-paper-dim p-3 text-[13px] text-ink-900">
                  {card.template}
                </pre>
              </div>
              <div>
                <p className="label text-[10px] text-ink-500">AIRPORT EXAMPLE</p>
                <p className="small mt-1.5 border-l-2 border-amber-500 pl-3 text-ink-700">
                  {card.example}
                </p>
              </div>
              {card.altFrameworks ? (
                <div>
                  <p className="label text-[10px] text-ink-500">RELATED CHECKLISTS</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {card.altFrameworks.map((f) => (
                      <li key={f.name} className="small text-ink-700">
                        <span className="font-mono text-[12px] font-semibold text-ink-900">
                          {f.name}
                        </span>{' '}
                        — {f.letters} · {f.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="label text-[10px] text-ink-500">RELATED</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {card.related.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onRelated(code)}
                      className="rounded-[2px] border border-line px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-700 transition-colors hover:border-amber-500 hover:text-amber-600"
                    >
                      {code}
                    </button>
                  ))}
                  {card.taughtIn ? (
                    <Link
                      to={card.taughtIn.to}
                      className="inline-flex items-center gap-1 rounded-[2px] border border-ink-900/30 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-900 transition-colors hover:border-amber-500 hover:text-amber-600"
                    >
                      <GraduationCap className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                      {card.taughtIn.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
