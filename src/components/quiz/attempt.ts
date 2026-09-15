import type { GateCheckBank, QuizQuestion } from '@/content/types';

/**
 * One Gate Check attempt (quiz.md §S4): question order shuffles per attempt;
 * option order shuffles except "all of the above"-style items. Session state
 * persists to sessionStorage so navigating away mid-check offers a resume.
 */
export interface QuizAttempt {
  /** Question indices in presented (shuffled) order. */
  order: number[];
  /** Per presented position: option indices in displayed order. */
  optionOrders: number[][];
  /** Per presented position: chosen DISPLAY index, null = unanswered. */
  answers: (number | null)[];
  /** Current presented position. */
  current: number;
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ALL_OF_THE_ABOVE = /^all of the above/i;

/** Shuffle option indices, pinning "all of the above"-style options in place. */
function shuffleOptionIndices(question: QuizQuestion): number[] {
  const pinned = question.options
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => ALL_OF_THE_ABOVE.test(o.text.trim()));
  const free = question.options
    .map((_, i) => i)
    .filter((i) => !pinned.some((p) => p.i === i));
  const mixed = shuffled(free);
  // Re-insert pinned options at their original slots (typically last).
  const result: number[] = [];
  let pi = 0;
  for (let slot = 0; slot < question.options.length; slot += 1) {
    const pinnedHere = pinned.find((p) => p.i === slot);
    if (pinnedHere) result.push(pinnedHere.i);
    else {
      result.push(mixed[pi]);
      pi += 1;
    }
  }
  return result;
}

export function buildAttempt(bank: GateCheckBank): QuizAttempt {
  const order = shuffled(bank.questions.map((_, i) => i));
  return {
    order,
    optionOrders: order.map((qi) => shuffleOptionIndices(bank.questions[qi])),
    answers: bank.questions.map(() => null),
    current: 0,
  };
}

/** Correct option for a presented position, via the shuffled maps. */
export function isAnswerCorrect(bank: GateCheckBank, attempt: QuizAttempt, position: number): boolean {
  const chosen = attempt.answers[position];
  if (chosen === null) return false;
  const canonical = attempt.optionOrders[position][chosen];
  return bank.questions[attempt.order[position]].options[canonical]?.correct === true;
}

export function countCorrect(bank: GateCheckBank, attempt: QuizAttempt): number {
  return attempt.order.reduce<number>(
    (sum, _, pos) => sum + (isAnswerCorrect(bank, attempt, pos) ? 1 : 0),
    0,
  );
}

// ── Session persistence (quiz.md: answers persist with a resume prompt) ──────

function sessionKey(gateId: string): string {
  return `iaa-quiz:v1:session:${gateId}`;
}

export function saveAttemptSession(gateId: string, attempt: QuizAttempt): void {
  try {
    window.sessionStorage.setItem(sessionKey(gateId), JSON.stringify(attempt));
  } catch {
    // storage blocked — the check still works, just without resume
  }
}

/** Returns a stored attempt only if it is genuinely mid-check. */
export function loadAttemptSession(gateId: string, bank: GateCheckBank): QuizAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(sessionKey(gateId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizAttempt;
    const n = bank.questions.length;
    const validShape =
      Array.isArray(parsed.order) &&
      parsed.order.length === n &&
      Array.isArray(parsed.answers) &&
      parsed.answers.length === n &&
      Array.isArray(parsed.optionOrders) &&
      parsed.optionOrders.length === n &&
      typeof parsed.current === 'number' &&
      parsed.current >= 0 &&
      parsed.current < n;
    if (!validShape) return null;
    const anyAnswered = parsed.answers.some((a) => a !== null);
    const allAnswered = parsed.answers.every((a) => a !== null);
    if (!anyAnswered || allAnswered) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAttemptSession(gateId: string): void {
  try {
    window.sessionStorage.removeItem(sessionKey(gateId));
  } catch {
    // no-op
  }
}
