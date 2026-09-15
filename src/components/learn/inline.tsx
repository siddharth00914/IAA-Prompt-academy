import type { ReactNode } from 'react';

/**
 * Inline markup renderer for lesson prose (lesson.md §3.1):
 *   **bold**            → strong (first-use terms get a dotted underline)
 *   *italic*            → em
 *   `code`              → mono chip on paper-dim
 *   [[term|definition]] → glossary term: dotted underline + tooltip
 * Applied to plain strings; returns React nodes.
 */
export function renderInline(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  // Order matters: glossary, code, bold, italic.
  const pattern = /\[\[([^\]|]+)\|([^\]]+)\]\]|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push(text.slice(last, m.index));
    }
    if (m[1] !== undefined) {
      tokens.push(
        <span
          key={key++}
          title={m[2]}
          className="cursor-help font-semibold text-ink-900 underline decoration-dotted decoration-amber-600 decoration-2 underline-offset-4"
        >
          {m[1]}
        </span>,
      );
    } else if (m[3] !== undefined) {
      tokens.push(
        <code
          key={key++}
          className="rounded-[2px] bg-paper-dim px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-ink-900"
        >
          {m[3]}
        </code>,
      );
    } else if (m[4] !== undefined) {
      tokens.push(
        <strong
          key={key++}
          className="font-bold text-ink-900 underline decoration-dotted decoration-ink-300 underline-offset-4"
        >
          {m[4]}
        </strong>,
      );
    } else if (m[5] !== undefined) {
      tokens.push(
        <em key={key++} className="italic">
          {m[5]}
        </em>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
}
