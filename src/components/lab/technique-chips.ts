/**
 * Technique chip tray definitions (promptlab.md §S2) — quick-insert fragments
 * that teach the moves. Chips are assistive, not required; used chips feed the
 * debrief synergy note.
 *
 * v2: chips insert CONCEPT SCAFFOLDING with [brackets] the learner fills in —
 * they teach the technique ("name your audience and why") instead of pasting
 * the rubric's detector strings verbatim. Gate labels match the curriculum:
 * Gate 1 = task/format, Gate 2 = persona/audience/grounding, Gate 3 =
 * examples/reasoning (fixes the old fence→G3 and example→G2 mislabels).
 */
export interface TechniqueChip {
  id: string;
  label: string;
  /** Fragment typed into the editor at the caret. */
  insert: string;
  /** Name used in the debrief synergy note ("you used …"). */
  synergy: string;
  /** Gate the technique belongs to, for the synergy note. */
  gate: string;
}

export const TECHNIQUE_CHIPS: TechniqueChip[] = [
  {
    id: 'task',
    label: 'ONE JOB',
    insert: 'The one job: [verb] the [deliverable] — done when [what good looks like]. ',
    synergy: 'a one-job frame',
    gate: 'Gate 1',
  },
  {
    id: 'format',
    label: 'SHAPE + SIZE',
    insert: 'Shape it as [what the reader opens — a notice? a table? a reply?], about [N] words long. ',
    synergy: 'a shape + size spec',
    gate: 'Gate 1',
  },
  {
    id: 'tone',
    label: 'VOICE',
    insert: 'Voice: [how it should sound to the reader — name two words]. ',
    synergy: 'a voice note',
    gate: 'Gate 1',
  },
  {
    id: 'role',
    label: 'RIGHT SEAT',
    insert: 'Take the seat of [the person who would write this for real]; use their vocabulary and judgment. ',
    synergy: 'a right-seat persona',
    gate: 'Gate 2',
  },
  {
    id: 'audience',
    label: 'AUDIENCE + WHY',
    insert: "This is for [who reads it] — [why they need it / what they'll do with it]. ",
    synergy: 'an audience + why',
    gate: 'Gate 2',
  },
  {
    id: 'fence',
    label: 'GROUND IT',
    insert: "Work only from the source below; if something isn't in it, say so instead of inventing it.\n\nSource:\n",
    synergy: 'a grounding fence',
    gate: 'Gate 2',
  },
  {
    id: 'example',
    label: 'SHOW ONE',
    insert: 'One miniature of what good looks like: [paste a one-line sample of the output]. ',
    synergy: 'a show-one sample',
    gate: 'Gate 3',
  },
  {
    id: 'steps',
    label: 'THINK FIRST',
    insert: 'Work it out in numbered steps first, then give the final answer. ',
    synergy: 'a think-first nudge',
    gate: 'Gate 3',
  },
];
