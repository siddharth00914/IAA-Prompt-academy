/**
 * Dashboard curriculum summary + derived journey state.
 *
 * Static course config mirrors module.md §7 (6 gates × 4 legs); completion
 * overlays come from the progress store (design.md §10). All dashboard
 * sections read from the single `computeJourney()` derivation.
 */
import type { Progress } from '@/lib/progress';
import { PASS_SCORE } from '@/lib/progress';

// ── Static course config ─────────────────────────────────────────────────────

export interface LegMeta {
  /** Route-safe id, matches lesson pages ("0.1"…"5.4"). */
  id: string;
  title: string;
  /** One-line "why" for the Now Boarding card. */
  teaser: string;
  durationMin: number;
}

export interface GateMeta {
  id: string;
  index: number;
  number: string;
  title: string;
  subtitle: string;
  approxMinutes: number;
  checkTitle: string;
  checkQuestions: number;
  legs: LegMeta[];
}

export const GATES: GateMeta[] = [
  {
    id: 'g0',
    index: 0,
    number: 'G0',
    title: 'Welcome Aboard',
    subtitle: 'What prompt engineering is — and why wording changes everything',
    approxMinutes: 25,
    checkTitle: 'Gate Check 0',
    checkQuestions: 4,
    legs: [
      { id: '0.1', title: 'Meet the Machine Under the Jetway', teaser: 'What an LLM actually does: predicts the next word, remarkably well.', durationMin: 6 },
      { id: '0.2', title: 'The Anatomy of a Prompt', teaser: 'The cargo blocks every well-loaded prompt carries.', durationMin: 7 },
      { id: '0.3', title: 'Weak Prompt, Strong Prompt', teaser: 'Same request, two prompts — watch the outputs diverge.', durationMin: 6 },
      { id: '0.4', title: 'Zero-Shot, Few-Shot & the Fragility Factor', teaser: 'Why examples help, and why wording is a precision skill.', durationMin: 6 },
    ],
  },
  {
    id: 'g1',
    index: 1,
    number: 'G1',
    title: 'Clearance for Takeoff',
    subtitle: 'Clear, specific instructions, delimiters, and output formats',
    approxMinutes: 30,
    checkTitle: 'Gate Check 1 — Clearance Exam',
    checkQuestions: 5,
    legs: [
      { id: '1.1', title: 'Say What You Mean', teaser: 'One task, one verb. Vague asks wander the airfield.', durationMin: 7 },
      { id: '1.2', title: 'Delimiters: The Luggage Tags of Prompting', teaser: 'Keep instructions and source text in separate containers.', durationMin: 6 },
      { id: '1.3', title: 'Specify the Output', teaser: 'Format and length — the arrival gate for every prompt.', durationMin: 6 },
      { id: '1.4', title: 'Instructions Over Constraints', teaser: '"Answer in 3 sentences" beats "don\'t be verbose."', durationMin: 5 },
    ],
  },
  {
    id: 'g2',
    index: 2,
    number: 'G2',
    title: 'Flight Crew Roles',
    subtitle: 'Personas, audience, context, and grounding',
    approxMinutes: 30,
    checkTitle: 'Gate Check 2',
    checkQuestions: 5,
    legs: [
      { id: '2.1', title: 'Act As: The Persona Pattern', teaser: 'One gate change, three roles, three very different announcements.', durationMin: 8 },
      { id: '2.2', title: 'Audience & Context: Who\u2019s Listening?', teaser: 'Who, what, why, where — watch the output re-tailor.', durationMin: 7 },
      { id: '2.3', title: 'Grounding: Answer Using Only This', teaser: 'The single most effective anti-hallucination move.', durationMin: 7 },
      { id: '2.4', title: 'Flipped Interaction', teaser: 'Make the AI interview you before it drafts.', durationMin: 8 },
    ],
  },
  {
    id: 'g3',
    index: 3,
    number: 'G3',
    title: 'Navigation by Examples',
    subtitle: 'Few-shot examples and step-by-step reasoning',
    approxMinutes: 30,
    checkTitle: 'Gate Check 3',
    checkQuestions: 5,
    legs: [
      { id: '3.1', title: 'Show, Don\u2019t Just Tell', teaser: 'Build exemplars that teach the pattern you want.', durationMin: 8 },
      { id: '3.2', title: 'Let\u2019s Think Step by Step', teaser: 'Watch chain-of-thought reason across four visible steps.', durationMin: 8 },
      { id: '3.3', title: 'Step Back, Then Solve', teaser: 'General principle first, better specific answer second.', durationMin: 7 },
      { id: '3.4', title: 'Reasoning or Overkill?', teaser: 'Sort six tasks: just ask, or think it through.', durationMin: 7 },
    ],
  },
  {
    id: 'g4',
    index: 4,
    number: 'G4',
    title: 'On the Job at IND',
    subtitle: 'Summarize, infer, transform, expand — and the iterate loop',
    approxMinutes: 35,
    checkTitle: 'Gate Check 4',
    checkQuestions: 5,
    legs: [
      { id: '4.1', title: 'Summarize & Infer', teaser: 'A two-page storm report becomes five bullets with a word cap.', durationMin: 9 },
      { id: '4.2', title: 'Transform & Expand', teaser: 'Radio log to public statement; one line to a full tenant email.', durationMin: 9 },
      { id: '4.3', title: 'Prompt Chaining: The Jet Bridge Method', teaser: 'Outline \u2192 draft \u2192 fact-check, improving at each hop.', durationMin: 9 },
      { id: '4.4', title: 'The Iterate Loop', teaser: 'Refinement rounds, side by side — pick the best revision.', durationMin: 8 },
    ],
  },
  {
    id: 'g5',
    index: 5,
    number: 'G5',
    title: 'Safety & Security of AI',
    subtitle: 'Hallucinations, SSI red lines, human-in-charge + capstone',
    approxMinutes: 46,
    checkTitle: 'Gate Check 5 — Final Check',
    checkQuestions: 6,
    legs: [
      { id: '5.1', title: 'Confidently Wrong', teaser: 'Hallucinations, and the court cases that made them famous.', durationMin: 10 },
      { id: '5.2', title: 'The Never-Transmit List', teaser: 'Ten items: cleared, or hold short.', durationMin: 10 },
      { id: '5.3', title: 'Human in the Left Seat', teaser: 'The 10 IAA rules — AI is never the authority.', durationMin: 10 },
      { id: '5.4', title: 'Prompt Injection: Hostile Text in the Hold', teaser: 'Instructions smuggled inside pasted data — and the five fences.', durationMin: 6 },
      { id: '5.5', title: 'Final Approach: Capstone', teaser: 'Three chained lab scenarios, the pledge, the final check.', durationMin: 10 },
    ],
  },
];

