/**
 * Scene registry (lesson.md §3.2): maps a sceneVideo block id to its stage.
 *
 * Contract:
 *  - `Stage` renders the scene's FINAL FRAME by default (used directly as the
 *    reduced-motion poster, the print frame, and the expand-dialog poster).
 *  - `build` sets initial (pre-roll) states on the stage DOM and adds tweens
 *    to the shared GSAP timeline at absolute second marks matching the
 *    block's caption beats. Transient elements (title cards, candidate
 *    panels) are hidden in the final frame and revealed mid-timeline.
 */
import type { ComponentType } from 'react';
import { AnatomyStage, buildAnatomy } from './AnatomyScene';
import { PredictionStage, buildPrediction } from './PredictionScene';

export interface SceneHandle {
  Stage: ComponentType;
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void;
}

export const SCENE_REGISTRY: Record<string, SceneHandle> = {
  'g0-1-prediction': { Stage: PredictionStage, build: buildPrediction },
  'g0-2-anatomy': { Stage: AnatomyStage, build: buildAnatomy },
};
