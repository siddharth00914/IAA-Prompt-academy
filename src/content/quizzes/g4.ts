import type { GateCheckBank } from '@/content/types';

/**
 * Gate Check 4 — On the Job at IND: Airport Task Patterns.
 * Five questions per quiz.md §S6 outline, grounded in dim06 (Ng & Fulford:
 * Summarizing / Inferring / Transforming / Expanding; iterative prompt
 * development) and dim05 (Fact Check List pattern; prompt chaining). Leg map:
 * 4.1 summarize & infer, 4.2 transform & expand, 4.3 chaining, 4.4 iterate loop.
 *
 * Assessment-integrity pass: option lengths balanced (correct answer is not
 * systematically the longest), distractors are plausible misconceptions, and
 * wrong-option feedback explains the miss without naming the correct option
 * (revealed only on a 2nd miss or in the end-of-check review).
 */
export const g4: GateCheckBank = {
  gateId: 'g4',
  questions: [
    {
      id: 'g4-q1',
      topic: 'Infer',
      legRef: '4.1',
      question:
        'Match the job to the pattern: "Read these 8 passenger-survey comments and tell me the overall sentiment and the top 3 topics."',
      options: [
        {
          text: 'Summarize.',
          correct: false,
          feedback:
            'Summarizing condenses what a document already says outright. Feelings and themes are signals that are not stated directly — that calls for a different pattern.',
        },
        {
          text: 'Infer.',
          correct: true,
          feedback:
            'Inferring reads what is not explicitly written: sentiment, topics, intent. One well-built prompt replaces a small analysis pipeline — no labeled dataset or code required.',
        },
        {
          text: 'Transform.',
          correct: false,
          feedback:
            'Transforming rewrites text into a new register or format (radio log → public statement). This job produces analysis, not a rewrite.',
        },
        {
          text: 'Expand.',
          correct: false,
          feedback:
            'Expanding generates longer text from a short seed — one line becomes a full email. This job runs the opposite direction, from raw comments down to signals.',
        },
      ],
    },
    {
      id: 'g4-q2',
      topic: 'Summarize',
      legRef: '4.1',
      question:
        'You have a 2-page winter-storm irregular-ops report for the executive team. Which summarize prompt lands best?',
      options: [
        {
          text: '"Summarize this report into the key takeaways, keeping it short and focused on the executive team."',
          correct: false,
          feedback:
            '"Key takeaways" and "short" are still vibes the model cannot verify — how many bullets, how many words, focused on what decision? Aiming this loosely is how summaries go sideways.',
        },
        {
          text: '"Summarize in 5 bullets, max 20 words each, focused on what the exec team must decide by noon."',
          correct: true,
          feedback:
            'Limits plus focus: a count cap, a word cap, a format, and an audience-specific lens. That is the researched summarize pattern — and if a detail is not in the report, add "use only the text provided" to keep it grounded.',
        },
        {
          text: '"Summarize this report and make it exciting enough to hold an executive team\'s attention."',
          correct: false,
          feedback:
            '"Exciting" is not measurable — the model cannot verify it, and an ops debrief does not need it. Give the model targets it can actually check.',
        },
      ],
    },
    {
      id: 'g4-q3',
      topic: 'Transform vs Expand',
      legRef: '4.2',
      question:
        '"Turn this terse maintenance radio log into a calm public-status statement" vs. "turn this one-line idea into a full tenant email." These are…',
      options: [
        {
          text: 'Transform, then Expand — the first restyles existing content; the second grows new text from a seed.',
          correct: true,
          feedback:
            'Transform keeps the content and changes its form — tone, format, language. Expand takes a little and writes a lot, inventing the supporting detail. Picking the right pattern tells you which prompt moves to make.',
        },
        {
          text: 'Expand, then Transform — the first grows a log into a statement; the second restyles an idea into an email.',
          correct: false,
          feedback:
            'Check which job already has all its content and which needs content invented. The radio log is complete text; the one-line idea is a seed.',
        },
        {
          text: 'Both are Summarize, since each one condenses raw material into cleaner text.',
          correct: false,
          feedback:
            'Neither job shortens a document — one of them actually makes text longer. Watch what happens to the *amount* of content in each task.',
        },
      ],
    },
    {
      id: 'g4-q4',
      topic: 'Prompt chaining',
      legRef: '4.3',
      question:
        'Complex deliverable: a full public update about the garage project. What is the right chain order?',
      options: [
        {
          text: 'Draft → outline → fact-check.',
          correct: false,
          feedback:
            'Drafting first is writing before you think — the prose wanders, and the later outline becomes an autopsy of the draft instead of a plan for it.',
        },
        {
          text: 'Outline → draft → fact-check.',
          correct: true,
          feedback:
            'The jet-bridge method: one prompt to structure, one to write from the outline, one to audit every claim against the source. Each hop has a single job, so quality compounds instead of collapsing.',
        },
        {
          text: 'Fact-check → draft → outline.',
          correct: false,
          feedback:
            'You cannot fact-check text that does not exist yet — there is nothing to audit. Verification runs on a draft, not on thin air.',
        },
      ],
    },
    {
      id: 'g4-q5',
      topic: 'Iterate loop',
      legRef: '4.4',
      question: "The model's first draft of your tenant email misses the mark. What is the professional first move?",
      options: [
        {
          text: 'Give up on AI for this kind of writing and go back to drafting every email manually.',
          correct: false,
          feedback:
            'One weak output is a normal step in the loop, not a verdict on the tool. Prompt development is iterative by design — the first draft is supposed to teach you something.',
        },
        {
          text: 'Name what\'s wrong — tone, length, missing tenant impact — then refine the prompt to target it.',
          correct: true,
          feedback:
            'The iterate loop: idea → result → analyze → refine. Vague "try again" prompts wander; targeted corrections land. Diagnose first, then change one specific thing.',
        },
        {
          text: 'Paste the exact same prompt in again and hope the model rolls a noticeably better answer this time.',
          correct: false,
          feedback:
            'Same input, dice roll — change nothing and you are re-flying the same approach into the same headwind, expecting a different landing.',
        },
      ],
    },
  ],
};

export default g4;
