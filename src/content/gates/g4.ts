import type { Gate } from '../types';

/**
 * G4 — On the Job at IND: Airport Task Patterns (module.md §7)
 * Accent: amber-600 · Boarding order 5/6 · ≈35 min
 * Sources: DeepLearning.AI task patterns + iterative loop (dim06),
 * Anthropic chaining (dim03), Vanderbilt Template/Recipe/Fact Check List (dim05).
 */
export const gate: Gate = {
  id: 'g4',
  index: 4,
  number: 'G4',
  title: 'On the Job at IND',
  subtitle:
    'Airport task patterns — Summarize, Infer, Transform, Expand, plus chaining and the iterate loop. The four workhorses of prompt work at a real airport.',
  accent: 'amber',
  boardingOrder: 5,
  approxMinutes: 35,
  objectives: [
    'Apply the four workhorse patterns — Summarize, Infer, Transform, Expand — to airport documents.',
    'Control output with word caps, focus instructions, JSON schemas, and tone dials.',
    'Chain prompts for complex deliverables: outline → draft → fact-check.',
    'Run the iterative loop: idea → prompt → result → error analysis → refine.',
  ],
  legs: [
    // ── LEG 4.1 ────────────────────────────────────────────────────────────
    {
      id: '4.1',
      code: 'LEG 4.1',
      type: 'LESSON',
      title: 'Summarize & Infer',
      description:
        'The two read-side workhorses: compress a 2-page winter-storm report into 5 bullets with a word cap, then pull sentiment and top-3 topics out of 8 survey comments as clean JSON.',
      durationMin: 9,
      takeaways: [
        'Summarize with a word cap and a focus instruction — "extract" when you want only the relevant pieces.',
        'Infer = analysis without training: sentiment, topics, and alerts straight from text.',
        'Ask for structured output (JSON) and a fallback value like "unknown" — and verify numbers against the source.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l41-intro',
          heading: 'Four workhorses, two per leg',
          body: [
            'Most airport AI work boils down to four patterns, first mapped by DeepLearning.AI\'s prompt course: **Summarize** (compress), **Infer** (analyze), **Transform** (reshape), **Expand** (draft). Learn to name them and you\'ll recognize them everywhere — every lab scenario in this academy is one of the four, or a chain of them.',
            'This leg covers the two *read-side* patterns — tasks that start from existing text. Summarize shrinks text faithfully. Infer reads between the lines: what does this commenter feel, what topics keep appearing, does anything need an alert?',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l41-summarize',
          label: 'WEAK ↔ STRONG — the winter-storm irregular-ops report',
          prompts: [
            {
              label: 'WEAK PROMPT',
              text: 'Sum up this report. """IRREGULAR OPS — WINTER STORM BLAIR (JAN 14, FICTITIOUS DRILL DATA): 41 departures delayed avg 52 min; 9 cancellations; de-ice queue peaked at 14 aircraft / 38 min; Runway 5L closed 09:40–11:15 (plow ops); 2 gate-return de-ice events; bag-room backlog ~420 bags cleared by 18:00; 3 passengers rebooked to morning bank; concessionaire staffing short in Concourse B…"""',
            },
            {
              label: 'STRONG PROMPT',
              text: 'You are an operations coordinator at IND. Summarize the irregular-ops report below for the executive team ahead of the 8 a.m. briefing.\nRules: exactly 5 bullets; 120 words max; focus on decisions the executive team must make today; flag any item needing their action with [DECISION].\nReport: """IRREGULAR OPS — WINTER STORM BLAIR (JAN 14, FICTITIOUS DRILL DATA): 41 departures delayed avg 52 min; 9 cancellations; de-ice queue peaked at 14 aircraft / 38 min; Runway 5L closed 09:40–11:15 (plow ops); 2 gate-return de-ice events; bag-room backlog ~420 bags cleared by 18:00; 3 passengers rebooked to morning bank; concessionaire staffing short in Concourse B…"""',
            },
          ],
          responses: [
            {
              label: 'WEAK OUTPUT',
              text: 'The airport had a difficult day due to Winter Storm Blair, with many delays and some cancellations. De-icing took a while and a runway was closed temporarily. Bags were backed up but got cleared, and some passengers were rebooked. Staffing was also an issue in one concourse.',
              annotations: [
                'Every number rounded into mush — "many," "a while," "temporarily." Useless for a decision.',
                'No structure, no flags, no idea what leadership should actually do.',
              ],
            },
            {
              label: 'STRONG OUTPUT',
              text: '• 41 departures delayed (avg 52 min), 9 cancellations — recovery complete by 18:00.\n• De-ice queue peaked at 14 aircraft / 38 min. [DECISION] Approve third de-ice pad MOU for Thursday\'s forecast.\n• Runway 5L closed 09:40–11:15 for plow ops; no damage reported.\n• Bag-room backlog of ~420 cleared by 18:00; 3 passengers rebooked to the morning bank.\n• [DECISION] Concourse B concessionaire staffing shortfall — approve temp staffing request.',
              annotations: [
                '5 bullets, under 120 words, numbers intact, decisions flagged.',
                'The word cap + focus instruction + [DECISION] tag did all the steering.',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Word cap', 'Audience focus', 'Decision flags', 'Numbers intact'],
        },
        {
          type: 'prose',
          id: 'l41-summarize-tactics',
          heading: 'The summarize toolkit',
          body: [
            'Three levers, all from the canonical playbook. **Length:** "in at most 120 words" — word and sentence caps work better than character caps, because models count in tokens, not letters. **Focus:** "focusing on any aspects that mention de-ice and runway status" — the same report summarizes differently for the airfield team than for public affairs, so name the audience\'s interest.',
            '**Extract vs. summarize:** when you want only the relevant pieces — not a condensed everything — say `extract`. "Extract the items relevant to baggage operations, limit to 30 words" pulls just those lines; "summarize" lets other topics leak in. Subtle word, big behavioral difference.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l41-infer',
          label: 'THE INFER PASS — 8 survey comments (fictional drill data) → JSON',
          prompts: [
            {
              label: 'INFER PROMPT',
              text: 'Analyze the 8 passenger survey comments below (fictional drill data).\nReturn a JSON object with exactly these keys:\n- "overall_sentiment": "positive" | "mixed" | "negative"\n- "top_topics": the 3 most-mentioned topics, each 1–2 words\n- "needs_alert": true if any comment suggests a safety or accessibility issue, else false\n- "alert_reason": one sentence if needs_alert is true, else "none"\nIf information isn\'t present, use "unknown". Make the response as short as possible.\nComments: """1) Security line was 6 minutes — amazing. 2) No working outlets near B9. 3) Signage to rental cars confusing again. 4) Wheelchair assist took 40 minutes at curb — unacceptable. 5) Love the new local art in Civic Plaza. 6) Signage to rental cars confusing — missed my shuttle. 7) Outlets dead at A3 too. 8) Cleanest terminal bathrooms I\'ve seen."""',
            },
          ],
          responses: [
            {
              label: 'INFER OUTPUT',
              text: '{\n  "overall_sentiment": "mixed",\n  "top_topics": ["signage", "outlets", "cleanliness"],\n  "needs_alert": true,\n  "alert_reason": "Comment 4 reports a 40-minute wheelchair-assist wait — an accessibility service failure to escalate."\n}',
              annotations: [
                'No training data, no code — one prompt replaced a small analytics pipeline.',
                'The "needs_alert" key is a zero-shot topic alert: the model flags what matters.',
                'Note the escape hatch: "If information isn\'t present, use \'unknown\'" — no forced guesses.',
              ],
            },
          ],
        },
        {
          type: 'prose',
          id: 'l41-infer-tactics',
          heading: 'The infer toolkit',
          body: [
            'The canonical moves: constrain the label set ("either \\"positive\\" or \\"negative\\""), cap the list ("no more than five items"), demand a format ("a JSON object with Sentiment, Anger, Item and Brand as the keys"), and always name a fallback — `use "unknown" as the value` — so missing information surfaces as a declared gap instead of an invented one.',
            'The **topic alert** pattern is the operational gem: give the model a watchlist ("check whether any comment mentions accessibility, safety, or security — answer 0 or 1 for each") and route anything flagged to a human. Zero-shot classification, no machine-learning team required. At IND that\'s how a survey pile becomes a Monday-morning escalation list.',
          ],
        },
        {
          type: 'prose',
          id: 'l41-batch',
          heading: 'The batch habit: one good prompt, twenty-five documents',
          body: [
            'Both read-side patterns scale the same way: write the prompt once, run it per document. Twenty-five guest comments through one infer prompt gives you twenty-five comparable labels — and comparable labels are what turn a comment pile into a Monday-morning escalation list with counts. The airport industry\'s own research names this exact use: the ACRP\'s sector-wide AI study describes GenAI tools interpreting traveler feedback and proactively flagging operational or service issues.',
            'Two batch rules keep the data honest. **Freeze the prompt** — same wording, same schema for every run, so differences in output mean differences in the comments, not in your instructions. **Sample-check by hand** — read three or four results against the originals before you trust run twenty-five. Batch work inherits any flaw in the prompt at full volume; Gate 5\'s verification habit is what keeps the volume honest.',
          ],
        },
        {
          type: 'knowledgeCheck',
          id: 'l41-check',
          question:
            'Which is the best summarize prompt for a 2-page storm report headed to the executive team?',
          options: [
            {
              text: '"Summarize this report and make it short and interesting."',
              correct: false,
              feedback:
                'GO AROUND — "short" and "interesting" are unmeasurable vibes. Short how? Interesting to whom? The model will guess, and every rerun guesses differently.',
            },
            {
              text: '"Summarize for the executive team: exactly 5 bullets, ≤120 words, focusing on decisions needed today; flag action items with [DECISION]. Report: """…""" "',
              correct: true,
              feedback:
                'CLEARED — audience + focus instruction + hard length cap + explicit format + a decision flag. Every output dimension is specified, so the model doesn\'t have to guess any of them.',
            },
            {
              text: '"Read this report and tell me everything important that happened, in detail."',
              correct: false,
              feedback:
                'GO AROUND — "everything important, in detail" is how you get a 2-page summary of a 2-page report. A summary must compress; compression needs a cap and a focus.',
            },
          ],
        },
        {
          type: 'callout',
          id: 'l41-verify',
          variant: 'tower',
          title: 'Tower Advisory: numbers must match the source exactly.',
          body: 'Summaries and inferences inherit every number from the source — or invent new ones. Before a summary goes to the board, diff every figure against the original by hand. "41 departures, avg 52 min" is a fact; "many flights were delayed" is a shrug. Gate 5 makes verification a house rule.',
        },
      ],
    },
    // ── LEG 4.2 ────────────────────────────────────────────────────────────
    {
      id: '4.2',
      code: 'LEG 4.2',
      type: 'LESSON',
      title: 'Transform & Expand',
      description:
        'The two write-side workhorses: morph a terse radio log into a calm public statement (Transform), then grow a one-line idea into a full tenant email with the tone dial (Expand).',
      durationMin: 9,
      takeaways: [
        'Transform = same information, new shape: tone shifts, format conversions, translation, proofreading.',
        'Expand = short input, full draft — steer it with audience, purpose, and a tone dial.',
        '"Proofread and correct" is a transform — and "if no errors, say so" keeps it honest.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l42-intro',
          heading: 'Same cargo, new container',
          body: [
            '**Transform** reshapes text without adding new substance: a radio log becomes a public statement, a table becomes HTML, slang becomes a business letter, a rough draft becomes a clean one. The canonical course example is gloriously blunt: "Translate the following from slang to a business letter." Same facts — new register.',
            '**Expand** runs the other direction: you supply a seed — a sentence, a bullet, a sentiment — and the model grows it into a full draft. Both are write-side patterns, and both live or die by one lever you haven\'t used much yet: **tone**.',
          ],
        },
        {
          type: 'compare',
          id: 'l42-transform',
          title: 'Radio log → public statement',
          weak: 'OPS LOG 13:47 — ESC B-4 U/S, PAX LOAD DIVERTED TO B-2, TECH ENROUTE ETA 30, WILL ADVISE. (Escalator B-4 unserviceable; passengers diverted; technician en route.)',
          strong:
            'The escalator serving Concourse B, Gate area B-4, is temporarily out of service while our maintenance team completes a repair — expected back within the hour. Elevators and the B-2 escalator remain open nearby, and our team can assist anyone who needs an extra hand.',
        },
        {
          type: 'typeAndRespond',
          id: 'l42-transform-prompt',
          label: 'THE TRANSFORM PROMPT — specify the target register',
          prompts: [
            {
              label: 'TRANSFORM',
              text: 'Transform the maintenance radio log below into a public-facing status statement for the terminal displays.\nRules: 2 sentences; calm, plain language; no jargon, no codes, no abbreviations; state the alternative route; do not speculate about the cause.\nLog: """13:47 ESC B-4 U/S, PAX LOAD DIVERTED TO B-2, TECH ENROUTE ETA 30, WILL ADVISE"""',
            },
          ],
          responses: [
            {
              label: 'TRANSFORM OUTPUT',
              text: 'The escalator near Gate B-4 is temporarily out of service while our team completes a repair, expected within the hour. Please use the nearby elevators or the B-2 escalator — our staff is glad to assist.',
              annotations: [
                'Every rule obeyed: 2 sentences, zero jargon, alternative stated, no cause speculation.',
                '"Do not speculate about the cause" matters — the log doesn\'t say why, so the statement can\'t either (grounding, from Gate 2).',
              ],
            },
          ],
        },
        {
          type: 'prose',
          id: 'l42-expand',
          heading: 'Expand: the one-line idea becomes the draft',
          body: [
            'Expanding is how a sticky note becomes a first draft: "Draft the tenant email about the early-morning delivery-window change" plus three facts grows into a full, sendable starting point. The canonical recipe (from the customer-email playbook): give the role, the seed facts, the conditional behavior, the specific details to use, and the tone — `Write in a concise and professional tone` — and the model fills the frame.',
            'Two cautions that travel with the pattern. First, expand from *your* facts — an expanded draft full of invented specifics is worse than no draft. Second, the first expansion is a starting point, not a send button; Leg 4.4 is about what happens next.',
          ],
        },
        {
          type: 'chipToggle',
          id: 'l42-tone-dial',
          title: 'The tone dial — same tenant email, three registers',
          chips: [
            {
              label: 'Formal',
              output:
                'Dear Concourse A Tenants: Please be advised that effective March 3, early-morning service-corridor deliveries will be temporarily rerouted via the A-side corridor between 11 p.m. and 5 a.m., for approximately six weeks. Kindly direct questions to the properties desk at ext. 2147.',
            },
            {
              label: 'Reassuring',
              output:
                'Hi everyone — quick heads-up: from March 3, overnight construction means pre-6 a.m. deliveries take the A-side corridor for about six weeks. Your storefronts won\'t be affected, nothing closes, and we\'ll have wayfinding flags up on night one. Questions anytime: ext. 2147.',
            },
            {
              label: 'Urgent',
              output:
                'ACTION NEEDED by Friday: If you receive deliveries before 6 a.m., confirm your driver has the new A-side corridor route BEFORE March 3. Overnight construction starts Monday — unbriefed drivers will be turned around at the B checkpoint. Confirm with the properties desk: ext. 2147.',
            },
          ],
        },
        {
          type: 'prose',
          id: 'l42-proofread',
          heading: 'The quietest transform: proofread',
          body: [
            'One more transform worth a standing spot in your toolkit: `Proofread and correct the following text and rewrite the corrected version. If you don\'t find any errors, just say "No errors found."` It catches homonyms, agreement slips, and punctuation before your board packet does.',
            'The `if no errors, say so` tail matters for the same reason grounding did in Gate 2: without a declared "nothing wrong" state, a helpful model will sometimes "fix" text that was never broken. Give every task an honest way to say *no change needed*.',
          ],
        },
        {
          type: 'callout',
          id: 'l42-translation',
          variant: 'hold-short',
          title: 'Hold Short: translated ≠ reviewed.',
          body: 'Translation is a transform — and the easiest one to over-trust, because you often can\'t read the output. An unreviewed AI translation can drop a "not," flip a direction, or formalize the wrong word for a wayfinding sign. House rule for passenger-facing languages: AI drafts, a qualified human reviews before anything posts. Peer airports run live translation tools (JFK Terminal 4 interprets 29 languages) — with staff oversight, not autopilot. Gate 5 turns this into doctrine: a human owns every published word.',
        },
        {
          type: 'knowledgeCheck',
          id: 'l42-check',
          question:
            '"Take this one-line idea — remind tenants about the roof-work noise window — and draft a full 150-word notice." Which pattern is this?',
          options: [
            {
              text: 'Transform — we\'re changing the text\'s shape.',
              correct: false,
              feedback:
                'GO AROUND — a transform preserves the substance and changes the container. Here there\'s almost no source substance; the model must grow a full document from a seed.',
            },
            {
              text: 'Expand — short input grown into a full draft.',
              correct: true,
              feedback:
                'CLEARED — one line in, 150 words out: textbook Expand. Steer it with audience, facts, and the tone dial, and fact-check the grown details before it ships.',
            },
            {
              text: 'Infer — the model is analyzing the idea.',
              correct: false,
              feedback:
                'GO AROUND — infer extracts labels, topics, and sentiment from existing text. Nothing is being analyzed here; a new document is being drafted.',
            },
          ],
        },
      ],
    },
    // ── LEG 4.3 ────────────────────────────────────────────────────────────
    {
      id: '4.3',
      code: 'LEG 4.3',
      type: 'LESSON',
      title: 'Prompt Chaining: The Jet Bridge Method',
      description:
        'Big deliverables don\'t fit in one prompt — they connect in hops, like jet bridges: outline → draft → fact-check, the output improving at every gate.',
      durationMin: 9,
      takeaways: [
        'One prompt, one job: chain outline → draft → fact-check instead of asking for everything at once.',
        'The Template pattern locks output into placeholders; the Recipe pattern fills in missing steps.',
        'The Fact Check List pattern makes the model list the facts its output depends on — your verification checklist.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l43-intro',
          heading: 'Nobody boards through one door',
          body: [
            'A passenger doesn\'t teleport from curb to seat: curb → check-in → security → gate → jet bridge → seat, each hop with its own check. Complex documents work the same way. Ask for "a finished board brief about the parking revenue numbers" in one prompt and you\'ll get a confident mess. Ask in **chained hops** — outline, then draft, then check — and each hop is small, verifiable, and fixable.',
            'Anthropic\'s docs teach this as chaining complex prompts: break the task into subtasks, where each step\'s output becomes the next step\'s input. The win isn\'t just quality — it\'s *control*. When the final brief disappoints, you can tell which hop failed and re-run only that one.',
          ],
        },
        {
          type: 'sceneVideo',
          id: 'l43-video',
          title: 'The chain, gate by gate',
          duration: 40,
          scenes: [
            {
              id: 'gate1',
              layers: ['gate-sign-1', 'doc-card', 'outline-lines'],
              keyframes: {
                '0-10s':
                  'A raw revenue table card taxis to Gate 1 (OUTLINE). Three numbered outline lines print onto a boarding-pass-shaped card.',
              },
            },
            {
              id: 'gate2',
              layers: ['gate-sign-2', 'outline-card', 'paragraph-blocks'],
              keyframes: {
                '10-22s':
                  'The outline card taxis to Gate 2 (DRAFT). Paragraph blocks snap onto each outline line; a brief assembles paragraph by paragraph.',
              },
            },
            {
              id: 'gate3',
              layers: ['gate-sign-3', 'brief-card', 'checklist-rows', 'stamp'],
              keyframes: {
                '22-33s':
                  'The draft taxis to Gate 3 (FACT-CHECK). A checklist rolls down; each row flips green as numbers are compared against the source table. One row flashes amber and gets corrected.',
              },
            },
            {
              id: 'departure',
              layers: ['brief-card', 'stamp', 'plane'],
              keyframes: {
                '33-40s':
                  'The checked brief receives a CLEARED stamp; a plane lifts off behind the three gate signs, which stay lit in sequence.',
              },
            },
          ],
          captions: [
            { t0: 0, t1: 10, text: 'Hop 1 — OUTLINE: turn the source table into 3 takeaways, 1 risk, 1 recommendation.' },
            { t0: 10, t1: 22, text: 'Hop 2 — DRAFT: expand the approved outline into the brief, one section at a time.' },
            { t0: 22, t1: 33, text: 'Hop 3 — FACT-CHECK: list the facts the draft depends on; verify each against the source.' },
            { t0: 33, t1: 40, text: 'Three small, auditable hops — instead of one giant leap you can\'t inspect.' },
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l43-chain',
          label: 'THE THREE HOPS — parking-revenue board brief (fictional figures)',
          prompts: [
            {
              label: 'HOP 1 · OUTLINE',
              text: 'From the revenue table below (fictional drill data), outline a board brief: 3 key takeaways, 1 risk, 1 recommendation. Bullets only — no prose paragraphs yet.\nTable: """Q3 parking revenue: garage $4.2M (+8% YoY); economy $2.9M (+3%); valet $0.4M (−12%); online reservations now 31% of transactions (was 22%)."""',
            },
            {
              label: 'HOP 2 · DRAFT',
              text: 'Using the approved outline above, draft the brief: ≤180 words, board tone, every number must match the source table exactly.',
            },
            {
              label: 'HOP 3 · FACT-CHECK',
              text: 'List the fundamental facts contained in the draft that could undermine its veracity if any of them are incorrect. Format: numbered list — fact, then the source line to check it against.',
            },
          ],
          responses: [
            {
              label: 'HOP 1 OUTPUT',
              text: 'T1: Total parking revenue up, led by garage (+8% YoY). T2: Online reservations jumped 22% → 31% of transactions. T3: Valet declined 12%. RISK: valet trend may reflect staffing or demand shift. REC: expand online-reservation incentives; review valet pricing/staffing.',
            },
            {
              label: 'HOP 2 OUTPUT',
              text: 'Parking revenue remained strong in Q3, led by the garage at $4.2M (+8% year over year) and economy at $2.9M (+3%). Online reservations grew from 22% to 31% of transactions — evidence that convenience pricing is working. Valet fell 12% to $0.4M, the only declining product; the decline may reflect staffing constraints or shifting demand. Recommendation: expand online-reservation incentives and review valet pricing and staffing before Q4.',
              annotations: [
                'Each outline bullet became one controlled move — nothing improvised.',
              ],
            },
            {
              label: 'HOP 3 OUTPUT',
              text: '1. Garage revenue $4.2M, +8% YoY — check vs. table row "garage". 2. Economy $2.9M, +3% — check row "economy". 3. Valet $0.4M, −12% — check row "valet". 4. Reservations 22% → 31% — check "online reservations" line. 5. "Convenience pricing is working" — interpretive claim; confirm with finance before presenting as cause.',
              annotations: [
                'This is the Fact Check List pattern: the model exposes the load-bearing facts so a human can verify them.',
                'Item 5 is the catch of the day — a causal claim that was never in the table.',
              ],
            },
          ],
        },
        {
          type: 'promptBuilder',
          id: 'l43-builder',
          title: 'Assemble the three-hop chain',
          parts: [
            {
              id: 'source',
              label: 'SOURCE',
              caption: 'The raw material, fenced in delimiters — every hop works from it.',
            },
            {
              id: 'outline',
              label: 'HOP 1 · OUTLINE PROMPT',
              caption: 'Structure first: takeaways, risk, recommendation — bullets only.',
            },
            {
              id: 'draft',
              label: 'HOP 2 · DRAFT PROMPT',
              caption: 'Expand the approved outline with caps: length, tone, fidelity.',
            },
            {
              id: 'check',
              label: 'HOP 3 · FACT-CHECK PROMPT',
              caption: 'List the load-bearing facts and the source line for each.',
            },
          ],
          previewTemplate:
            '{source} Table: """Q3 parking revenue…"""\n{outline} From the table, outline a board brief: 3 takeaways, 1 risk, 1 recommendation. Bullets only.\n{draft} Using the approved outline, draft ≤180 words, board tone, every number must match the source exactly.\n{check} List the fundamental facts the draft depends on — numbered, each with the source line to verify it against.',
          cannedResponse:
            'Chain complete: outline approved (3 takeaways, 1 risk, 1 rec) → draft produced at 174 words with all figures matching the table → fact-check list returned 5 facts to verify, 4 confirmed against source lines, 1 interpretive claim flagged for finance sign-off.',
        },
        {
          type: 'prose',
          id: 'l43-patterns',
          heading: 'Two chain companions: Template and Recipe',
          body: [
            'The **Template pattern** (Vanderbilt) locks a hop\'s output into a fixed shape: "I am going to provide a template for your output. CAPITALIZED WORDS are my placeholders for content. Please preserve the formatting and overall template that I provide." Perfect for recurring artifacts — the weekly ops flash, the tenant notice — where every issue must look identical.',
            'The **Recipe pattern** fills in missing steps toward a goal: "I would like to achieve X. I know that I need to perform steps A, B, C. Provide a complete sequence of steps for me. Fill in any missing steps." Use it when you know the start and the destination but not every taxiway between — like planning the full production of a board packet from raw data to printed brief.',
          ],
        },
        {
          type: 'callout',
          id: 'l43-errors',
          variant: 'tower',
          title: 'Tower Advisory: verify between hops.',
          body: 'An error at Gate 1 rides the whole jet bridge: a wrong takeaway in the outline becomes a wrong paragraph in the draft becomes a "verified" wrong fact in the check. Read each hop\'s output before feeding it forward — that\'s the whole point of building gates into the process.',
        },
        {
          type: 'quote',
          id: 'l43-quote',
          text: 'Each subtask gets the model\'s full attention: accuracy, clarity, and a trail you can debug.',
          attribution: 'ANTHROPIC DOCS · CHAIN COMPLEX PROMPTS (PARAPHRASED)',
        },
        {
          type: 'knowledgeCheck',
          id: 'l43-check',
          question: 'What is the correct order for a chained board-brief workflow?',
          options: [
            {
              text: 'Draft → outline → fact-check',
              correct: false,
              feedback:
                'GO AROUND — drafting before outlining is how briefs ramble. The outline is where you decide what the brief is *about*; the draft only executes that decision.',
            },
            {
              text: 'Outline → draft → fact-check',
              correct: true,
              feedback:
                'CLEARED — structure first, prose second, verification last. Each hop is small and checkable, and errors get caught at the gate where they\'re cheapest to fix.',
            },
            {
              text: 'Fact-check → outline → draft',
              correct: false,
              feedback:
                'GO AROUND — there\'s nothing to fact-check until a draft exists. The Fact Check List runs on the draft\'s claims, not on thin air.',
            },
          ],
        },
      ],
    },
    // ── LEG 4.4 ────────────────────────────────────────────────────────────
    {
      id: '4.4',
      code: 'LEG 4.4',
      type: 'DRILL',
      title: 'The Iterate Loop',
      description:
        'Nobody\'s first prompt is their best. Fly the loop — idea, prompt, result, error analysis, refine — and pick the round-2 revision that actually fixes the round-1 failure.',
      durationMin: 8,
      takeaways: [
        'The loop: idea → prompt → result → error analysis → refine. Process beats memorized prompts.',
        'Diagnose before you rewrite: too long? add a cap. Wrong focus? name the audience. Missing fields? specify the format.',
        'Change one thing per round so you can see what worked.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l44-intro',
          heading: 'Prompts are flown in, not parked',
          body: [
            'Andrew Ng\'s iterative lesson makes a liberating claim: there is no perfect prompt you were supposed to memorize — there\'s a **process** that finds the right prompt for your task. The loop mirrors any disciplined build: **Idea → Prompt → Result → Error analysis → Refine**, repeat. Try something clear and specific; analyze *why* the result isn\'t what you want; sharpen one thing; run it again.',
            'The canonical demo does exactly this with a product description: round 1 comes back too long (add a 50-word cap), round 2 targets the wrong details (name the audience — retailers, so focus on materials), round 3 needs structure (add the table spec). Three rounds, three surgical fixes — not three rewrites.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l44-round1',
          label: 'ROUND 1 — the first draft always taxis',
          prompts: [
            {
              label: 'ROUND 1 PROMPT',
              text: 'Write a board brief about Q3 parking revenue.\nTable: """Q3: garage $4.2M (+8% YoY); economy $2.9M (+3%); valet $0.4M (−12%); online reservations 31% of transactions (was 22%)."""',
            },
          ],
          responses: [
            {
              label: 'ROUND 1 OUTPUT',
              text: 'Parking is a vital part of the airport experience and an important non-aeronautical revenue stream for airports across the country. At Indianapolis International Airport, Q3 parking results were largely positive across several product lines, reflecting continued strength in travel demand and the success of recent initiatives. The garage product led the way with $4.2M in revenue, representing an 8% year-over-year increase, while the economy lot contributed $2.9M, up 3%. Online reservation adoption continued to climb, reaching 31% of transactions compared to 22% previously. Valet revenue, however, declined 12% to $0.4M, which warrants further analysis. Overall, the quarter demonstrates a healthy parking operation with opportunities for continued growth.',
              annotations: [
                'A 107-word paragraph of throat-clearing; the decision-relevant content is buried at the end.',
                'Error analysis: no length cap, no audience focus, no required structure. Three named faults — that\'s the diagnosis.',
              ],
            },
          ],
        },
        {
          type: 'knowledgeCheck',
          id: 'l44-check',
          question:
            'Round 1 came back long, fluffy, and unstructured (see above). Which round-2 revision actually fixes the diagnosed faults?',
          options: [
            {
              text: '"Try again, but make it punchier and more executive."',
              correct: false,
              feedback:
                'GO AROUND — "punchier" and "more executive" are vibes, not specs. You might get lucky, but you can\'t reproduce luck — and you\'ve changed nothing measurable.',
            },
            {
              text: '"Rewrite as a board brief: 3 key takeaways, 1 risk, 1 recommendation; ≤180 words; open with the biggest number; every figure must match the table exactly."',
              correct: true,
              feedback:
                'CLEARED — every diagnosed fault now has a countermeasure: structure (3-1-1), length (≤180 words), focus (open with the biggest number), fidelity (figures must match). That\'s error analysis converted into spec.',
            },
            {
              text: '"You are a world-class McKinsey board consultant. Write the brief again, better this time."',
              correct: false,
              feedback:
                'GO AROUND — a bigger persona doesn\'t fix a missing spec. The round-1 failure was structural, not motivational.',
            },
          ],
        },
        {
          type: 'compare',
          id: 'l44-round3',
          title: 'Round 1 vs. round 3 — the loop, completed',
          weak: 'Parking is a vital part of the airport experience and an important non-aeronautical revenue stream… [107 words] …which warrants further analysis. Overall, the quarter demonstrates a healthy parking operation with opportunities for continued growth.',
          strong:
            'TAKEAWAYS: Garage led Q3 parking at $4.2M, up 8% year over year — the biggest line in the table. Economy added $2.9M, up 3%. Online reservations climbed to 31% of transactions, from 22%. RISK: Valet fell 12% to $0.4M — the only declining product, and the table states no cause. RECOMMENDATION: Expand online-reservation incentives; review valet pricing and staffing.',
        },
        {
          type: 'prose',
          id: 'l44-moves',
          heading: 'The error-analysis phrasebook',
          body: [
            'Most disappointing outputs fail in one of four named ways, and each has a one-line countermeasure. **Too long / too short** → set a hard cap: "≤180 words" or "exactly 5 bullets." **Wrong focus** → name the audience and their decision: "for the executive team, focusing on decisions needed today." **Missing or mangled fields** → specify the format explicitly: keys, columns, placeholders (Template pattern). **Invented content** → ground it (Gate 2): "use only the table; if a figure isn\'t there, say so."',
            'One discipline that separates pilots from passengers: **change one thing per round**. Rewrite three things at once and you\'ll never know which edit landed. Log what you changed — the Prompt Lab debrief does this for you automatically.',
          ],
        },
        {
          type: 'prose',
          id: 'l44-journal',
          heading: 'Keep a prompt journal',
          body: [
            'The loop compounds only if you can see your own rounds. Keep a scrappy journal for any recurring prompt: **round number, what I changed, what the output did.** Three lines per round. After a month you own something better than a good prompt — you own the record of *which edits move which failures*, tuned to your actual desk work.',
            'This is the same discipline the course\'s iterative lesson demonstrates: nobody\'s first prompt survived contact with the first output, and the winners weren\'t better guessers — they were better record-keepers. In the Prompt Lab, the debrief report plays this role automatically: every attempt, every rubric note, logged.',
          ],
        },
        {
          type: 'callout',
          id: 'l44-firstmove',
          variant: 'tower',
          title: 'Tower Advisory: the first move is diagnosis, not deletion.',
          body: 'When an output disappoints, resist the urge to nuke the prompt and start over. Name the failure in one sentence ("too long, buried decision, no structure"), add the one countermeasure, and re-run. The loop is faster than the bonfire — and it compounds into prompts you\'ll reuse for years.',
        },
        {
          type: 'quote',
          id: 'l44-quote',
          text: 'There\'s no perfect prompt to memorize. There\'s a good process to learn — and it fits in a loop you can fly every time.',
          attribution: 'AFTER ANDREW NG · ITERATIVE PROMPT DEVELOPMENT',
        },
      ],
    },
  ],
  check: {
    title: 'Gate Check 4 — Clearance Exam',
    questionCount: 5,
    passScore: 80,
  },
  labScenarioIds: ['WTP-L02', 'WTP-L06', 'WTP-L07'],
};

/** Named export for registry imports (task spec: g2/g3/g4/g5 per file). */
export const g4 = gate;

export default gate;
