import type { GateCheckBank, GateIdString } from '@/content/types';
import { g0 } from './g0';
import { g1 } from './g1';
import { g2 } from './g2';
import { g3 } from './g3';
import { g4 } from './g4';
import { g5 } from './g5';

/** All six Gate Check banks, keyed by gate id (quiz.md §S4–S6). */
export const QUIZ_BANKS: Record<GateIdString, GateCheckBank> = { g0, g1, g2, g3, g4, g5 };

export function getQuizBank(gateId: string | undefined): GateCheckBank | null {
  if (!gateId) return null;
  return QUIZ_BANKS[gateId.toLowerCase() as GateIdString] ?? null;
}

/** Display metadata for intro/results copy (titles per module.md §7). */
export interface QuizGateMeta {
  /** Display number, e.g. "G1". */
  number: string;
  /** Gate title, e.g. "Clearance for Takeoff". */
  title: string;
  /** Intro headline shown on the pre-check card. */
  introHeadline: string;
  /** What passing unlocks (for checklist + results copy). */
  unlockLabel: string;
  /** Next destination after a pass, if any. */
  next: { gateId: GateIdString; number: string; title: string } | null;
}

export const QUIZ_GATE_META: Record<GateIdString, QuizGateMeta> = {
  g0: {
    number: 'G0',
    title: 'Welcome Aboard',
    introHeadline: 'Before you taxi to Gate 1…',
    unlockLabel: 'unlocks Gate 1',
    next: { gateId: 'g1', number: 'G1', title: 'Clearance for Takeoff' },
  },
  g1: {
    number: 'G1',
    title: 'Clearance for Takeoff',
    introHeadline: 'Before you taxi to Gate 2…',
    unlockLabel: 'unlocks Gate 2',
    next: { gateId: 'g2', number: 'G2', title: 'Flight Crew Roles' },
  },
  g2: {
    number: 'G2',
    title: 'Flight Crew Roles',
    introHeadline: 'Before you taxi to Gate 3…',
    unlockLabel: 'unlocks Gate 3',
    next: { gateId: 'g3', number: 'G3', title: 'Navigation by Examples' },
  },
  g3: {
    number: 'G3',
    title: 'Navigation by Examples',
    introHeadline: 'Before you taxi to Gate 4…',
    unlockLabel: 'unlocks Gate 4',
    next: { gateId: 'g4', number: 'G4', title: 'On the Job at IND' },
  },
  g4: {
    number: 'G4',
    title: 'On the Job at IND',
    introHeadline: 'Before you taxi to Gate 5…',
    unlockLabel: 'unlocks Gate 5',
    next: { gateId: 'g5', number: 'G5', title: 'Safety & Security of AI' },
  },
  g5: {
    number: 'G5',
    title: 'Safety & Security of AI',
    introHeadline: 'One last checkride before final approach.',
    unlockLabel: 'unlocks the capstone & certificate path',
    next: null,
  },
};

/**
 * Leg titles per gate, keyed by legRef — used for "REVIEW: LEG 1.2 — …" links
 * and the post-3-attempts study plan (titles per module.md §7).
 */
export const QUIZ_LEG_TITLES: Record<GateIdString, Record<string, string>> = {
  g0: {
    '0.1': 'Meet the Machine Under the Jetway',
    '0.2': 'The Anatomy of a Prompt',
    '0.3': 'Weak Prompt, Strong Prompt',
    '0.4': 'Zero-Shot, Few-Shot & the Fragility Factor',
  },
  g1: {
    '1.1': 'Say What You Mean',
    '1.2': 'Delimiters: The Luggage Tags of Prompting',
    '1.3': 'Specify the Output',
    '1.4': 'Instructions Over Constraints',
  },
  g2: {
    '2.1': 'Act As: The Persona Pattern',
    '2.2': "Audience & Context: Who's Listening?",
    '2.3': 'Grounding: Answer Using Only This',
    '2.4': 'Flipped Interaction',
  },
  g3: {
    '3.1': "Show, Don't Just Tell",
    '3.2': "Let's Think Step by Step",
    '3.3': 'Step Back, Then Solve',
    '3.4': 'Reasoning or Overkill?',
  },
  g4: {
    '4.1': 'Summarize & Infer',
    '4.2': 'Transform & Expand',
    '4.3': 'Prompt Chaining: The Jet Bridge Method',
    '4.4': 'The Iterate Loop',
  },
  g5: {
    '5.1': 'Confidently Wrong',
    '5.2': 'The Never-Transmit List',
    '5.3': 'Human in the Left Seat',
    '5.4': 'Prompt Injection: Hostile Text in the Hold',
    '5.5': 'Final Approach: Capstone',
  },
};

export function legTitle(gateId: GateIdString, legRef: string | undefined): string | null {
  if (!legRef) return null;
  return QUIZ_LEG_TITLES[gateId]?.[legRef] ?? null;
}

export { g0, g1, g2, g3, g4, g5 };
