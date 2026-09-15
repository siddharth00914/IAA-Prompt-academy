import type { GateCheckBank } from '@/content/types';

/**
 * Gate Check 1 — Clearance for Takeoff: Clear & Specific Instructions.
 * Full question bank per quiz.md §S5. Pass ≥ 80%; ≥ 90% earns the
 * Delimiters Ace wing. Grounded in dim01/dim02/dim03 guidance: single task,
 * delimiters, objective output specs, positive instructions, action verbs.
 *
 * Assessment-integrity pass: option lengths balanced (correct answer is not
 * systematically the longest), distractors are plausible misconceptions, and
 * wrong-option feedback explains the miss without naming the correct option
 * (revealed only on a 2nd miss or in the end-of-check review).
 */
export const g1: GateCheckBank = {
  gateId: 'g1',
  questions: [
    {
      id: 'g1-q1',
      topic: 'Single task',
      legRef: '1.1',
      question: 'Which prompt is most likely to produce a usable result?',
      options: [
        {
          text: 'Summarize the attached ops report, translate it to Spanish, and draft a press release about it.',
          correct: false,
          feedback:
            'Three distinct cognitive tasks in one pass — models do noticeably worse when you stack them. Split complex work into separate prompts or a chain (Gate 4 covers the jet-bridge method).',
        },
        {
          text: 'Summarize the attached ops report in 5 bullet points for the executive team.',
          correct: true,
          feedback:
            'One task, one verb, specified format and audience. That is a clean departure — the model knows exactly what "done" looks like before it starts.',
        },
        {
          text: 'Do everything you can with this report.',
          correct: false,
          feedback:
            'No executable instruction at all — the model has to guess the task and the format. If you cannot name the verb, the model cannot land the request.',
        },
      ],
    },
    {
      id: 'g1-q2',
      topic: 'Delimiters',
      legRef: '1.2',
      question:
        "You're pasting a tenant's angry email and want a draft reply. Why wrap the email in triple backticks (```)?",
      options: [
        {
          text: 'It marks the prompt as technical, and models return more careful, precise answers to technical-looking input.',
          correct: false,
          feedback:
            'The model does not grade on looks — no formatting style earns extra care by itself. What backticks change is structural, and Leg 1.2 walks through exactly what that structure buys you.',
        },
        {
          text: 'It fences the email off from your instructions, so the model can\'t mix its contents up with your request.',
          correct: true,
          feedback:
            'Delimiters are luggage tags: instructions here, cargo there. Without them, phrases inside the source text — like the tenant\'s own demands — can hijack the task.',
        },
        {
          text: 'It encrypts whatever sits inside the backticks, so the tenant\'s angry words stay private.',
          correct: false,
          feedback:
            'Dangerous misconception — delimiters change nothing about privacy. Anything pasted is still transmitted to the tool. (Gate 5 covers what truly cannot be pasted at all.)',
        },
      ],
    },
    {
      id: 'g1-q3',
      topic: 'Output format',
      legRef: '1.3',
      question: 'Which addition most improves "Write a summary of the board packet"?',
      options: [
        {
          text: '"Make it really good and professional — the kind of summary a first-rate executive would produce."',
          correct: false,
          feedback:
            'Subjective qualifiers are not measurable — the model cannot aim at "really good." It can only hit targets it is able to check.',
        },
        {
          text: '"Summarize it in 3 sentences or less, as bullet points, for a reader who missed the meeting."',
          correct: true,
          feedback:
            'Objective constraints: length cap, format, audience. Specific beats vague: "3 sentences or less" beats "brief" — the model can verify a count, not a vibe.',
        },
        {
          text: '"Take your time and think it through carefully before you start writing."',
          correct: false,
          feedback:
            'Patience is not a spec — nothing in that sentence tells the model what a finished answer looks like. (Reasoning help does exist; Gate 3 covers when it earns its keep.)',
        },
      ],
    },
    {
      id: 'g1-q4',
      topic: 'Positive instructions',
      legRef: '1.4',
      question: 'Rewrite of "Don\'t be verbose" — which is best?',
      options: [
        {
          text: '"Do not, under any circumstances, write long answers."',
          correct: false,
          feedback:
            'Still a "don\'t." Negative instructions tell the model what to avoid, not what to do — and "long" is not even defined. The target behavior never gets named.',
        },
        {
          text: '"Answer in 3 sentences or less."',
          correct: true,
          feedback:
            'Positive, measurable instruction. Say what TO do — humans and models both follow it better. "3 sentences or less" can actually be checked; "not verbose" cannot.',
        },
        {
          text: '"Verbose answers will be rejected."',
          correct: false,
          feedback:
            'Threats are not instructions; no target behavior is specified. The model still does not know what a passing answer looks like.',
        },
      ],
    },
    {
      id: 'g1-q5',
      topic: 'Action verbs',
      legRef: '1.1',
      question: 'A strong instruction usually starts with…',
      options: [
        {
          text: 'A polite preamble, like "I was wondering if maybe you could possibly…"',
          correct: false,
          feedback:
            'Hedging buries the task under etiquette — by the time the request arrives, the thread of it is lost. Whatever opens a strong instruction, it is not an apology.',
        },
        {
          text: 'An action verb: Summarize, Classify, Extract, Rewrite, List, Draft.',
          correct: true,
          feedback:
            'One clear verb = one clear task. If you cannot name the verb, you have not finished thinking about the request — and the model has no runway to depart from.',
        },
        {
          text: 'A detailed description of the tone and register you want in the finished answer.',
          correct: false,
          feedback:
            'Tone matters, but it is a constraint, not the task itself. A prompt that opens with register still has not said what to do.',
        },
      ],
    },
  ],
};

export default g1;
