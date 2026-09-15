import type { Gate } from '@/content/types';

/**
 * G0 — Welcome Aboard: What Prompt Engineering Is (module.md §7).
 * Fully authored: 4 legs. Leg 0.2 follows the fully-written lesson in
 * lesson.md §4, including its SceneVideo scene timeline.
 *
 * SceneVideo block ids are consumed by the scene registry in
 * src/components/learn/scenes/: 'g0-1-prediction' and 'g0-2-anatomy'.
 */
export const gate0: Gate & { labHints?: { id: string; title: string }[] } = {
  id: 'g0',
  index: 0,
  number: 'G0',
  title: 'Welcome Aboard',
  subtitle:
    'What prompt engineering is — meet the prediction engine, learn the anatomy, and see why the words you choose move the answers you get.',
  accent: 'slate',
  boardingOrder: 1,
  approxMinutes: 25,
  objectives: [
    'Define "prompt" and describe an LLM as a next-word predictor at a working level.',
    'Name the anatomy parts: instruction, context, input, output format — plus role and examples.',
    'Explain zero-shot vs. few-shot prompting and when each earns its fuel.',
    'State why small wording changes move outputs — and why that makes precision a skill.',
  ],
  legs: [
    // ── LEG 0.1 ────────────────────────────────────────────────────────────
    {
      id: '0.1',
      code: 'LEG 0.1',
      type: 'LESSON',
      title: 'Meet the Machine Under the Jetway',
      description:
        'What a large language model actually does: predict the next word, over and over, very fast.',
      durationMin: 6,
      blocks: [
        {
          type: 'prose',
          id: 'meet-machine',
          heading: 'A machine that finishes sentences',
          body: [
            "Every day at the airport you work alongside machines — the ones that move bags, scan boarding passes, and marshal aircraft. The newest machine on the field doesn't move anything physical. It writes. A **large language model** (LLM) is the engine inside tools like ChatGPT, Copilot, and Gemini. You send it text; it sends text back. That exchange has names: a [[prompt|the text you send to a language model — instructions, context, and material]] is what you send, and the [[completion|the text the model generates in response to a prompt]] is what comes back.",
            "Here is the working truth underneath: an LLM is a **prediction engine**. Given everything written so far, it calculates which piece of text is most likely to come next — then appends it and repeats, hundreds of times per answer. It was trained on an enormous library of human writing, so its predictions are fluent. But it doesn't *look things up* the way a search engine does. It completes patterns.",
            "That single fact explains everything else in this course — why precise wording matters, why examples help, and why the model can sound confident while being completely wrong (that is Gate 5's home turf).",
          ],
        },
        {
          type: 'sceneVideo',
          id: 'g0-1-prediction',
          title: 'The prediction engine',
          duration: 30,
          scenes: [
            {
              id: 'title',
              layers: ['titleCard'],
              keyframes: { '0-4s': 'Mono title card types on: THE PREDICTION ENGINE.' },
            },
            {
              id: 'sentence',
              layers: ['sentenceStrip', 'caret'],
              keyframes: {
                '4-10s':
                  'Ops sentence tokens appear one at a time: THE RAMP AT CONCOURSE B / CLOSES / AT — caret blinks at the blank.',
              },
            },
            {
              id: 'candidates',
              layers: ['candidatePanel', 'probBars'],
              keyframes: {
                '10-16s':
                  'Candidate tokens rise with probability bars: 14:00 (72%), NOON (18%), DAWN (7%). Leader highlights amber.',
              },
            },
            {
              id: 'pick',
              layers: ['sentenceStrip', 'candidatePanel'],
              keyframes: {
                '16-20s': '"14:00" lifts from the candidate panel and lands in the sentence; caret advances.',
              },
            },
            {
              id: 'cascade',
              layers: ['sentenceStrip'],
              keyframes: {
                '20-26s':
                  'Fast cascade: FOR / MAINTENANCE / UNTIL / 06:00 append rapidly to show generation speed.',
              },
            },
            {
              id: 'verdict',
              layers: ['verdictLine'],
              keyframes: {
                '26-30s':
                  'Verdict stamps on: IT COMPLETES PATTERNS. IT DOESN\'T LOOK THINGS UP. Amber underline sweeps.',
              },
            },
          ],
          captions: [
            { t0: 0, t1: 4, text: 'Watch the machine do the one thing it does.' },
            { t0: 4, t1: 10, text: 'Feed it the start of any sentence — say, an ops update.' },
            { t0: 10, t1: 16, text: 'Given everything so far, it scores every possible next word…' },
            { t0: 16, t1: 20, text: '…picks a likely one, appends it, and starts over.' },
            { t0: 20, t1: 26, text: 'Then it does it again. Hundreds of times per answer.' },
            { t0: 26, t1: 30, text: "No lookup. No library. Just the most likely next word." },
          ],
        },
        {
          type: 'prose',
          id: 'why-it-matters',
          heading: 'Why this matters on your shift',
          body: [
            "If the model predicts the most likely next text, then your prompt is the runway it departs from. A vague, meandering prompt points it toward a vague, meandering answer. A specific, well-organized prompt hands it a flight plan.",
            "Small changes in wording can swing results far more than people expect — researchers call this **fragility**. It is not a flaw to fear; it is a skill to learn. Gates 1 through 4 are exactly that training.",
          ],
        },
        {
          type: 'stat',
          id: 'stat-one-token',
          value: 1,
          suffix: 'word at a time',
          caption:
            "Every email, summary, and table the model has ever produced was written one predicted token at a time — no draft, no eraser, no 'look it up' step hiding backstage.",
        },
        {
          type: 'callout',
          id: 'engine-vs-product',
          variant: 'tower',
          title: 'Tower Advisory: the engine predicts; the product may look things up.',
          body: 'A 2026 nuance on "no lookup, no library": that describes the **base model** — the completion engine itself, which only predicts likely text. The **products** wrapped around it are another story. ChatGPT, Copilot, and Gemini can now search the live web, open documents, and call tools, then write answers grounded in what they retrieved (a pattern called retrieval-augmented generation, or RAG). Grounded output is better anchored — but it is not *verified* output. The model can still misread a source, misquote it, or blend a real page with an invented claim. Whether the answer came from patterns or from pages, Gate 5\'s rule holds: check it before you use it.',
        },
        {
          type: 'callout',
          id: 'brief-new-hire',
          variant: 'tower',
          title: 'Tower Advisory: brief it like a new hire.',
          body: 'You already know how to hand work to a capable new colleague: the task, the background, and what "done" looks like. That is the whole craft. The model is simply the newest hire on the field — one that briefs in text and never gets offended by detail.',
        },
        {
          type: 'knowledgeCheck',
          id: 'kc-model',
          question: 'Which working model of an LLM will serve you best at work?',
          options: [
            {
              text: 'It is a search engine — it looks up verified facts from a database.',
              correct: false,
              feedback:
                'There is no database lookup in the loop. It predicts likely text from training patterns — which is exactly why unverified "facts" can be invented. Gate 5 is all about that hazard.',
            },
            {
              text: 'It predicts the most likely next text given everything so far.',
              correct: true,
              feedback:
                'Right. Prediction, not lookup. Keep that picture in your head and every technique in this course makes sense.',
            },
            {
              text: 'It understands instructions the way a coworker does.',
              correct: false,
              feedback:
                'It produces text that matches the pattern of a helpful answer — immensely useful, but not human understanding. Precision in, quality out.',
            },
          ],
        },
        {
          type: 'quote',
          id: 'quote-crew',
          text: "You don't need to know how the engine burns fuel. You need to know which levers move the aircraft.",
          attribution: 'FROM THE FLIGHT CREW · IAA PROMPT ACADEMY',
        },
        {
          type: 'prose',
          id: 'next-up',
          heading: 'Next up',
          body: [
            "You can define a prompt and picture the engine behind it. Next leg: take a prompt apart piece by piece — the anatomy that shows up in every good one.",
          ],
        },
      ],
      takeaways: [
        'A **prompt** is the text you send; the **completion** is what comes back.',
        "An LLM is a prediction engine — it completes patterns; the engine itself doesn't look things up (though 2026 products may ground answers in live sources — still verify).",
        'Small wording changes move outputs. Precision is a learnable skill, not luck.',
      ],
    },

    // ── LEG 0.2 — fully written lesson (lesson.md §4) ──────────────────────
    {
      id: '0.2',
      code: 'LEG 0.2',
      type: 'LESSON',
      title: 'The Anatomy of a Prompt',
      description:
        'Instruction, context, input, output format — plus role and examples. Watch a good prompt load itself onto the cart.',
      durationMin: 6,
      blocks: [
        {
          type: 'prose',
          id: 'loaded-aircraft',
          heading: 'Every good prompt is a loaded aircraft',
          body: [
            "Nothing flies until the weight is in the right place. A prompt works the same way. Under the hood, the model you're talking to is a prediction engine: given everything so far, it predicts the most likely next piece of text — over and over, very fast. It doesn't 'look things up'; it completes patterns. That's why the *way* you load the request — what you include, in what order, in what format — changes what comes back.",
            'One large 2024 survey ("The Prompt Report") read through more than 1,500 research papers on prompting and catalogued 58 distinct techniques. Underneath them all, the same basic loadout shows up again and again. Four parts do most of the work, with two optional extras:',
          ],
        },
        {
          type: 'sceneVideo',
          id: 'g0-2-anatomy',
          title: 'Anatomy builds itself',
          duration: 45,
          poster: '/illustration-anatomy.svg',
          scenes: [
            {
              id: 'cart-in',
              layers: ['taxiway', 'cart'],
              keyframes: {
                '0-4s': 'Empty luggage cart rolls in from left (x -200 → 0), wheels turning.',
              },
            },
            {
              id: 'instruction',
              layers: ['cart', 'containerInstruction'],
              keyframes: {
                '4-12s':
                  'INSTRUCTION container (amber) drops onto the cart with a soft thud (scale 1.15 → 1; cart dips 3px). Label prints on its side.',
              },
            },
            {
              id: 'context',
              layers: ['cart', 'containerContext'],
              keyframes: {
                '12-20s': 'CONTEXT container (green) slides in from the left and stacks on.',
              },
            },
            {
              id: 'input',
              layers: ['cart', 'containerInput'],
              keyframes: {
                '20-28s':
                  'INPUT container (slate) with a document glyph slides in low and slots onto the stack.',
              },
            },
            {
              id: 'output-format',
              layers: ['cart', 'containerOutput', 'formatTag'],
              keyframes: {
                '28-36s':
                  'OUTPUT FORMAT container (ink) drops on top; mono tag prints: 5 BULLETS · ≤120 WORDS.',
              },
            },
            {
              id: 'extras-departure',
              layers: ['cart', 'roleTag', 'examplesTag', 'plane', 'trail'],
              keyframes: {
                '36-45s':
                  'ROLE and EXAMPLES tags (red outline) pin on; the cart taxis right; a plane lifts off behind it with a dashed trail.',
              },
            },
          ],
          captions: [
            { t0: 0, t1: 4, text: 'A prompt is cargo. Load it right and it arrives.' },
            { t0: 4, t1: 12, text: "The instruction: one task, one verb. 'Summarize this report.'" },
            {
              t0: 12,
              t1: 20,
              text: "Context: who's asking, and why. '…for the executive team before the 8 a.m. briefing.'",
            },
            {
              t0: 20,
              t1: 28,
              text: 'The input: the material to work on — the report text itself, set apart in delimiters.',
            },
            { t0: 28, t1: 36, text: 'Output format: exactly what the answer should look like.' },
            {
              t0: 36,
              t1: 45,
              text: 'Optional extras: a role to speak from, and examples to copy. Six parts, one departure.',
            },
          ],
        },
        {
          type: 'promptBuilder',
          id: 'load-the-cart',
          title: 'Load the cart yourself',
          parts: [
            {
              id: 'ROLE',
              label: 'ROLE',
              caption:
                'A role steers vocabulary, tone, and priorities — the uniform the model puts on.',
            },
            {
              id: 'INSTRUCTION',
              label: 'INSTRUCTION',
              caption: 'The instruction is the task: one verb, one job. Everything else supports it.',
            },
            {
              id: 'CONTEXT',
              label: 'CONTEXT',
              caption: "Context tells the model who it's working for and why the output matters.",
            },
            {
              id: 'INPUT',
              label: 'INPUT',
              caption:
                'The input is the material — fenced in delimiters so it never blends with instructions.',
            },
            {
              id: 'OUTPUT_FORMAT',
              label: 'OUTPUT FORMAT',
              caption: 'Output format is the arrival gate: shape and length, stated outright.',
            },
            {
              id: 'EXAMPLES',
              label: 'EXAMPLES',
              caption:
                'Examples are finished samples to copy the shape of. Powerful — but they usually board after the instruction.',
            },
          ],
          previewTemplate:
            'You are an executive assistant at Indianapolis International Airport. {{ROLE}}\nSummarize the report below for the executive team ahead of the 8 a.m. briefing. {{INSTRUCTION}} {{CONTEXT}}\nReport: """…irregular-ops report text…""" {{INPUT}}\nReturn 5 bullet points, 120 words max. {{OUTPUT_FORMAT}}\nMatch the attached briefing style. {{EXAMPLES}}',
          cannedResponse:
            '• Irregular operations peaked between 14:00–18:00, driven by convective weather and two ground stops; 41 arrival delays ran over 30 minutes.\n• Deicing capacity was the binding constraint — average taxi-out reached 47 minutes with all four pads active.\n• Passenger recovery held: 92% of misconnected travelers rebooked within 3 hours; 118 hotel vouchers issued.\n• Concessions and custodial overtime ran 12% over plan; both flagged for the monthly variance review.\n• Recommendation: pre-stage deice crews on forecast triggers and shift two evening turns to spare gates.',
        },
        {
          type: 'callout',
          id: 'order-matters',
          variant: 'tower',
          title: 'Tower Advisory: order matters — especially the end.',
          body: 'Position effects are real, but the better-documented one is **recency**: models lean on what comes *last*. In a classic study, a few-shot prompt that simply ended on a negative example pushed ~90% of predictions negative (Zhao et al., 2021). Microsoft\'s own guidance pairs the two ends: put the task up front — and on long prompts, **repeat the key instruction at the end**, after the material. So load critical instructions first, restate them last, and if an output disappoints, rearrange the load before blaming the aircraft: instruction first, context second, input fenced, format last.',
        },
        {
          type: 'prose',
          id: 'optional-extras',
          heading: 'The two optional extras',
          body: [
            "**Role** — *\"Act as a customer service supervisor…\"* — steers vocabulary, tone, and priorities. Gate 2 is all about this lever.",
            "**Examples** — show one or two finished samples and the model matches their shape. That's *few-shot* prompting, Gate 3's home base. Zero examples at all? That's *zero-shot* — fine for simple, well-specified tasks.",
          ],
        },
        {
          type: 'compare',
          id: 'compare-loadout',
          title: 'The full loadout, side by side',
          weak: 'Airport stuff — make it better.',
          strong:
            'You are an executive assistant at Indianapolis International Airport. [ROLE]\nSummarize the report below for the executive team ahead of the 8 a.m. briefing. [INSTRUCTION + CONTEXT]\nReport: """…irregular-ops report text…""" [INPUT]\nReturn 5 bullet points, 120 words max. [OUTPUT FORMAT]',
        },
        {
          type: 'stat',
          id: 'stat-six-parts',
          value: 6,
          suffix: 'parts',
          caption:
            'Four do most of the work — instruction, context, input, output format — with role and examples riding as optional extras. Name them and the model never has to guess.',
        },
        {
          type: 'knowledgeCheck',
          id: 'kc-anatomy',
          question:
            'A colleague\'s prompt reads in full: "Airport stuff — make it better." Which anatomy parts are present?',
          options: [
            {
              text: 'All six parts, just brief.',
              correct: false,
              feedback:
                "Brevity is fine; absence isn't. There is no task, no input, and no format to execute against.",
            },
            {
              text: 'Only a vague topic — no instruction, input, or output format.',
              correct: true,
              feedback:
                "Exactly: there's nothing to steer by. One verb, real input, and a specified output would fix it.",
            },
            {
              text: 'Instruction and context.',
              correct: false,
              feedback:
                '"Make it better" isn\'t an executable instruction, and a topic isn\'t context.',
            },
          ],
        },
      ],
      takeaways: [
        'A prompt is **instruction + context + input + output format**, with optional **role** and **examples**.',
        "The model predicts likely text — it doesn't look things up. Precision in, quality out.",
        'Weak output? Rearrange the load before rewriting from scratch.',
      ],
    },

    // ── LEG 0.3 ────────────────────────────────────────────────────────────
    {
      id: '0.3',
      code: 'LEG 0.3',
      type: 'DEMO',
      title: 'Weak Prompt, Strong Prompt',
      description:
        'Same request, two prompts, visibly different outputs — the output morph that sells the whole course.',
      durationMin: 5,
      blocks: [
        {
          type: 'prose',
          id: 'same-request',
          heading: 'Same request. Different altitude.',
          body: [
            'Two prompts, one model, one moment in time. The only difference is what got typed. Watch the outputs land miles apart.',
            "Don't memorize these exact words — memorize the *shape* of the difference.",
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'gate-change-demo',
          label: 'SCENARIO: GATE CHANGE · F9 421',
          variantToggle: true,
          chips: ['ROLE', 'TASK', 'CONTEXT', 'FORMAT', 'LENGTH'],
          prompts: [
            {
              label: 'WEAK',
              text: 'Write something telling passengers the gate changed for flight F9 421.',
            },
            {
              label: 'STRONG',
              text: 'You are a customer service agent at Indianapolis International Airport. Flight F9 421 to Denver has moved from Gate A5 to Gate B12; boarding time is unchanged at 6:40 p.m. Write a 40-word gate-area announcement: lead with the flight and destination, state the new gate clearly, reassure passengers that boarding time is unchanged, and thank them. Tone: calm and clear.',
            },
          ],
          responses: [
            {
              label: 'WEAK',
              text: 'Attention passengers, there has been a gate change for your flight. Please check the monitors for more information. We apologize for any inconvenience and appreciate your patience while we make this adjustment.',
              annotations: ['Which flight? Which gate? The one thing passengers needed is missing.'],
            },
            {
              label: 'STRONG',
              text: 'Attention passengers on Frontier flight 421 to Denver: your departure gate has changed to Gate B12. Boarding time is unchanged at 6:40 p.m. Please make your way to Concourse B — our team at B12 is ready for you. Thank you for flying with us today.',
              annotations: ['Flight, destination, new gate, reassurance, thanks — every spec delivered.'],
            },
          ],
        },
        {
          type: 'prose',
          id: 'what-changed',
          heading: 'What actually changed',
          body: [
            'Read the strong prompt once more and count its parts: a **role** (customer service agent), one **task** with a strong verb (write), **context** (which flight, where to, what changed), an **output format** (a 40-word announcement), and a **tone** note. Five moves, all learnable.',
            "None of them require technical knowledge — just the discipline to say exactly what you want.",
          ],
        },
        {
          type: 'compare',
          id: 'compare-ops',
          title: 'One more: the storm-day ops summary',
          weak: 'Airport operations experienced delays today due to weather. Multiple flights were affected and crews worked hard to manage the situation. Passengers were informed as needed throughout the day. Conditions improved later in the evening and operations returned to normal.',
          strong:
            '• 27 arrivals delayed >30 min, concentrated 15:00–19:00 as storms parked over the field.\n• 2 ground stops held departures an average of 52 minutes.\n• 3 diversions — all recovered by 21:40; zero cancellations on the evening bank.\n• Deice pads were the constraint: taxi-out peaked at 47 minutes. Crews pre-staged for tomorrow.',
        },
        {
          type: 'callout',
          id: 'one-run-is-a-demo',
          variant: 'hold-short',
          title: 'Hold Short: one run is a demo, not a guarantee.',
          body: 'A single weak-vs-strong pair shows the lever, not the odds. Outputs vary from run to run — what precision buys you is a consistently better pattern, not a promise. Judge a prompt over several runs, the way you judge a procedure over a whole shift.',
        },
        {
          type: 'knowledgeCheck',
          id: 'kc-weak-strong',
          question: 'The strong prompt outperformed mainly because it…',
          options: [
            {
              text: 'used polite, professional language',
              correct: false,
              feedback:
                "Politeness is nice, but models don't need manners — they need specs. The strong prompt won on structure, not courtesy.",
            },
            {
              text: 'specified the task, context, format, and length',
              correct: true,
              feedback:
                'Exactly. Every missing spec is a guess the model has to make — and left alone, it guesses generically.',
            },
            {
              text: 'was longer',
              correct: false,
              feedback:
                "Length isn't the lever; information is. A long vague prompt still lands vague.",
            },
          ],
        },
        {
          type: 'callout',
          id: 'steal-shape',
          variant: 'tower',
          title: 'Tower Advisory: steal the shape.',
          body: "You don't need to invent great prompts under pressure. Take a prompt that worked, swap its parts for your task, and fly. The Flight Manual is full of copy-able airframes — Gates 1 through 4 stock the hangar.",
        },
        {
          type: 'quote',
          id: 'quote-mirror',
          text: 'Every output is a mirror. If you don’t like what you see, change what you showed it.',
          attribution: 'FROM THE FLIGHT CREW · IAA PROMPT ACADEMY',
        },
      ],
      takeaways: [
        'Same model, same moment — the prompt is the difference.',
        'Strong prompts specify task, context, format, and length.',
        "Keep a hangar of prompts that work; adapt, don't reinvent.",
      ],
    },

    // ── LEG 0.4 ────────────────────────────────────────────────────────────
    {
      id: '0.4',
      code: 'LEG 0.4',
      type: 'LESSON',
      title: 'Zero-Shot, Few-Shot & the Fragility Factor',
      description:
        'Same task, 0 vs 3 examples — and why wording and order can swing results dramatically.',
      durationMin: 6,
      blocks: [
        {
          type: 'prose',
          id: 'shots',
          heading: 'Shots: how many examples do you give?',
          body: [
            '**Zero-shot** prompting means no examples at all — just the instruction. For simple, well-specified tasks (summarize this, draft that), zero-shot is usually enough. You already do it all day.',
            '**Few-shot** prompting means showing the model one or more finished examples before asking it to perform. Examples teach shape: format, tone, level of detail — things that are awkward to describe but easy to *show*.',
            'One example is **one-shot**; two or more is few-shot. Same idea, more runway.',
          ],
        },
        {
          type: 'chipToggle',
          id: 'shot-demo',
          title: 'Same task, 0 examples vs 3',
          chips: [
            {
              label: 'ZERO-SHOT · 0 EXAMPLES',
              output:
                'PROMPT\nClassify each passenger comment as PRAISE, GRUMBLE, or URGENT.\nComment: "Shuttle from the economy lot took 25 minutes again and I nearly missed my flight."\n\nOUTPUT\nThis passenger seems frustrated with the shuttle service — it sounds like a recurring problem, and this time it nearly caused a missed flight. I would flag it as a serious grumble that deserves follow-up, possibly urgent depending on how the airport defines that.',
            },
            {
              label: 'FEW-SHOT · 3 EXAMPLES',
              output:
                'PROMPT\nClassify each passenger comment as PRAISE, GRUMBLE, or URGENT.\nComment: "New family restrooms by B6 are spotless." → PRAISE\nComment: "Gate agent announced boarding, then silence for 20 minutes." → GRUMBLE\nComment: "Elderly traveler down near carousel 4 — need help now." → URGENT\nComment: "Shuttle from the economy lot took 25 minutes again and I nearly missed my flight." →\n\nOUTPUT\nURGENT',
            },
          ],
        },
        {
          type: 'prose',
          id: 'why-examples-work',
          heading: 'Why examples work — and where they bite',
          body: [
            'The model is a pattern completer; an example is a pattern handed to it on a tray. It will match your examples\' format, order, and even their quirks — so keep exemplars **consistent**, **relevant**, and **varied** enough to cover the real cases. Gate 3 spends a full leg on exemplar design.',
            'Which brings us to the fragility factor. In published research, rephrasing a prompt — or merely reordering its few-shot examples — has swung task accuracy by double-digit margins. Not because the model is random, but because tiny wording differences point the prediction engine at slightly different patterns.',
            "The practical response isn't superstition ('never say X'); it's **iteration**. When an output disappoints, adjust wording, order, or examples and re-run. Gate 4 drills that loop until it's muscle memory.",
          ],
        },
        {
          type: 'stat',
          id: 'stat-fragility',
          value: 10,
          suffix: 'points',
          caption:
            '…or more. Reordering the examples in a few-shot prompt has swung measured accuracy by double digits in published tests. Same model, same task — different wording, different altitude.',
        },
        {
          type: 'sortDrill',
          id: 'shots-drill',
          title: 'Drill: just ask, or show examples?',
          bins: ['JUST ASK', 'SHOW EXAMPLES'],
          cards: [
            {
              text: 'Summarize this two-paragraph storm update in one sentence.',
              bin: 0,
              verdict: 'Simple, well-specified task — zero-shot earns it.',
            },
            {
              text: 'Rewrite tenant notices so they match the exact tone of these two samples.',
              bin: 1,
              verdict: 'Tone is easier shown than described — hand over the samples.',
            },
            {
              text: 'Convert 68°F to Celsius.',
              bin: 0,
              verdict: 'One fact, one formula — asking is enough.',
            },
            {
              text: 'Classify 200 survey comments into our house labels with the same judgment as these three examples.',
              bin: 1,
              verdict: 'Judgment calibrates from examples — 2–3 labeled samples steady the labels.',
            },
            {
              text: 'List three catering ideas for the tenant appreciation day.',
              bin: 0,
              verdict: 'Open brainstorm, no special format — just ask.',
            },
            {
              text: "Format the daily ops log exactly like last month's, down to the column order.",
              bin: 1,
              verdict: "'Exactly like this' means show the shape — an example is the spec.",
            },
          ],
          recap:
            "Zero-shot for simple, well-specified tasks; few-shot when format, tone, or judgment needs demonstrating. Start zero-shot — add shots when the shape isn't landing.",
        },
        {
          type: 'callout',
          id: 'fragility-callout',
          variant: 'tower',
          title: 'Tower Advisory: precision is a skill.',
          body: 'Fragility cuts both ways. The same sensitivity that makes a sloppy prompt wobble makes a well-tuned prompt responsive — small, deliberate edits produce real improvements. That sensitivity is the whole craft.',
        },
        {
          type: 'knowledgeCheck',
          id: 'kc-shots',
          question:
            "You're drafting a one-line summary of a two-paragraph storm update. What's the sensible first move?",
          options: [
            {
              text: 'Zero-shot: just ask for the one-line summary.',
              correct: true,
              feedback:
                "Right — simple, well-specified tasks don't need exemplars. Add examples when format or judgment needs demonstrating.",
            },
            {
              text: 'Few-shot with five examples, to be safe.',
              correct: false,
              feedback:
                'More examples ≠ more safety. They cost space, slow the run, and can drag the model toward quirks of your samples. Start zero-shot; add shots when the shape isn\'t landing.',
            },
            {
              text: 'Few-shot, because zero-shot never works.',
              correct: false,
              feedback:
                'Zero-shot works well for clear, simple tasks — you use it every time you ask a direct question. Few-shot is for teaching shape.',
            },
          ],
        },
        {
          type: 'prose',
          id: 'bridge-g1',
          heading: 'Cleared to Gate 1',
          body: [
            "You now speak the vocabulary: prompts, predictions, anatomy, shots. Next gate is where it gets operational — writing instructions so clear the model can't wander the airfield.",
          ],
        },
      ],
      takeaways: [
        'Zero-shot = no examples; few-shot = teach by example.',
        'Examples teach shape — keep them consistent, relevant, and varied.',
        'Wording and order move results. When output disappoints: edit and re-run.',
      ],
    },
  ],
  check: {
    title: 'Gate Check 0 — Preflight Inspection',
    questionCount: 5,
    passScore: 80,
  },
  labScenarioIds: [],
};
