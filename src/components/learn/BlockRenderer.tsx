import type { LessonBlock } from '@/content/types';
import Reveal from './Reveal';
import ProseView from './ProseView';
import SceneVideo from './SceneVideo';
import TypeAndRespondView from './TypeAndRespondView';
import CompareView from './CompareView';
import CalloutView from './CalloutView';
import KnowledgeCheckView from './KnowledgeCheckView';
import PromptBuilderView from './PromptBuilderView';
import SortDrillView from './SortDrillView';
import ChipToggleView from './ChipToggleView';
import StepReasoningView from './StepReasoningView';
import StatView from './StatView';
import QuoteView from './QuoteView';

/** Short title used by the "On this leg" right-rail outline (lesson.md §S1). */
// eslint-disable-next-line react-refresh/only-export-components -- outline helper is part of the block API
export function blockOutlineTitle(block: LessonBlock): string {
  switch (block.type) {
    case 'prose':
      return block.heading ?? 'Read';
    case 'sceneVideo':
      return block.title;
    case 'typeAndRespond':
      return block.label ?? 'Weak ↔ strong demo';
    case 'compare':
      return block.title ?? 'Compare the outputs';
    case 'callout':
      return block.title;
    case 'knowledgeCheck':
      return 'Knowledge check';
    case 'promptBuilder':
      return block.title ?? 'Prompt builder';
    case 'sortDrill':
      return block.title ?? 'Sort drill';
    case 'chipToggle':
      return block.title ?? 'Live demo';
    case 'stepReasoning':
      return block.title ?? 'Step by step';
    case 'stat':
      return 'By the numbers';
    case 'quote':
      return 'From the flight crew';
  }
}

function BlockBody({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'prose':
      return <ProseView block={block} />;
    case 'sceneVideo':
      // GSAP lives in an isolated, dedicated component (react-dev.md library
      // isolation) — no framer Reveal wrapper around it.
      return <SceneVideo block={block} />;
    case 'typeAndRespond':
      return <TypeAndRespondView block={block} />;
    case 'compare':
      return <CompareView block={block} />;
    case 'callout':
      return <CalloutView block={block} />;
    case 'knowledgeCheck':
      return <KnowledgeCheckView block={block} />;
    case 'promptBuilder':
      return <PromptBuilderView block={block} />;
    case 'sortDrill':
      return <SortDrillView block={block} />;
    case 'chipToggle':
      return <ChipToggleView block={block} />;
    case 'stepReasoning':
      return <StepReasoningView block={block} />;
    case 'stat':
      return <StatView block={block} />;
    case 'quote':
      return <QuoteView block={block} />;
  }
}

/**
 * Renders one lesson block inside its scrollspy anchor (`#block-<id>`) with
 * the standard entrance reveal (lesson.md §S1: 15% viewport offset).
 */
export default function BlockRenderer({ block }: { block: LessonBlock }) {
  return (
    <div id={`block-${block.id}`} className="scroll-mt-36">
      {block.type === 'sceneVideo' ? (
        <BlockBody block={block} />
      ) : (
        <Reveal>
          <BlockBody block={block} />
        </Reveal>
      )}
    </div>
  );
}