export const TOTAL_LEGS = GATES.reduce((n, g) => n + g.legs.length, 0); // 25
export const TOTAL_CHECKS = GATES.length; // 6

// ── Wings rack config (dashboard.md §S5) ─────────────────────────────────────

export interface WingMeta {
  id: string;
  name: string;
  /** Locked-state mono caption: how to earn. */
  condition: string;
}

export const WINGS_RACK: WingMeta[] = [
  { id: 'delimiters-ace', name: 'Delimiters Ace', condition: 'SCORE \u2265 90% ON GATE CHECK 1' },
  { id: 'persona-pilot', name: 'Persona Pilot', condition: 'SCORE ≥ 90% ON GATE CHECK 2' },
  { id: 'cot-navigator', name: 'CoT Navigator', condition: 'SCORE ≥ 90% ON GATE CHECK 3' },
  { id: 'safety-sentinel', name: 'Safety Sentinel', condition: 'SIGN THE IAA PROMPT PLEDGE' },
  { id: 'gold-prompt', name: 'Gold Prompt', condition: 'SCORE \u2265 90 ON ANY PROMPT LAB SCENARIO' },
];

// ── Derived journey state ────────────────────────────────────────────────────

export type GateStatus = 'locked' | 'mastered' | 'in-progress' | 'boarding' | 'not-started';

