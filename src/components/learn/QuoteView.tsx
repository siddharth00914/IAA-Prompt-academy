import type { QuoteBlock } from '@/content/types';

/** Quote block (lesson.md §3.12): Fraunces italic pull quote + mono attribution. */
export default function QuoteView({ block }: { block: QuoteBlock }) {
  return (
    <figure className="border-l-[3px] border-amber-500 pl-6">
      <blockquote className="editorial text-ink-900">&ldquo;{block.text}&rdquo;</blockquote>
      <figcaption className="label mt-4 text-ink-500">— {block.attribution}</figcaption>
    </figure>
  );
}
