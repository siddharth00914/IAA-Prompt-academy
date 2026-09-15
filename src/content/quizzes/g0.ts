import type { GateCheckBank } from '@/content/types';

/**
 * Gate Check 0 — Welcome Aboard: What Prompt Engineering Is.
 * Five questions; pass ≥ 80%. Grounded in dim01 (LLM = next-word predictor),
 * dim04 (fragility research: Liu et al. 2021, Sclar et al. 2023) and
 * module.md §7 leg map (0.1 prediction engine, 0.2 anatomy, 0.4 zero-shot/fragility).
 *
 * Assessment-integrity pass: distractors are plausible misconceptions of
 * comparable length/specificity (no joke options, no systematic longest-is-
 * correct bias); wrong-option feedback explains why that pick fails without
 * naming the correct one (correct answer is revealed only on a 2nd miss or in
 * the end-of-check review).
 */
export const g0: GateCheckBank = {
  gateId: 'g0',
  questions: [
    {
      id: 'g0-q1',
      topic: 'Next-word prediction',
      legRef: '0.1',
      question: 'At a working level, what does a large language model actually do when it answers your prompt?',
      options: [
        {
          text: 'It looks the answer up in a database of verified documents, then rephrases what it finds in them.',
          correct: false,
          feedback:
            'No lookup happens — and that is exactly why the model can state false things with total confidence. Nothing checks its words against a verified source, which is why the Gate 5 verification habit is non-negotiable.',
        },
        {
          text: 'It predicts the most likely next words, one after another, from patterns learned in training.',
          correct: true,
          feedback:
            'Next-word prediction at massive scale — an autocomplete engine with a lot of runway. This is the mental model for the whole course: clear patterns in your prompt shape the patterns that come out.',
        },
        {
          text: 'It matches your request to a rulebook that engineers hand-wrote for each topic it covers.',
          correct: false,
          feedback:
            'No team could hand-write rules for every airport-ops question that comes up — that rulebook would never be finished. Whatever is doing the work here is far more general than a manual.',
        },
      ],
    },
    {
      id: 'g0-q2',
      topic: 'Prompt anatomy',
      legRef: '0.2',
      question: 'This prompt has an instruction, context (the audience), and an input. Which anatomy part is missing?',
      promptSnippet: 'Summarize the attached ground-delay report for the operations director.\n\n```\n[2-page report pasted here]\n```',
      options: [
        {
          text: 'Output format — how long the answer should be and what shape it should take.',
          correct: true,
          feedback:
            '"Summarize" says what to do, not what the result looks like. Add format and length — "5 bullets, one line each" — and the model stops guessing. Output format is the arrival gate for every prompt.',
        },
        {
          text: 'A polite greeting and a thank-you line to put the model in a cooperative mood.',
          correct: false,
          feedback:
            'Courtesy is nice, but it changes nothing structural — after the greeting, the model still has to guess what the finished deliverable should look like.',
        },
        {
          text: 'Examples of past delay-report summaries for the model to imitate as it writes.',
          correct: false,
          feedback:
            'Examples help (that is few-shot, Gate 3), but they are optional seasoning, not a required anatomy part. Even without them, one named element would tell the model exactly what "done" looks like.',
        },
        {
          text: 'A role line, like "Act as an operations analyst," to set the right register.',
          correct: false,
          feedback:
            'A role can sharpen tone (Gate 2), but it is an enhancement, not a missing load-bearing part. The prompt already says who the summary is for — something else about the deliverable is unspecified.',
        },
      ],
    },
    {
      id: 'g0-q3',
      topic: 'Zero-shot',
      legRef: '0.4',
      question: 'What is a "zero-shot" prompt?',
      options: [
        {
          text: 'A prompt where you show the model zero examples — just the instruction.',
          correct: true,
          feedback:
            'Zero-shot = instruction only, no examples. Show 2–3 worked examples instead and you are doing few-shot prompting (Gate 3). Most everyday prompts are zero-shot — and they work fine when the instruction is clear.',
        },
        {
          text: 'A prompt the model declines to answer because it falls outside its safety rules.',
          correct: false,
          feedback:
            'Refusals are a separate behavior, usually safety-related. "Shot" counts something you put into the prompt yourself — not the model\'s willingness to respond.',
        },
        {
          text: 'A prompt that misfires on the first attempt and has to be reworded to land.',
          correct: false,
          feedback:
            'Nothing in the term is about attempts — prompts in this category succeed constantly; it is the default way everyone uses AI. The count in the name refers to something given up front, not tries taken.',
        },
      ],
    },
    {
      id: 'g0-q4',
      topic: 'Fragility factor',
      legRef: '0.4',
      question:
        'You ran the same request twice with slightly different wording and got noticeably different answers. What is the right takeaway?',
      options: [
        {
          text: 'The model is broken for this kind of task — no reliable output is possible, so give up on it.',
          correct: false,
          feedback:
            'Sensitivity to wording is normal, well-documented behavior on every model — not a verdict on the whole tool. The research-backed move concerns what you try next, not what you give up on.',
        },
        {
          text: 'Wording and order can swing results — reword, reorder, and retry before blaming the model.',
          correct: true,
          feedback:
            'That is the fragility factor, and it is why prompt engineering is a skill worth training. When an output disappoints, your first tool is a more precise prompt — the rest of this flight plan teaches how.',
        },
        {
          text: 'The model learned from your first run, so the second answer is its corrected, better one.',
          correct: false,
          feedback:
            'The model does not learn from your previous run — each prompt is handled fresh, with no self-correction between them. Whatever changed came from your side of the keyboard, not from the model improving.',
        },
      ],
    },
    {
      id: 'g0-q5',
      topic: 'Prompt anatomy',
      legRef: '0.2',
      question: 'In this prompt, the triple-backtick block is the…',
      promptSnippet: 'Act as a public affairs officer.\nRewrite the notice below in plain language.\n\n```\n[concourse notice text]\n```',
      options: [
        {
          text: 'Instruction — it sits right under the role line, which is where the commands in a prompt live.',
          correct: false,
          feedback:
            'The instruction seat is already taken: "Rewrite the notice below in plain language" is the verb phrase telling the model what to do. The backticks are not giving a command.',
        },
        {
          text: 'Input — the source material the task operates on, kept separate from the instructions.',
          correct: true,
          feedback:
            'Instruction here, cargo there — that separation is the anatomy that keeps prompts from tripping over themselves. ("Act as…" is the role part; Gate 2 covers what it buys you.)',
        },
        {
          text: 'Output format — it specifies the shape the rewritten notice should take.',
          correct: false,
          feedback:
            'Output format describes the shape of the *answer* — length, bullets, tone. Nothing inside the backticks describes an answer at all.',
        },
      ],
    },
  ],
};

export default g0;