export interface GateState extends GateMeta {
  unlocked: boolean;
  mastered: boolean;
  checkScore: number | null;
  checkAttempts: number;
  legsDone: number;
  legDone: boolean[];
  status: GateStatus;
  /** (legs done + check passed) / 5 — for the per-gate jet-bridge bar. */
  pct: number;
}

export type NextUp =
  | { kind: 'leg'; gateIndex: number; legIndex: number; title: string; body: string; cta: string; href: string }
  | { kind: 'check'; gateIndex: number; title: string; body: string; cta: string; href: string }
  | { kind: 'lab'; title: string; body: string; cta: string; href: string }
  | { kind: 'certificate'; title: string; body: string; cta: string; href: string };

export interface JourneyState {
  gates: GateState[];
  miles: number;
  masteredCount: number;
  /** Course-wide % — (legs done + checks passed) / 30, per dashboard.md §S2. */
  coursePct: number;
  /** Remaining-leg minutes (ETA = remaining legs × avg duration). */
  etaMinutes: number;
  nextUp: NextUp;
  /** Map position: 0–5 gate node, 6 = arrival star. */
  positionIndex: number;
  /** POS readout bits. */
  posGate: number;
  posLabel: string;
  labCleared: number;
  labTotal: number;
  labBest: number | null;
  certified: boolean;
  started: boolean;
}

