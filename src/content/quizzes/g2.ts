import type { GateCheckBank } from '@/content/types';

/**
 * Gate Check 2 — Flight Crew Roles: Persona, Audience & Context.
 * Five questions per quiz.md §S6 outline, grounded in dim05 (Vanderbilt/White:
 * Persona pattern, Flipped Interaction pattern) and dim01–03 (grounding clauses,
 * audience specification). Leg map: 2.1 persona, 2.2 audience/context,
 * 2.3 grounding, 2.4 flipped interaction. Pass ≥ 80%; ≥ 90% earns the
 * Persona Pilot wing.
 *
 * Assessment-integrity pass: option lengths balanced, joke distractors
 * replaced with plausible misconceptions, and wrong-option feedback explains
 * the miss without naming the correct option (revealed only on a 2nd miss or
 * in the end-of-check review).
 */
export const g2: GateCheckBank = {
  gateId: 'g2',
  questions: [
    {
      id: 'g2-q1',
      topic: 'Persona',
      legRef: '2.1',
      question:
        'You need AI to draft a notice to terminal tenants about overnight escalator maintenance. Which opening line sets the most useful persona?',
      options: [
        {
          text: '"Act as a maintenance coordinator writing a service notice to tenants."',
          correct: true,
          feedback:
            'A persona works when it matches the job: domain (maintenance), document type (service notice), audience (tenants). The model tunes vocabulary, tone, and what to emphasize — crew announcements and customer notices stop sounding identical.',
        },
        {
          text: '"Act as a corporate communications director announcing an exciting company milestone."',
          correct: false,
          feedback:
            'A polished voice, wrong assignment — milestone-announcement instincts push toward celebration and brand language, when tenants need times, locations, and workarounds. Match the persona to the job, not to general polish.',
        },
        {
          text: '"Act as an AI assistant who is always helpful, harmless, and honest."',
          correct: false,
          feedback:
            'That is the default setting, not a persona — it adds no point of view, vocabulary, or priorities. A useful persona names a role the output should sound like it came from.',
        },
      ],
    },
    {
      id: 'g2-q2',
      topic: 'Audience',
      legRef: '2.2',
      question:
        'Same facts, two prompts: one ends "…for the executive board," the other "…for the overnight ground crew." What changes?',
      options: [
        {
          text: 'Nothing — facts are facts, and the two outputs will say essentially the same thing.',
          correct: false,
          feedback:
            'Audience is one of the strongest levers you have — the same facts land very differently depending on the named reader. The two outputs will differ in substance, not just in the greeting line.',
        },
        {
          text: 'The model adjusts tone, vocabulary, and which details get emphasized.',
          correct: true,
          feedback:
            'Specifying WHO is listening steers the whole response: the board gets impact, cost, and decisions needed; the crew gets what changes on shift and when. Same facts, different flight plan.',
        },
        {
          text: 'It adds the audience\'s name to the salutation and otherwise changes nothing.',
          correct: false,
          feedback:
            'It is not a mail-merge — naming the reader reshapes far more than the salutation line, which is why audience shows up in so many strong prompts.',
        },
      ],
    },
    {
      id: 'g2-q3',
      topic: 'Grounding',
      legRef: '2.3',
      question:
        "You're asking questions about the new parking policy, with the policy PDF pasted into the prompt. Which clause best stops the model from inventing answers?",
      options: [
        {
          text: '"Answer using only the text provided; if the answer isn\'t in the text, say so."',
          correct: true,
          feedback:
            'That is grounding: it fences the model to your source and gives it an honest exit. Grounded prompts say "not stated in the policy" instead of hallucinating a plausible rule — the difference between a tool and a liability.',
        },
        {
          text: '"Be as accurate and careful as possible — double-check yourself before answering."',
          correct: false,
          feedback:
            'A wish, not a boundary. Nothing in that clause limits where the model gets its answers, so gaps can still be filled with plausible-sounding invention.',
        },
        {
          text: '"Use everything you know about airport parking policies to give a complete answer."',
          correct: false,
          feedback:
            'That opens the door to outside — possibly outdated or invented — knowledge on a question that has one authoritative source. It is the opposite of containment, and a classic hallucination risk.',
        },
      ],
    },
    {
      id: 'g2-q4',
      topic: 'Flipped interaction',
      legRef: '2.4',
      question: 'What is "flipped interaction," and when is it worth using?',
      options: [
        {
          text: 'The model interviews you, asking questions until it has enough to do the task — use it when details still live in your head.',
          correct: true,
          feedback:
            'You flip who drives: "Ask me questions, one at a time, until you can draft the incident report." It shines for reports and plans where the key details still live in your head — the model only asks what it deems relevant.',
        },
        {
          text: 'You paste the model\'s answer back in as your next prompt so it builds on its own work — use it to save time on long documents.',
          correct: false,
          feedback:
            'Recycling outputs has no pattern name — it just compounds errors. The technique from Leg 2.4 changes something about who does what in the conversation, not about feeding text back.',
        },
        {
          text: 'The model alternates between two contrasting tones in one reply — use it for creative writing and announcements.',
          correct: false,
          feedback:
            'Nothing about the term involves tone, and nothing in it is random. Something about the exchange flips — re-check Leg 2.4 for what, exactly, gets turned around.',
        },
      ],
    },
    {
      id: 'g2-q5',
      topic: 'Context',
      legRef: '2.2',
      question:
        '"Draft an email: the employee parking lot moves to Lot C next Monday." The draft reads flat and confusing. Which context is most obviously missing?',
      options: [
        {
          text: 'WHO it\'s for and WHY — all badged employees, because of the garage resurfacing project.',
          correct: true,
          feedback:
            'Context answers who / what / why / where. "All badged employees" plus the reason turns a cryptic note into a useful one — readers instantly know if it applies to them and whether to act.',
        },
        {
          text: 'A longer list of adjectives describing the lot, the shuttle, and how employees feel about it.',
          correct: false,
          feedback:
            'Adjectives decorate; context informs. A more vivid description of the lot still leaves readers guessing whether the email applies to them at all.',
        },
        {
          text: 'The model\'s opinion on whether moving the lot is a good idea in the first place.',
          correct: false,
          feedback:
            'You do not want an opinion; you want a notice. An opinion tells readers neither whether this affects them nor what actually changed.',
        },
      ],
    },
  ],
};

export default g2;
