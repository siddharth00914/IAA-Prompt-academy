/**
 * IAA Prompt Academy — gate content registry (module.md §7 curriculum map).
 *
 * Contract: every gate file exports `export const gateN: Gate` (n = 0..5) —
 * the sibling G2–G5 content agent depends on that exact named-export shape.
 * G0 and G1 ship with fully-authored lesson blocks; G2–G5 currently export
 * complete metadata with empty `blocks` and `comingSoon: true` placeholders
 * that the sibling agent replaces wholesale.
 */
import type { Gate, GateAccent, Leg } from '@/content/types';
import { gate0 } from './g0';
import { gate1 } from './g1';
import { g2 as gate2 } from './g2';
import { g3 as gate3 } from './g3';
import { g4 as gate4 } from './g4';
import { g5 as gate5 } from './g5';

/** A gate as consumed by the app: the canonical Gate model plus optional
 * content-authoring extensions (kept out of types.ts so placeholders stay tiny). */
export type GateContent = Gate & {
  /** True while a gate's lesson blocks are still being authored. */
  comingSoon?: boolean;
  /** Display titles for related lab scenarios (module.md §S5 chips). */
  labHints?: { id: string; title: string }[];
};

export const GATES: GateContent[] = [gate0, gate1, gate2, gate3, gate4, gate5];

export function getGate(id: string | undefined): GateContent | undefined {
  return GATES.find((g) => g.id === id);
}

export function getLeg(gateId: string | undefined, legId: string | undefined): Leg | undefined {
  return getGate(gateId)?.legs.find((l) => l.id === legId);
}

export function getLegIndex(gate: GateContent, legId: string): number {
  return gate.legs.findIndex((l) => l.id === legId);
}

// ── Per-gate accent (module.md header note) ──────────────────────────────────
// G0 slate-500 · G1 amber-500 · G2 field-500 · G3 slate-600 · G4 amber-600 ·
// G5 signal-500. Mapped here to Tailwind classes so pages stay accent-driven.

export const ACCENT_TEXT: Record<GateAccent, string> = {
  slate: 'text-slate-600',
  amber: 'text-amber-600',
  field: 'text-field-600',
  signal: 'text-signal-600',
};

export const ACCENT_BG: Record<GateAccent, string> = {
  slate: 'bg-slate-500',
  amber: 'bg-amber-500',
  field: 'bg-field-500',
  signal: 'bg-signal-500',
};

export const ACCENT_BG_TINT: Record<GateAccent, string> = {
  slate: 'bg-slate-100',
  amber: 'bg-amber-100',
  field: 'bg-field-100',
  signal: 'bg-signal-100',
};

export const ACCENT_BORDER: Record<GateAccent, string> = {
  slate: 'border-slate-500',
  amber: 'border-amber-500',
  field: 'border-field-500',
  signal: 'border-signal-500',
};

/** Giant gate number on the dark signage hero (module.md §S1). */
export const ACCENT_NUMBER_DARK: Record<GateAccent, string> = {
  slate: 'text-slate-500',
  amber: 'text-glow-amber',
  field: 'text-glow-green',
  signal: 'text-glow-red',
};

/** Type tag colors for legs (module.md §S3): LESSON slate / DEMO amber /
 * DRILL field / CAPSTONE signal. */
export const LEG_TYPE_CLASSES: Record<Leg['type'], string> = {
  LESSON: 'border-slate-500/50 bg-slate-100 text-slate-600',
  DEMO: 'border-amber-500/50 bg-amber-100 text-amber-600',
  DRILL: 'border-field-500/50 bg-field-100 text-field-600',
  CAPSTONE: 'border-signal-500/50 bg-signal-100 text-signal-600',
};