export function formatEta(minutes: number): string {
  if (minutes <= 0) return '0M';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}H ${String(m).padStart(2, '0')}M` : `${m}M`;
}

export function computeJourney(progress: Progress): JourneyState {
  const gates: GateState[] = GATES.map((meta, i) => {
    const gp = progress.gates[meta.id];
    const legDone = meta.legs.map((l) => gp?.legs?.[l.id] === 'done');
    const legsDone = legDone.filter(Boolean).length;
    const checkScore = gp?.checkScore ?? null;
    const checkAttempts = gp?.checkAttempts ?? 0;
    const mastered = (checkScore ?? 0) >= PASS_SCORE;
    const unlocked =
      i === 0 || (progress.gates[GATES[i - 1].id]?.checkScore ?? 0) >= PASS_SCORE;
    const touched = legsDone > 0 || checkAttempts > 0;
    const status: GateStatus = !unlocked
      ? 'locked'
      : mastered
        ? 'mastered'
        : touched
          ? 'in-progress'
          : 'not-started';
    return {
      ...meta,
      unlocked,
      mastered,
      checkScore,
      checkAttempts,
      legsDone,
      legDone,
      status,
      pct: (legsDone + (mastered ? 1 : 0)) / (meta.legs.length + 1),
    };
  });

  const masteredCount = gates.filter((g) => g.mastered).length;
  const legsDoneTotal = gates.reduce((n, g) => n + g.legsDone, 0);
  const coursePct = (legsDoneTotal + masteredCount) / (TOTAL_LEGS + TOTAL_CHECKS);

  const etaMinutes = gates.reduce(
    (sum, g) =>
      sum + g.legs.reduce((s, _l, j) => s + (g.legDone[j] ? 0 : g.legs[j].durationMin), 0),
    0,
  );

  const certified = progress.certifiedAt !== null;
  const capstoneDone = ['WTP-L10', 'WTP-L11', 'WTP-L12'].every(
    (id) => (progress.lab[id]?.attempts ?? 0) >= 1,
  );

  // "Started" = actual learning activity — NOT miles, since the +10 welcome
  // check-in would otherwise flip a first-time learner to IN FLIGHT
  // (dashboard.md: first visit → boarding pass shows STATUS: CHECKED IN).
  const hasActivity =
    legsDoneTotal > 0 ||
    gates.some((g) => g.checkAttempts > 0) ||
    Object.values(progress.lab).some((e) => e.attempts > 0) ||
    progress.pledgeSigned;

  // Next-up: first undone leg → gate check → capstone lab → certificate.
  let nextUp: NextUp | null = null;
  let positionIndex = 0;
  let posGate = 0;
  let posLabel = 'LEG 1';

  for (const g of gates) {
    if (!g.unlocked) break;
    const legIdx = g.legDone.findIndex((d) => !d);
    if (legIdx !== -1) {
      const leg = g.legs[legIdx];
      const resume = hasActivity;
      nextUp = {
        kind: 'leg',
        gateIndex: g.index,
        legIndex: legIdx,
        title: `Gate ${g.index}, Leg ${legIdx + 1} — ${leg.title}`,
        body: `${leg.teaser} ${leg.durationMin} minutes.`,
        cta: resume ? 'Resume leg' : 'Start leg',
        href: `/gates/${g.id}/legs/${leg.id}`,
      };
      positionIndex = g.index;
      posGate = g.index;
      posLabel = `LEG ${legIdx + 1}`;
      break;
    }
    if (!g.mastered) {
      const attempted = g.checkAttempts > 0;
      nextUp = {
        kind: 'check',
        gateIndex: g.index,
        title: g.checkTitle,
        body: `${g.checkQuestions} questions · score \u2265 80% to clear ${g.index < 5 ? `Gate ${g.index + 1}` : 'final approach'}${attempted ? ` · best so far ${g.checkScore}%` : ''}.`,
        cta: attempted ? 'Retake the check' : 'Take the gate check',
        href: `/gates/${g.id}/check`,
      };
      positionIndex = g.index;
      posGate = g.index;
      posLabel = 'CHECK';
      break;
    }
  }

  if (!nextUp) {
    posGate = 5;
    if (!capstoneDone) {
      nextUp = {
        kind: 'lab',
        title: 'Final approach — the capstone chain',
        body: 'All checks cleared. File the three chained capstone scenarios in the Prompt Lab to earn arrival.',
        cta: 'Open the capstone chain',
        href: '/lab',
      };
      positionIndex = 5;
      posLabel = 'CAPSTONE';
    } else if (!certified) {
      nextUp = {
        kind: 'certificate',
        title: 'Cleared for arrival',
        body: 'Everything is stamped and signed. Your certificate is waiting on the jet bridge.',
        cta: 'Claim your certificate',
        href: '/arrival',
      };
      positionIndex = 6;
      posLabel = 'ARRIVAL';
    } else {
      nextUp = {
        kind: 'certificate',
        title: 'Final approach complete.',
        body: 'You\u2019re a Certified Prompt Professional. The route stays open — review is always free.',
        cta: 'View your certificate',
        href: '/arrival',
      };
      positionIndex = 6;
      posLabel = 'ARRIVED';
    }
  }

  // BOARDING flags the next-up gate only when it is still untouched. A gate
  // the learner is mid-way through shows IN PROGRESS, and untouched gates
  // past it stay NOT STARTED — one amber "active" chip at a time.
  if (nextUp.kind === 'leg' || nextUp.kind === 'check') {
    const boarding = gates[nextUp.gateIndex];
    if (boarding.status === 'not-started') boarding.status = 'boarding';
  }

  const labEntries = Object.values(progress.lab);
  const labCleared = labEntries.filter((e) => e.attempts >= 1).length;
  const labBest = labEntries.length
    ? Math.max(...labEntries.map((e) => e.bestScore), 0)
    : null;

  return {
    gates,
    miles: progress.miles,
    masteredCount,
    coursePct,
    etaMinutes,
    nextUp,
    positionIndex,
    posGate,
    posLabel,
    labCleared,
    labTotal: 12,
    labBest,
    certified,
    started: hasActivity,
  };
}
