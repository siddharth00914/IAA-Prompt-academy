import type { ProseBlock } from '@/content/types';
import { renderInline } from './inline';

/** Prose block (lesson.md §3.1): h3 subhead + paragraphs with inline markup. */
export default function ProseView({ block }: { block: ProseBlock }) {
  return (
    <div>
      {block.heading ? <h3 className="h3 text-ink-900">{block.heading}</h3> : null}
      <div className={block.heading ? 'mt-4 space-y-4' : 'space-y-4'}>
        {block.body.map((para, i) => (
          <p key={i} className="body text-ink-700">
            {renderInline(para)}
          </p>
        ))}
      </div>
    </div>
  );
}
