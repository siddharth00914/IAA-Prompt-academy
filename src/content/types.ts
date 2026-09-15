/**
 * IAA Prompt Academy — content model types.
 * Matches the structures specified in module.md (curriculum map), lesson.md
 * (block library), quiz.md (question bank) and promptlab.md (scenarios +
 * feedback engine). Content files under src/content/ are authored by page
 * agents against these interfaces.
 */

// ── Gates & curriculum (module.md §7) ────────────────────────────────────────

export type GateIdString = 'g0' | 'g1' | 'g2' | 'g3' | 'g4' | 'g5';

export type LegType = 'LESSON' | 'DEMO' | 'DRILL' | 'CAPSTONE';

/** Per-gate accent assignment (module.md header note). */
export type GateAccent = 'slate' | 'amber' | 'field' | 'signal';

export interface GateCheckInfo {
  /** e.g. "Gate Check 1 — Clearance Exam" */
  title: string;
  questionCount: number;
  /** Always 80 per design (pass ≥ 80%). */
  passScore: number;
  /** Wing earned above this score, if any (e.g. ≥90 on Check 1 → Delimiters Ace). */
  wingThreshold?: number;
  wingId?: string;
}

export interface Gate {
  id: GateIdString;
  /** 0–5, also the boarding order basis. */
  index: number;
  /** Display number, e.g. "G1". */
  number: string;
  title: string;
  /** Destination-style one-liner. */
  subtitle: string;
  accent: GateAccent;
  /** "BOARDING ORDER n/6" */
  boardingOrder: number;
  approxMinutes: number;
  objectives: string[];
  legs: Leg[];
  check: GateCheckInfo;
  /** Related lab scenario IDs ("Practice what this gate teaches"). */
  labScenarioIds: string[];
}

// ── Lesson blocks (lesson.md §3 block library) ───────────────────────────────

export interface ProseBlock {
  type: 'prose';
  id: string;
  heading?: string;
  /** Paragraphs; inline `code` and **bold** markup supported by the renderer. */
  body: string[];
}

export interface SceneCaption {
  t0: number;
  t1: number;
  text: string;
}

export interface SceneSpec {
  id: string;
  /** DOM/SVG layer names rendered by the player. */
  layers: string[];
  /** Free-form keyframe notes consumed by the scene registry per lesson. */
  keyframes: Record<string, unknown>;
}

export interface SceneVideoBlock {
  type: 'sceneVideo';
  id: string;
  title: string;
  /** Seconds. */
  duration: number;
  scenes: SceneSpec[];
  captions: SceneCaption[];
  /** Optional static poster asset path (reduced-motion fallback). */
  poster?: string;
}

export interface TypeAndRespondBlock {
  type: 'typeAndRespond';
  id: string;
  label?: string;
  prompts: { label: string; text: string }[];
  responses: { label: string; text: string; annotations?: string[] }[];
  /** Enables the weak/strong segmented toggle. */
  variantToggle?: boolean;
  /** Diff chips that light up after the strong variant plays. */
  chips?: string[];
}

export interface CompareBlock {
  type: 'compare';
  id: string;
  title?: string;
  weak: string;
  strong: string;
}

export interface CalloutBlock {
  type: 'callout';
  id: string;
  variant: 'tower' | 'hold-short';
  title: string;
  body: string;
}

export interface KnowledgeCheckOption {
  text: string;
  correct: boolean;
  /** Elaborated feedback shown on selection (every option explains why). */
  feedback: string;
}

export interface KnowledgeCheckBlock {
  type: 'knowledgeCheck';
  id: string;
  question: string;
  options: KnowledgeCheckOption[];
}

export interface PromptBuilderPart {
  id: string;
  label: string;
  caption: string;
}

export interface PromptBuilderBlock {
  type: 'promptBuilder';
  id: string;
  title?: string;
  parts: PromptBuilderPart[];
  /** Mono preview assembled as parts are placed. */
  previewTemplate: string;
  cannedResponse: string;
}

export interface SortDrillCard {
  text: string;
  /** Index into `bins` — the correct assignment. */
  bin: 0 | 1;
  verdict: string;
}

export interface SortDrillBlock {
  type: 'sortDrill';
  id: string;
  title?: string;
  /** e.g. ['CLEARED', 'HOLD SHORT'] or ['JUST ASK', 'THINK IT THROUGH']. */
  bins: [string, string];
  cards: SortDrillCard[];
  recap: string;
}

export interface ChipToggleBlock {
  type: 'chipToggle';
  id: string;
  title?: string;
  chips: { label: string; output: string }[];
}

