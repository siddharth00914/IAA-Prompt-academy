import type { TypeAndRespondBlock } from '@/content/types';
import TypeAndRespond from '@/components/TypeAndRespond';

/**
 * TypeAndRespond block adapter (lesson.md §3.3 → design.md §6 shared player).
 * Maps block prompts/responses onto the shared weak/strong demo player; the
 * first response annotation becomes the caption under the response pane.
 */
export default function TypeAndRespondView({ block }: { block: TypeAndRespondBlock }) {
  const [weakPrompt, strongPrompt] = [block.prompts[0], block.prompts[1] ?? block.prompts[0]];
  const [weakRes, strongRes] = [block.responses[0], block.responses[1] ?? block.responses[0]];
  return (
    <div>
      {block.label ? <p className="label mb-3 text-ink-500">{block.label}</p> : null}
      <TypeAndRespond
        weak={{
          prompt: weakPrompt.text,
          response: weakRes.text,
          caption: weakRes.annotations?.[0],
        }}
        strong={{
          prompt: strongPrompt.text,
          response: strongRes.text,
          caption: strongRes.annotations?.[0],
        }}
        chips={block.chips ?? []}
        autoPlay
        speedControl
      />
    </div>
  );
}
