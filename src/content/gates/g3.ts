import type { Gate } from '../types';

/**
 * G3 — Navigation by Examples: Few-Shot & Reasoning (module.md §7)
 * Accent: slate-600 · Boarding order 4/6 · ≈30 min
 * Wing: CoT Navigator (all legs + a step-by-step lab prompt)
 * Sources: Prompt Report / promptingguide taxonomy (dim04), Google whitepaper
 * step-back (dim01), OpenAI Principle 2 tactics (dim02), DeepLearning.AI (dim06).
 */
export const gate: Gate = {
  id: 'g3',
  index: 3,
  number: 'G3',
  title: 'Navigation by Examples',
  subtitle:
    'Few-shot & reasoning — teach the model by showing it finished work, and know when to make it show its own.',
  accent: 'slate',
  boardingOrder: 4,
  approxMinutes: 30,
  objectives: [
    'Distinguish zero-shot, one-shot, and few-shot prompting — and when each is enough.',
    'Design exemplars that are format-consistent, diverse, balanced, and relevant.',
    'Invoke chain-of-thought with "Let\'s think step by step" and specify-the-steps — on non-reasoning models, or whenever an auditable trail is the deliverable.',
    'Use step-back prompting to activate general principles before the specific task.',
    'Judge when reasoning helps — and when it\'s overkill.',
  ],
  legs: [
    // ── LEG 3.1 ────────────────────────────────────────────────────────────
    {
      id: '3.1',
      code: 'LEG 3.1',
      type: 'LESSON',
      title: 'Show, Don\'t Just Tell',
      description:
        'Zero-shot asks. Few-shot shows. Build a sentiment classifier for passenger comments out of 2–3 examples — and learn the four rules that make exemplars work.',
      durationMin: 8,
      takeaways: [
        'Zero-shot = no examples; one-shot = one; few-shot = a handful. Examples teach the task in context.',
        'Exemplar rules: consistent format, balanced labels, diverse inputs, relevant to the real task.',
        'Examples teach format and label space more than facts — order and wording can swing results.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l31-intro',
          heading: 'The example ladder',
          body: [
            '**Zero-shot** prompting is what you\'ve done all course: ask, with no examples. For clear, well-specified tasks it works fine. **One-shot** adds a single finished example. **Few-shot** adds a handful — usually two to five — and something remarkable happens: the model picks up the *task itself* from your examples, with no training and no weight updates. Researchers call this **in-context learning**.',
            'Why bother? Because some tasks are easier to show than to describe. "Label each passenger comment POSITIVE, NEGATIVE, or MIXED, and nothing else" is a decent instruction. Three finished examples of exactly that is a *demonstration* — and models imitate demonstrations far more reliably than they obey abstract descriptions, especially when your label set or format is unusual.',
          ],
        },
        {
          type: 'promptBuilder',
          id: 'l31-builder',
          title: 'Few-shot builder — assemble the exemplars',
          parts: [
            {
              id: 'instruction',
              label: 'INSTRUCTION',
              caption: 'Still needed — examples steer, the instruction captains.',
            },
            {
              id: 'ex1',
              label: 'EXAMPLE 1',
              caption: 'First finished sample — sets the format the model will copy.',
            },
            {
              id: 'ex2',
              label: 'EXAMPLE 2',
              caption: 'A different label — keeps the model from parroting one answer.',
            },
            {
              id: 'ex3',
              label: 'EXAMPLE 3',
              caption: 'A tricky case — teaches the edge, in the same format.',
            },
            {
              id: 'input',
              label: 'NEW INPUT',
              caption: 'The real comment to classify, clearly separated.',
            },
            {
              id: 'format',
              label: 'OUTPUT FORMAT',
              caption: 'One word, nothing else — no essays from a classifier.',
            },
          ],
          previewTemplate:
            '{instruction} Classify each passenger comment as POSITIVE, NEGATIVE, or MIXED.\n{ex1} "The new parking garage shuttle was fast and the driver helped with my bags." → POSITIVE\n{ex2} "Forty minutes at the bag claim. Unacceptable." → NEGATIVE\n{ex3} "Security line moved quickly, but the coffee near B7 was cold." → MIXED\n{input} Classify: "Gate agent rebooked me in two minutes, though the app never showed the delay."\n{format} Answer with exactly one label.',
          cannedResponse: 'MIXED',
        },
        {
          type: 'prose',
          id: 'l31-rules',
          heading: 'Four rules for exemplars that land',
          body: [
            '**1. Consistent format.** Every example must look identical in shape — same separators, same label casing, same order. The model copies the pattern; a broken pattern is a broken lesson. **2. Balanced labels.** If four of your five examples are NEGATIVE, the model leans NEGATIVE on everything. Mix classes, and mix their order.',
            '**3. Diverse inputs.** Vary length, topic, and phrasing so the model learns the task, not one comment\'s quirks. **4. Relevant.** Examples should come from the real task family — passenger comments for passenger comments, not product reviews from the internet. And one warning from the research: these choices are not cosmetic. Exemplar *order alone* has been shown to swing a model from near-perfect to random guessing on the same task.',
          ],
        },
        {
          type: 'stat',
          id: 'l31-stat',
          value: 90,
          suffix: '%',
          caption:
            'Of predictions that went NEGATIVE in one classic study when a 4-example prompt simply ended on a negative example — even though 3 of the 4 examples were positive. Order and balance steer the model hard (Zhao et al., 2021).',
        },
        {
          type: 'typeAndRespond',
          id: 'l31-broken-fixed',
          label: 'WEAK ↔ STRONG — same task, one broken exemplar set, one clean',
          prompts: [
            {
              label: 'BROKEN SET',
              text: 'Classify passenger comments.\n"Loved the new art in the terminal" = good\nComment: "No signage for the rental cars" Classification: NEGATIVE\n"cold coffee, friendly barista" is mixed feelings\nNow: "Boarding was fast but the wifi dropped twice."',
            },
            {
              label: 'CLEAN SET',
              text: 'Classify each passenger comment as POSITIVE, NEGATIVE, or MIXED. Answer with exactly one label.\n"Loved the new art in the terminal" → POSITIVE\n"No signage for the rental cars" → NEGATIVE\n"Cold coffee, friendly barista" → MIXED\n"Boarding was fast but the wifi dropped twice." →',
            },
          ],
          responses: [
            {
              label: 'BROKEN OUTPUT',
              text: 'The comment about boarding and wifi is somewhat mixed feelings with positive and negative aspects, Classification: could be MIXED or NEGATIVE.',
              annotations: [
                'Three formats in the examples → a wobbly, hedged answer in a fourth format.',
                'The model copied the mess, not the task.',
              ],
            },
            {
              label: 'CLEAN OUTPUT',
              text: 'MIXED',
              annotations: [
                'One label, exactly as specified — the consistent exemplars did the steering.',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Identical format', 'Balanced labels', 'Arrow separator', 'One-word output'],
        },
        {
          type: 'callout',
          id: 'l31-format',
          variant: 'tower',
          title: 'Tower Advisory: examples teach shape more than facts.',
          body: 'In a striking study, researchers replaced exemplar answers with random labels — and performance barely dropped. What carried the learning was the label space, the input style, and the format (Min et al., 2022). Translation for your desk: obsess over the *shape* of your examples first; it\'s doing more work than their content.',
        },
        {
          type: 'prose',
          id: 'l31-zeroshot',
          heading: 'Don\'t board examples you don\'t need',
          body: [
            'Few-shot is a tool, not a default. OpenAI\'s own guidance is to write general instructions first — they\'re more efficient than demonstrating every case by example — and reach for examples when the task is easier to show than to describe: an unusual label set, a house format that\'s fiddly to specify, a tone that\'s easier to point at than to explain. Anthropic\'s dose: when you do use examples, **3–5 diverse, relevant ones** is the working range.',
            'The airport translation: summarizing this week\'s ops log into 5 bullets? Zero-shot with a clear spec — you did that in Gate 1. Writing tenant notices in the Authority\'s exact house voice? That\'s a "show" task — two or three gold notices in the prompt will outperform a paragraph of adjectives about the voice.',
          ],
        },
        {
          type: 'knowledgeCheck',
          id: 'l31-check',
          question:
            'A teammate\'s few-shot prompt for tagging survey comments uses four exemplars: three labeled NEGATIVE, one labeled MIXED — each in a different layout. The model now tags nearly everything NEGATIVE. What\'s the primary flaw?',
          options: [
            {
              text: 'Four exemplars is too many — few-shot should never exceed two.',
              correct: false,
              feedback:
                'GO AROUND — two to five exemplars is standard, and harder tasks can use more. The count isn\'t the problem; what\'s inside them is.',
            },
            {
              text: 'The exemplars are unbalanced — three of four share one label, so the model leans that way.',
              correct: true,
              feedback:
                'CLEARED — majority-label bias: the model takes the label distribution of your examples as a hint. Balance the classes (and fix the inconsistent layouts while you\'re at it).',
            },
            {
              text: 'Sentiment tagging can\'t be few-shot prompted — it requires fine-tuning.',
              correct: false,
              feedback:
                'GO AROUND — classification is the classic few-shot use case. A balanced, format-consistent exemplar set would fix this prompt without any training at all.',
            },
          ],
        },
      ],
    },
    // ── LEG 3.2 ────────────────────────────────────────────────────────────
    {
      id: '3.2',
      code: 'LEG 3.2',
      type: 'LESSON',
      title: 'Let\'s Think Step by Step',
      description:
        'Multi-step questions break direct answers. Chain-of-thought makes the model show its work — the accuracy lever on standard models, and your transparency tool on 2026 reasoning models that think on their own.',
      durationMin: 8,
      takeaways: [
        'Chain-of-thought = intermediate reasoning steps before the final answer — "showing its work."',
        '"Let\'s think step by step" enables zero-shot CoT on standard (non-reasoning) models — no exemplars needed.',
        'On 2026 reasoning models, OpenAI advises zero-shot first — explicit step-by-step may not help and can hinder. Ask for steps when you need an audit trail a human can check.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l32-intro',
          heading: 'Direct answers skip the hard part',
          body: [
            'Ask a model a one-hop question — "what concourse is Gate B14 in?" — and a direct answer is perfect. Ask it a *multi-step* question — "with this wind shift, two regional jets in the de-ice queue, and one runway inspection due, which configuration should ops run at 6 a.m.?" — and a direct answer is a coin flip dressed as confidence.',
            '**Chain-of-thought prompting** (CoT) fixes the failure mode, not the model: you ask for the intermediate reasoning steps before the final answer. The researchers who named it showed that models that "show their work" solve multi-step problems that direct-answer prompting gets wrong. It\'s the same reason your high-school math teacher refused to grade an answer with no work shown.',
          ],
        },
        {
          type: 'sceneVideo',
          id: 'l32-video',
          title: 'Runway call, step by step',
          duration: 40,
          scenes: [
            {
              id: 'briefing',
              layers: ['weather-board', 'wind-arrow', 'queue-tags'],
              keyframes: {
                '0-6s':
                  'Ops briefing board fades in: wind shifting 240→310 at 18 kt, two regional jets in the de-ice queue, Runway 5R inspection scheduled 06:30.',
              },
            },
            {
              id: 'step1',
              layers: ['path-line', 'node-1', 'wind-compass'],
              keyframes: {
                '6-14s':
                  'Path draws to node 1. Wind compass rotates; crosswind component on 5L/23R computed and flagged red.',
              },
            },
            {
              id: 'step2',
              layers: ['path-line', 'node-2', 'queue-stack'],
              keyframes: {
                '14-22s':
                  'Node 2 pings: de-ice queue tags stack by departure priority; holding the queue past 06:15 cascades into the morning bank.',
              },
            },
            {
              id: 'step3',
              layers: ['path-line', 'node-3', 'options-scale'],
              keyframes: {
                '22-31s':
                  'Node 3: two configuration cards weigh on a scale — 5L/23R with crosswind vs 5R/23L with the inspection gap.',
              },
            },
            {
              id: 'conclusion',
              layers: ['path-line', 'node-4', 'conclusion-card'],
              keyframes: {
                '31-40s':
                  'Node 4: conclusion card slides up — run 5R/23L until 06:15, swap during the inspection window. Card stamps CLEARED.',
              },
            },
          ],
          captions: [
            { t0: 0, t1: 6, text: 'A multi-step ops question lands: which runway configuration for the 6 a.m. bank?' },
            { t0: 6, t1: 14, text: 'Step 1 — Read the wind: the shift puts a stiff crosswind on 5L/23R.' },
            { t0: 14, t1: 22, text: 'Step 2 — Count the queue: two regional jets must de-ice and launch before the bank.' },
            { t0: 22, t1: 31, text: 'Step 3 — Weigh the options: crosswind penalty vs. the 06:30 inspection gap.' },
            { t0: 31, t1: 40, text: 'Step 4 — Conclude: 5R/23L until 06:15, swap during inspection. Reasoning visible, answer defensible.' },
          ],
        },
        {
          type: 'stepReasoning',
          id: 'l32-steps',
          title: 'The same call — with and without the work shown',
          steps: [
            'Wind check: the 240→310 shift at 18 kt puts a significant crosswind component on 5L/23R for departures after 06:00.',
            'Queue check: two regional jets are in the de-ice queue; both must launch by ~06:15 or they miss the morning bank and strand 90+ connections.',
            'Options check: 5L/23R avoids the inspection conflict but accepts the crosswind; 5R/23L is wind-favorable but closes at 06:30 for inspection.',
            'Timing check: the 06:30 inspection leaves a usable 5R/23L window until 06:15 — long enough to launch the queue.',
          ],
          conclusion:
            'Run 5R/23L until 06:15 to launch the de-ice queue into the favorable wind, then use the 06:30 inspection window to swap the configuration. The answer follows from the steps — and anyone on the desk can audit them.',
          directAnswer:
            'Probably 5R/23L, but keep an eye on the weather and maybe ask the tower. (No reasoning shown — nothing to audit, nothing to trust.)',
        },
        {
          type: 'prose',
          id: 'l32-zeroshot',
          heading: 'The magic sentence — and the manual version',
          body: [
            'You don\'t need worked examples to get reasoning. Researchers found that simply appending `Let\'s think step by step` turns a plain question into a chain-of-thought — **zero-shot CoT**. The headline result, dated on purpose: on the **MultiArith** benchmark, that one sentence took OpenAI\'s **text-davinci-002** — a top model of 2022 — from 17.7% to 78.7% accuracy (Kojima et al., 2022). A useful workflow: let the model reason first, then ask it to conclude — "Therefore, the answer is…" — so the final line is clean enough to quote.',
            'When *you* already know the right procedure, skip the magic sentence and just **specify the steps**: "First check X. Then compare Y. Then recommend Z, and show each step." Guides file this tactic two ways — OpenAI lists "specify the steps" under writing clear instructions; DeepLearning.AI teaches it as giving the model "time to think." Either you hand it the checklist, or you invite it to build one. What you never want is a leap straight to the verdict.',
          ],
        },
        {
          type: 'prose',
          id: 'l32-reasoning-models',
          heading: 'The 2026 wrinkle: reasoning models bring their own chain',
          body: [
            'That 17.7→78.7 result came from a 2022-era model, and the era matters. Today\'s **reasoning models** — OpenAI\'s o-series and their peers — already run an internal chain of thought before they answer. For those, OpenAI\'s guidance flips: keep prompts simple and direct, **try zero-shot first**, and skip the magic sentence — instructing a reasoning model to "think step by step" *"may not enhance performance (and can sometimes hinder it)."* OpenAI\'s own framing: a reasoning model is like a senior coworker you hand a goal; a standard model is a junior coworker you hand a procedure.',
            'So when does step-by-step still earn its tokens? Two places. **On non-reasoning models**, where an explicit chain is still the accuracy lever this leg just taught. And **anywhere you need transparency** — a reconciliation, a decision you\'ll defend — because a written chain is auditable even when it doesn\'t raise accuracy. You\'re no longer asking for reasoning to make the model smarter; you\'re asking for it so a human can check the work.',
          ],
        },
        {
          type: 'prose',
          id: 'l32-outloud',
          heading: 'Thinking only counts out loud',
          body: [
            'Anthropic\'s docs put it in one blunt line: **"Always have Claude output its thinking. Without outputting its thought process, no thinking occurs!"** Asking for the right answer with no work shown isn\'t chain-of-thought; it\'s a wish. The reasoning has to be written down, token by token, for the accuracy benefit to exist at all.',
            'That has a practical wrinkle for public-facing work: reasoning you\'d audit is not text you\'d publish. The fix is a format instruction — "work through the problem inside `working:` lines, then give the final answer after `answer:`" — so you can read the reasoning, check it, and ship only the clean final line. Audit the work, publish the answer.',
          ],
        },
        {
          type: 'stat',
          id: 'l32-stat',
          value: 78.7,
          suffix: '%',
          caption:
            'Accuracy on the MultiArith benchmark after adding "Let\'s think step by step" — up from 17.7% on the identical questions, measured on OpenAI\'s 2022-era text-davinci-002, a non-reasoning model (Kojima et al., 2022).',
        },
        {
          type: 'knowledgeCheck',
          id: 'l32-check',
          question:
            'You need the model to reconcile three conflicting passenger counts across two flight manifests and a gate tally — a multi-step job. Which phrasing best sets it up?',
          options: [
            {
              text: '"Just give me the final passenger count — no explanation needed."',
              correct: false,
              feedback:
                'GO AROUND — a direct answer on a multi-step reconciliation is exactly where models slip. You\'ve also made the result impossible to audit.',
            },
            {
              text: '"Let\'s think step by step: compare each source, note where they disagree, then reconcile. Therefore, the final count is…"',
              correct: true,
              feedback:
                'CLEARED — zero-shot CoT plus a clean extraction line. The reasoning surfaces the disagreements; the "therefore" line gives you a quotable final answer.',
            },
            {
              text: '"You are an expert accountant with 30 years of experience. What is the count?"',
              correct: false,
              feedback:
                'GO AROUND — a persona changes the voice, not the reasoning depth. Expert-sounding leaps are still leaps.',
            },
          ],
        },
        {
          type: 'callout',
          id: 'l32-cost',
          variant: 'tower',
          title: 'Tower Advisory: reasoning isn\'t free.',
          body: 'Step-by-step output is longer — more tokens, more seconds, more to read. Spend it where a wrong answer costs you: reconciliations, multi-constraint decisions, anything you\'d ask a colleague to show their work on. Leg 3.4 is all about drawing that line.',
        },
      ],
    },
    // ── LEG 3.3 ────────────────────────────────────────────────────────────
    {
      id: '3.3',
      code: 'LEG 3.3',
      type: 'LESSON',
      title: 'Step Back, Then Solve',
      description:
        'Ask the general question first, feed the principle into the specific task, and the answer levels up. Plus: two instrument-rated techniques worth knowing by name.',
      durationMin: 7,
      takeaways: [
        'Step-back prompting: ask a general question first, then feed that answer into the specific prompt.',
        'Have the model work out its own solution before it judges someone else\'s.',
        'Self-consistency and tree-of-thought exist on the instrument-rated shelf — know them by name.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l33-intro',
          heading: 'Zoom out before you zoom in',
          body: [
            'Specific questions drag the model straight into the weeds — and the weeds are where generic, defensive answers grow. **Step-back prompting** (Google\'s whitepaper, and Zheng et al.\'s paper "Take a Step Back") adds one hop in front: first ask a general question about the *principles* behind the task, then feed that answer into the specific prompt as context.',
            'The whitepaper\'s definition, in plain terms: prompt the model "to first consider a general question related to the specific task at hand," then use that answer when you ask the specific one. The step back activates background knowledge — and keeps the specific answer honest to a principle instead of a mood.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l33-parking',
          label: 'WEAK ↔ STRONG — announcing a parking-rate change at IND',
          prompts: [
            {
              label: 'DIRECT PROMPT',
              text: 'Write a short public notice that daily Economy Lot rates change from $9 to $12 on June 1.',
            },
            {
              label: 'STEP-BACK PROMPT',
              text: 'Step 1: In general, what makes a price-change notice feel fair and clear to customers? List 3 principles.\nStep 2: Using those principles, write a short public notice that daily Economy Lot rates change from $9 to $12 on June 1 — the first change since 2019, funding shuttle and lighting upgrades.',
            },
          ],
          responses: [
            {
              label: 'DIRECT OUTPUT',
              text: 'Effective June 1, daily parking in the Economy Lot will be $12 per day, up from $9. We apologize for any inconvenience and appreciate your understanding.',
              annotations: [
                'Accurate but defensive — it apologizes for a fact and gives no reason.',
                'Reads like bad news management, not a service notice.',
              ],
            },
            {
              label: 'STEP-BACK OUTPUT',
              text: 'Starting June 1, Economy Lot daily parking moves from $9 to $12 — our first rate change since 2019. The increase funds the shuttle fleet and lot lighting upgrades passengers asked for. Park 7+ days and the weekly rate still saves you 20%.',
              annotations: [
                'Principles surfaced first: give the reason, anchor the history, offer the offset.',
                'Same facts — but the notice now argues its own fairness.',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Principles first', 'Reason given', 'History anchored', 'Offset offered'],
        },
        {
          type: 'prose',
          id: 'l33-own-solution',
          heading: 'Judge last: work out your own solution first',
          body: [
            'A companion tactic from OpenAI\'s guide: if you ask the model to *evaluate* a solution — a contractor\'s phasing plan, a vendor\'s invoice math, a colleague\'s draft — it tends to agree politely with whatever it\'s shown. The fix: **have the model work out its own solution first**, then compare. "Before you assess this phasing plan, list the sequence you would use to repave a taxiway at night without closing the airfield. Then compare the plan against yours and flag every gap."',
            'Same pattern as step-back, different target: reasoning *before* judgment. The model — like a new hire — is far more useful when it forms its own view before reading the answer key.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l33-judgelast',
          label: 'JUDGE LAST — the same invoice, two orders of operations',
          prompts: [
            {
              label: 'VERDICT-FIRST PROMPT',
              text: 'A snow-removal contractor bills: 14 truck-hours × $185/hr + 9,000 lb de-icer × $0.42/lb + $1,200 standby = $6,670. Is the invoice total correct?',
            },
            {
              label: 'WORK-FIRST PROMPT',
              text: 'First, work out the correct invoice total yourself: 14 truck-hours × $185/hr + 9,000 lb de-icer × $0.42/lb + $1,200 standby. Then compare your total to the contractor\'s billed total of $6,670 and evaluate whether the invoice is correct. Don\'t decide until you\'ve done the math yourself.',
            },
          ],
          responses: [
            {
              label: 'VERDICT-FIRST OUTPUT',
              text: 'Yes — the total of $6,670 appears correct. The line items (labor, materials, standby) sum to the billed amount.',
              annotations: [
                'Wrong — and agreeable about it. Shown a plausible total, the model skim-read and co-signed it.',
                'The real math: 14 × $185 = $2,590; 9,000 × $0.42 = $3,780; + $1,200 = $7,570. The invoice is $900 short of the true sum.',
              ],
            },
            {
              label: 'WORK-FIRST OUTPUT',
              text: 'My calculation: labor 14 × $185 = $2,590. De-icer 9,000 × $0.42 = $3,780. Standby $1,200. Correct total: $7,570. The billed $6,670 does NOT match — the invoice understates the total by $900. Verify the labor rate and material quantity against the contract before paying.',
              annotations: [
                'Solution first, verdict second — the disagreement is caught, quantified, and routed to a human for the contract check.',
                'Note the honest finish: it flags what a human must verify rather than declaring victory.',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Own solution first', 'Compare, then judge', 'Show the math', 'Route to a human'],
        },
        {
          type: 'prose',
          id: 'l33-instrument',
          heading: 'The instrument-rated shelf (name-check only)',
          body: [
            'Two techniques sit above this course\'s ceiling — you won\'t be tested on flying them, but you should recognize the call signs. **Self-consistency**: run the same reasoning prompt several times, then take the majority answer — one careful vote beats one lucky chain (it added roughly 18 points over plain CoT on a math benchmark). **Tree-of-thought**: let the model branch, evaluate its own intermediate ideas, and backtrack from dead ends — on a puzzle benchmark it jumped from 4% to 74% solved.',
            'Both cost many more model calls and are built for genuinely hard planning problems — not for tenant notices. File them under "exists, impressive, overkill for Tuesday." If a recurring, high-stakes analytical task ever justifies them, that\'s a conversation with IT about tooling — not a prompt you improvise.',
          ],
        },
        {
          type: 'callout',
          id: 'l33-when',
          variant: 'tower',
          title: 'Tower Advisory: step back when the task has a principle worth stating.',
          body: 'Rate changes, policy explanations, delicate replies — anywhere "what does good look like in general?" has a real answer. Skip it for lookups and formatting chores; stepping back on "convert this table to bullets" is a scenic detour to the same runway.',
        },
        {
          type: 'quote',
          id: 'l33-quote',
          text: 'Verdict first is grading with the answer key in your lap. Work the problem, then open the key.',
          attribution: 'FROM THE FLIGHT CREW · IAA PROMPT ACADEMY',
        },
        {
          type: 'knowledgeCheck',
          id: 'l33-check',
          question: 'What does step-back prompting actually do?',
          options: [
            {
              text: 'It asks the model to double-check its answer a second time.',
              correct: false,
              feedback:
                'GO AROUND — that\'s self-checking or verification (useful, different move). Step-back happens *before* the specific answer, not after.',
            },
            {
              text: 'It asks a general principle question first, then feeds that answer into the specific prompt.',
              correct: true,
              feedback:
                'CLEARED — general question → principle → better specific answer. The step back activates background knowledge and disciplines the final output.',
            },
            {
              text: 'It removes all examples from a few-shot prompt to save tokens.',
              correct: false,
              feedback:
                'GO AROUND — that would just be zero-shot prompting. Step-back is about abstraction, not deletion.',
            },
          ],
        },
      ],
    },
    // ── LEG 3.4 ────────────────────────────────────────────────────────────
    {
      id: '3.4',
      code: 'LEG 3.4',
      type: 'DRILL',
      title: 'Reasoning or Overkill?',
      description:
        'Six-plus task cards, two bins: JUST ASK or THINK IT THROUGH. Sort them right and you\'ll never pay the reasoning tax on a lookup again.',
      durationMin: 6,
      takeaways: [
        'Reasoning costs time and tokens — spend it only where a wrong answer costs you more.',
        'One-hop lookups, translations, formatting: just ask. Multi-step, multi-constraint, audit-worthy: think it through.',
        'The sniff test: would you ask a colleague to show their work on this?',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l34-intro',
          heading: 'The reasoning tax',
          body: [
            'Chain-of-thought is a tool, not a personality. Every step you ask for is output the model must generate — more tokens, more latency, more text for you to read. On a one-hop lookup, that\'s pure overhead: the answer doesn\'t get better, just slower.',
            'Even Anthropic\'s docs warn that not every problem deserves prompt engineering at all. The skill isn\'t knowing the techniques — it\'s triaging which tasks deserve them. Sort the cards below and find out if your instinct matches the flight manual.',
          ],
        },
        {
          type: 'sortDrill',
          id: 'l34-drill',
          title: 'Just ask, or think it through?',
          bins: ['JUST ASK', 'THINK IT THROUGH'],
          cards: [
            {
              text: '"Which carousel is Flight 1187\'s baggage on right now?"',
              bin: 0,
              verdict:
                'One-hop lookup against provided data. Reasoning steps add nothing but latency.',
            },
            {
              text: '"Reconcile the three conflicting passenger counts from the two manifests and the gate tally."',
              bin: 1,
              verdict:
                'Multi-step comparison with a defensible answer needed — exactly CoT territory.',
            },
            {
              text: '"Translate this terminal wayfinding sign into Spanish."',
              bin: 0,
              verdict:
                'A transform task with a clear spec. Just ask — then have a human review it (Gate 5).',
            },
            {
              text: '"Decide which two of these eight survey themes to escalate to the executive team, and justify the pick."',
              bin: 1,
              verdict:
                'Multi-factor judgment you\'ll have to defend — you want the reasoning on the record.',
            },
            {
              text: '"What does the bulletin say about tonight\'s restroom closure hours?"',
              bin: 0,
              verdict:
                'A grounded extraction from one short text. Just ask — with the grounding clause from Leg 2.3.',
            },
            {
              text: '"Compare these three snow-removal bids across price, response time, and equipment, and recommend one."',
              bin: 1,
              verdict:
                'Multi-constraint trade-off analysis. Ask for the work — then verify the numbers yourself.',
            },
            {
              text: '"Rewrite this ops note as a 2-sentence public statement."',
              bin: 0,
              verdict:
                'A single, well-specified transform (Gate 4). No chain of thought required.',
            },
            {
              text: '"Plan the gate assignments for a 6 a.m. bank when two bridges are down for inspection."',
              bin: 1,
              verdict:
                'Constrained planning with cascading consequences — think it through, step by step.',
            },
          ],
          recap:
            'The pattern: one hop, one source, one clear format → JUST ASK. Multiple steps, constraints, or a decision you\'ll defend → THINK IT THROUGH. When in doubt, apply the sniff test — would you ask a colleague to show their work?',
        },
        {
          type: 'prose',
          id: 'l34-triage',
          heading: 'The 10-second triage',
          body: [
            'Two questions sort any task before you type. **How many steps stand between the question and the answer?** One — just ask. Several — think it through. **Will anyone ask me to defend this answer?** If yes, you want the reasoning on the record even when the direct answer would probably be right: the audit trail is the deliverable.',
            'And one exception worth naming: reasoning mode is also worth it when the *format* must be exact and the content is fiddly — a long structured summary where a skipped section is a real miss. Cheap insurance beats a quiet omission.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l34-overkill',
          label: 'BOTH FAILURE MODES — reasoning wasted, and reasoning missing',
          prompts: [
            {
              label: 'OVERKILL',
              text: 'Let\'s think step by step: what time does the tenant portal go live on Tuesday, according to the notice below? Notice: """The tenant portal goes live Tuesday at 9 a.m."""',
            },
            {
              label: 'MISSING REASONING',
              text: 'Two bids: Bid A — $48,000, 4-hour response, 6 plows. Bid B — $52,000, 2-hour response, 9 plows. Which snow-removal bid should we take? Answer with one letter.',
            },
          ],
          responses: [
            {
              label: 'OVERKILL OUTPUT',
              text: 'Step 1: The notice concerns the tenant portal. Step 2: The notice mentions Tuesday. Step 3: The stated time is 9 a.m. Therefore, the answer is 9 a.m.',
              annotations: [
                'Correct — and four times the reading for a fact that was already in quotes.',
              ],
            },
            {
              label: 'MISSING-REASONING OUTPUT',
              text: 'A',
              annotations: [
                'A coin flip in a uniform. Was it price? Fleet size? There\'s nothing here to audit or defend.',
                'Better: "Compare price, response time, and fleet; show your reasoning, then recommend."',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Match effort to stakes', 'Audit trail matters', 'Speed matters too'],
        },
        {
          type: 'prose',
          id: 'l34-models',
          heading: 'First triage question: which model are you flying?',
          body: [
            'Before the two triage questions above, one sits in front of them: **is this a reasoning model?** As Leg 3.2 covered, 2026 reasoning models run their own internal chain of thought — OpenAI advises prompting them zero-shot and direct, since an explicit "think step by step" may not enhance performance and can sometimes hinder it. Standard, non-reasoning models still earn the full CoT treatment on multi-step work. On either model, ask for the written steps when the audit trail is the deliverable.',
            'How do you know which you have? Check the tool\'s label or ask IT — approved enterprise tools at the Authority will tell you the model family. The rule of thumb stays human: match the prompt to the machine, the way you\'d match the checklist to the aircraft.',
          ],
        },
        {
          type: 'knowledgeCheck',
          id: 'l34-check',
          question: 'When does chain-of-thought actually earn its tokens?',
          options: [
            {
              text: 'On every task — more reasoning always means more accuracy.',
              correct: false,
              feedback:
                'GO AROUND — on one-hop lookups, CoT adds latency and reading load with no accuracy gain. "Always" is the overkill answer.',
            },
            {
              text: 'On multi-step analysis — reconciliations, trade-offs, constrained planning — where a direct answer is error-prone.',
              correct: true,
              feedback:
                'CLEARED — that\'s the research result and the house rule: reasoning pays where answers compound across steps, and where you need an audit trail.',
            },
            {
              text: 'Never — it\'s a research gimmick with no workplace use.',
              correct: false,
              feedback:
                'GO AROUND — 17.7% → 78.7% on multi-step arithmetic (Kojima et al., 2022, text-davinci-002) says otherwise. The trick is deploying it selectively, not never.',
            },
          ],
        },
        {
          type: 'callout',
          id: 'l34-sniff',
          variant: 'tower',
          title: 'Tower Advisory: the sniff test.',
          body: 'Before you prompt, ask: "If a colleague did this for me, would I want to see their work?" If yes — think it through. If you\'d just want the answer — just ask.',
        },
        {
          type: 'quote',
          id: 'l34-quote',
          text: 'Reasoning is a tool, not a personality — spend it where a wrong answer costs you.',
          attribution: 'FROM THE FLIGHT CREW · IAA PROMPT ACADEMY',
        },
      ],
    },
  ],
  check: {
    title: 'Gate Check 3 — Clearance Exam',
    questionCount: 5,
    passScore: 80,
  },
  labScenarioIds: ['WTP-L09'],
};

/** Named export for registry imports (task spec: g2/g3/g4/g5 per file). */
export const g3 = gate;

export default gate;