export interface StepReasoningBlock {
  type: 'stepReasoning';
  id: string;
  title?: string;
  steps: string[];
  conclusion: string;
  /** Weaker direct answer shown by the "hide reasoning" toggle. */
  directAnswer?: string;
}

export interface StatBlock {
  type: 'stat';
  id: string;
  value: number;
  suffix?: string;
  caption: string;
}

export interface QuoteBlock {
  type: 'quote';
  id: string;
  text: string;
  attribution: string;
}

export type LessonBlock =
  | ProseBlock
  | SceneVideoBlock
  | TypeAndRespondBlock
  | CompareBlock
  | CalloutBlock
  | KnowledgeCheckBlock
  | PromptBuilderBlock
  | SortDrillBlock
  | ChipToggleBlock
  | StepReasoningBlock
  | StatBlock
  | QuoteBlock;

// ── Legs (module.md §3 + lesson.md) ──────────────────────────────────────────

export interface Leg {
  /** Route-safe id, e.g. "1.2". */
  id: string;
  /** Display code, e.g. "LEG 1.2". */
  code: string;
  type: LegType;
  title: string;
  description: string;
  durationMin: number;
  blocks: LessonBlock[];
  /** Feeds the key-takeaways card in the lesson footer. */
  takeaways: string[];
}

// ── Gate Check quiz (quiz.md §4–5) ───────────────────────────────────────────

export interface QuizOption {
  text: string;
  correct: boolean;
  /** Why this option is right/wrong — always shown after answering. */
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  /** Short topic tag for the results breakdown, e.g. "Delimiters". */
  topic: string;
  question: string;
  /** Optional prompt snippet rendered in a mono block above the options. */
  promptSnippet?: string;
  /** Leg this question maps to, for "REVIEW: LEG 1.2" links and study plans. */
  legRef?: string;
  options: QuizOption[];
}

export interface GateCheckBank {
  gateId: GateIdString;
  questions: QuizQuestion[];
}

// ── Prompt Lab (promptlab.md §S1, §S4) ───────────────────────────────────────

export type LabFunction =
  | 'Operations'
  | 'Public Affairs'
  | 'Public Safety'
  | 'Maintenance'
  | 'Human Resources'
  | 'Finance'
  | 'Properties'
  | 'Terminal Services';

export type LabPersona = 'ops' | 'comms' | 'maint';

export interface Scenario {
  /** e.g. "WTP-L01". */
  id: string;
  title: string;
  fn: LabFunction;
  gateId: GateIdString;
  /** Task paragraph shown on the workspace brief. */
  brief: string;
  /** "YOU ARE:" line on the role card. */
  role: string;
  persona?: LabPersona;
  /** "GREAT LOOKS LIKE" checklist bullets. */
  greatLooksLike: string[];
  /** Canned source material on the data-excerpt card. */
  dataExcerpt: string;
  /** Shows the faux-sensitive HOLD SHORT mini-banner on the excerpt. */
  containsFauxSensitive?: boolean;
  capstone?: boolean;
  /** Position in the capstone chain (WTP-L10→L11→L12). */
  chainStep?: 1 | 2 | 3;
  /** HintLadder rungs. */
  hint: string;
  exampleFragment: string;
  goldPrompt: string;
  /** Scenario-templated length suggestion, e.g. "≤ 300 words". */
  suggestedLength?: string;
}

/** One rubric dimension of the rule-based feedback engine (promptlab.md §S4).
 * Weights across the 8 dimensions: 20/15/15/15/10/10/5/5 (max 100). */
export interface RubricDimension {
  id: string;
  name: string;
  /** Max points for this dimension. */
  max: number;
  /** Pre-written detector notes keyed by score band. */
  notes: {
    full: string;
    partial: string;
    zero: string;
  };
  /** Scenario-templated suggestion shown when this dimension is weak. */
  suggestion: string;
}

/** Scored result for one dimension — produced by the feedback engine. */
export interface RubricScore {
  dimensionId: string;
  earned: number;
  max: number;
  note: string;
}

/** Full debrief report for one lab submission. */
export interface DebriefReport {
  scenarioId: string;
  attempt: number;
  total: number;
  verdict: 'GOLD PROMPT' | 'CLEARED' | 'WORKABLE — REFINE' | 'RETURN TO RAMP';
  dimensions: RubricScore[];
  strengths: string[];
  nextAltitude: string[];
  /** True when the safety tripwire fired (score withheld, shown as Hold Short). */
  safetyHold?: boolean;
}
