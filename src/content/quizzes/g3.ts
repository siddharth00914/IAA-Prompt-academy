import type { GateCheckBank } from '@/content/types';

/**
 * Gate Check 3 — Navigation by Examples: Few-Shot & Reasoning.
 * Five questions per quiz.md §S6 outline, grounded in dim04 (GPT-3 few-shot;
 * Wei et al. 2022 CoT; Kojima et al. "Let's think step by step"; Zheng et al.
 * 2023 step-back; exemplar design research). Leg map: 3.1 few-shot, 3.2 CoT,
 * 3.3 step-back, 3.4 reasoning-or-overkill. Pass ≥ 80%; ≥ 90% earns the
 * CoT Navigator wing.
 *
 * Assessment-integrity pass: option lengths balanced, joke distractors
 * replaced with plausible misconceptions, and wrong-option feedback explains
 * the miss without naming the correct option (revealed only on a 2nd miss or
 * in the end-of-check review).
 */
export const g3: GateCheckBank = {
  gateId: 'g3',
  questions: [
    {
      id: 'g3-q1',
      topic: 'Zero / one / few-shot',
      legRef: '3.1',
      question:
        'You show the model two passenger comments labeled by sentiment, then give it a third comment to classify. This is…',
      options: [
        {
          text: 'Zero-shot prompting.',
          correct: false,
          feedback:
            'Zero-shot means no examples at all — instruction only. You showed two worked examples, so the shot count here is not zero.',
        },
        {
          text: 'Few-shot prompting.',
          correct: true,
          feedback:
            'A few examples demonstrating the exact input→output pattern (Anthropic suggests 3–5; research papers often use more). One example = one-shot; none = zero-shot. The shots are the examples you show, not attempts you take.',
        },
        {
          text: 'Fine-tuning.',
          correct: false,
          feedback:
            'Fine-tuning permanently updates a model with training data. Examples inside a prompt are temporary guidance for that conversation — nothing is retrained, and the next chat starts blank.',
        },
      ],
    },
    {
      id: 'g3-q2',
      topic: 'Exemplar design',
      legRef: '3.1',
      question: 'Why does this few-shot prompt underperform?',
      promptSnippet:
        'Classify the sentiment of each passenger comment.\n\nComment: "Security was fast and friendly"\nSentiment: POSITIVE\n\n— "we waited 40 min at baggage claim" … negative\n\nComment: "The garage signage confused us twice"\nSentiment:',
      options: [
        {
          text: 'The examples use inconsistent formats, so the model can\'t lock onto the pattern.',
          correct: true,
          feedback:
            'Exemplars are a template: keep delimiters, labels, and ordering identical across examples. Here the second example breaks the pattern (different marker, lowercase label), teaching a fuzzy format. Also watch label balance — five "positive" and one "negative" tilts the answer.',
        },
        {
          text: 'Two examples is too many for a classification task — the model loses track.',
          correct: false,
          feedback:
            'Vendor guidance suggests roughly three to five examples — the count here is fine. Something about the examples themselves, not their number, is what drags this prompt down.',
        },
        {
          text: 'Sentiment labels should always be lowercase, and the first example breaks that rule.',
          correct: false,
          feedback:
            'Case is cosmetic — either casing works if it is used the same way throughout. The flaw dragging this prompt down is bigger than lettering.',
        },
      ],
    },
    {
      id: 'g3-q3',
      topic: 'Reasoning or overkill',
      legRef: '3.4',
      question: 'Which task genuinely benefits from adding "Let\'s think step by step"?',
      options: [
        {
          text: 'Looking up the current local time in Indianapolis so a duty roster can be finalized.',
          correct: false,
          feedback:
            'A single-fact lookup has no reasoning chain to surface — extra steps add nothing. (And the model may still get live facts wrong; that is what Gate 5 verification is for.)',
        },
        {
          text: 'Choosing a runway configuration given wind, arriving traffic, and a closed taxiway.',
          correct: true,
          feedback:
            'Multi-step analysis with interacting constraints is exactly where chain-of-thought earns its keep — the model works the factors in order instead of lunging at an answer. Single-step tasks gain nothing.',
        },
        {
          text: 'Translating a short "Thank you for flying with us" note into Spanish.',
          correct: false,
          feedback:
            'A one-step transform. Save reasoning prompts for problems with actual steps — otherwise you add latency and chances to ramble, not accuracy.',
        },
      ],
    },
    {
      id: 'g3-q4',
      topic: 'CoT phrasing',
      legRef: '3.2',
      question: 'Which phrasing most reliably elicits step-by-step reasoning from the model?',
      options: [
        {
          text: '"Let\'s think step by step."',
          correct: true,
          feedback:
            'The classic zero-shot chain-of-thought cue (Kojima et al., 2022) — appending it measurably lifts multi-step reasoning accuracy. For airport work you can go further and specify the steps: "First check X, then weigh Y, then conclude."',
        },
        {
          text: '"Answer immediately — skip the explanation and just give the result."',
          correct: false,
          feedback:
            'A demand for speed gives the model no scaffold — suppressing the working is exactly backwards, because multi-step accuracy comes from surfacing the reasoning, not skipping it.',
        },
        {
          text: '"You are a world-class expert professor who never makes mistakes."',
          correct: false,
          feedback:
            'Role-play flattery may change the tone of the answer, but it changes nothing about the process — no working is requested, so none reliably appears.',
        },
      ],
    },
    {
      id: 'g3-q5',
      topic: 'Step-back prompting',
      legRef: '3.3',
      question: 'What does "step-back" prompting do?',
      options: [
        {
          text: 'Asks a broad question first to activate background knowledge, then applies it to your problem.',
          correct: true,
          feedback:
            'Step back, then solve: "What makes a parking-rate announcement clear?" → "Now write ours." The general principle steadies the specific answer (Zheng et al., 2023) — especially when the task is niche.',
        },
        {
          text: 'Steps the model back through the conversation and deletes the earlier prompts so it starts fresh.',
          correct: false,
          feedback:
            'There is no rewind button in a chat — the conversation keeps everything you wrote. The name describes a thinking move, not housekeeping.',
        },
        {
          text: 'Tells the model to work more slowly and write longer, more careful responses.',
          correct: false,
          feedback:
            'Speed and length are not the levers here — the name describes a move in the questions you ask, not the pace of the answer.',
        },
      ],
    },
  ],
};

export default g3;
