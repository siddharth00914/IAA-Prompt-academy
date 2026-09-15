import type { Gate } from '../types';

/**
 * G2 — Flight Crew Roles: Persona, Audience & Context (module.md §7)
 * Accent: field-500 · Boarding order 3/6 · ≈30 min
 * Wing: Persona Pilot (all four legs complete)
 * Sources: Vanderbilt prompt patterns (dim05), Google whitepaper triad (dim01),
 * OpenAI grounding tactics (dim02), Anthropic role prompting (dim03).
 */
export const gate: Gate = {
  id: 'g2',
  index: 2,
  number: 'G2',
  title: 'Flight Crew Roles',
  subtitle:
    'Persona, audience & context — put the model in uniform, point it at the right reader, and hand it the briefing it can never guess.',
  accent: 'field',
  boardingOrder: 3,
  approxMinutes: 30,
  objectives: [
    'Assign an effective role or persona to steer vocabulary, tone, and priorities.',
    'Specify the audience so the output fits the reader, not just the request.',
    'Supply who / what / why / where context the model cannot guess on its own.',
    'Ground answers in provided text — and make the AI say "not stated" when it isn\'t.',
    'Use flipped interaction to make the AI interview you before it drafts.',
  ],
  legs: [
    // ── LEG 2.1 ────────────────────────────────────────────────────────────
    {
      id: '2.1',
      code: 'LEG 2.1',
      type: 'LESSON',
      title: 'Act As: The Persona Pattern',
      description:
        'One sentence of casting — "act as a public affairs officer" — changes vocabulary, tone, and priorities. Watch one gate change get announced three different ways.',
      durationMin: 8,
      takeaways: [
        'A persona is a voice, not credentials: it changes how things sound — not what the model knows, and not how right the answer is.',
        'The persona pattern is two lines: "Act as Persona X / Perform task Y."',
        'A role steers vocabulary, tone, and what the model pays attention to — the evidence says voice and format, not factual correctness.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l21-intro',
          heading: 'Same task. Three different crews.',
          body: [
            'Ask for "a gate change announcement" with no other guidance and you\'ll get something generic — grammatically fine, operationally useless. Now ask three times, each time opening with a different role: an **operations coordinator**, a **public affairs officer**, a **maintenance lead**. Same airport, same flight, same gate change. Three completely different announcements.',
            'Researchers at Vanderbilt call this the **Persona pattern**, and its whole instruction set fits on one luggage tag: `Act as Persona X` / `Perform task Y`. The intent (from the original prompt-pattern catalog) is to give the model "a persona that helps it select what types of output to generate and what details to focus on." You\'re not flattery-proofing the AI — you\'re telling it which uniform to wear.',
          ],
        },
        {
          // Persona portraits for the player (design.md §9, in chip order):
          // /persona-ops.webp · /persona-comms.webp · /persona-maint.webp
          type: 'chipToggle',
          id: 'l21-simulator',
          title: 'The Persona Simulator — one gate change, three uniforms',
          chips: [
            {
              label: 'Ops Coordinator',
              output:
                'OPS NOTE · 14:22 — AAL2147 (IND→ORD) reassigned B14 → A6, effective immediately. Jet bridge B14 out of service pending inspection. Ramp: re-stage bags to A-side. Podium signage updated. Next status check 14:45.',
            },
            {
              label: 'Public Affairs Officer',
              output:
                "Attention passengers on Flight 2147 to Chicago O'Hare: your departure gate has changed from B14 to A6 — a short walk down the main corridor. The change is due to routine equipment maintenance at Gate B14, and your departure time is unchanged. Any agent in a blue vest can point you toward Concourse A. Thank you for flying IND.",
            },
            {
              label: 'Maintenance Lead',
              output:
                'MX LOG — Bridge B14 tagged out 14:05, hydraulic weep at the rotunda seal, est. return to service 18:00. All B14 traffic shifted to A6 until released. Notify the ops desk when tooling is clear of the pad. — Crew 3',
            },
          ],
        },
        {
          type: 'prose',
          id: 'l21-why',
          heading: 'Why one sentence does that much',
          body: [
            'Nothing about the *facts* changed between those three drafts — only the casting. The ops voice reached for times, tail numbers, and next actions. The public affairs voice reached for reassurance and wayfinding. The maintenance voice reached for tag-out procedure. That\'s the lever: a persona tells the model **which details matter and how they should sound**.',
            'Google\'s prompt-engineering whitepaper separates three kinds of setup that people casually lump together: **system prompting** sets the model\'s overall purpose ("the big picture"); **contextual prompting** supplies the immediate, task-specific details; and **role prompting** assigns a character or identity — it "frames the model\'s output style and voice." This gate teaches all three, starting with role. One attribution worth getting right: Anthropic\'s docs call role-setting one of the highest-leverage moves — "even a single sentence makes a difference" — but that advice is about **system prompts**, the developer channel behind the API, not the chat box. In a chat tool like the ones we use at work, you can\'t set a system prompt; your role line rides in the ordinary prompt instead. Same lever, different socket — and since it shares the stream with everything else you type, phrase it clearly and keep it near the top.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l21-weak-strong',
          label: 'WEAK ↔ STRONG — same request, one with a crew assignment',
          prompts: [
            {
              label: 'WEAK PROMPT',
              text: 'Write an announcement about the Flight 2147 gate change.',
            },
            {
              label: 'STRONG PROMPT',
              text: "You are a public affairs officer at Indianapolis International Airport. Write a gate-change announcement for passengers waiting at Gate B14: Flight 2147 to Chicago O'Hare is moving to Gate A6 because of routine jet-bridge maintenance; departure time is unchanged. Keep it under 60 words, calm, and include where to find help.",
            },
          ],
          responses: [
            {
              label: 'WEAK OUTPUT',
              text: 'Attention passengers: Flight 2147 has been moved to a different gate. Please check the monitors for updated information. We apologize for any inconvenience.',
              annotations: [
                'Which gate? Which concourse? The passenger still has to find a monitor.',
                '"We apologize for any inconvenience" is filler — nothing actionable.',
              ],
            },
            {
              label: 'STRONG OUTPUT',
              text: "Attention passengers on Flight 2147 to Chicago O'Hare: your gate has changed from B14 to A6, a short walk down the main corridor. The change is for routine jet-bridge maintenance, and your departure time is unchanged. Agents in blue vests near the podium can point the way. Thank you for flying IND.",
              annotations: [
                'Old gate → new gate, distance, reason, and reassurance — all in 55 words.',
                'The role pulled passenger-first instincts: wayfinding, tone, where to get help.',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Role up front', 'Concrete details', 'Passenger-first tone', 'One clear task'],
        },
        {
          type: 'callout',
          id: 'l21-tip',
          variant: 'tower',
          title: 'Tower Advisory: experiment with the uniform.',
          body: 'Anthropic\'s tip — from that same system-prompt guidance, and just as usable in an ordinary chat role line: "A data scientist might see different insights than a marketing strategist for the same data." If the first draft reads wrong, don\'t rewrite the whole prompt — recast the role. Ops voice too clipped for passengers? Put public affairs in the left seat and run it again.',
        },
        {
          type: 'prose',
          id: 'l21-root',
          heading: 'Write your root prompt once, reuse it all year',
          body: [
            'Vanderbilt\'s course names a habit worth stealing: the **root prompt** — a reusable block of casting and context you paste at the top of work sessions instead of re-typing it every time. Mine might read: `I am an operations coordinator at Indianapolis International Airport. My readers are airline station staff, tenants, and passengers. Default to plain language, short sentences, and 24-hour times.` Three lines, written once, steering every answer all year.',
            'A root prompt is not a magic spell — it\'s a pre-flight card. It carries the parts of your brief that never change (role, readers, house style) so each new prompt only has to carry the parts that do. Keep yours in a note on your desk; refine it as you learn what the model does with it. Gate 4\'s iterate loop is how root prompts earn their wings.',
          ],
        },
        {
          type: 'knowledgeCheck',
          id: 'l21-check',
          question:
            'You need a notice to Concourse A concessionaires about six weeks of overnight construction near their storefronts. Which persona line gives the model the best casting?',
          options: [
            {
              text: '"Act as a passenger who is angry about construction noise."',
              correct: false,
              feedback:
                'GO AROUND — that persona optimizes for outrage, not clarity. The reader\'s feelings matter, but the model should be cast as the writer of the notice, not its angriest recipient.',
            },
            {
              text: '"Act as a properties communications specialist who writes tenant notices for airport concessionaires."',
              correct: true,
              feedback:
                'CLEARED — this hands the model the right desk: it will reach for what/where/when, impact on operations, and a contact for questions — exactly what a tenant needs.',
            },
            {
              text: 'No persona needed — "write a construction notice" is specific enough on its own.',
              correct: false,
              feedback:
                'GO AROUND — "a construction notice" could be a roadwork flyer, a legal filing, or a tenant letter. One sentence of casting removes that guesswork for free.',
            },
          ],
        },
        {
          type: 'prose',
          id: 'l21-limits',
          heading: 'A uniform is not a license',
          body: [
            'This is the headline guidance of the whole leg: a persona changes how the model **sounds**, not what it **knows**. "Act as a senior airfield electrician" gets you confident electrician vocabulary — it does not certify the answer, and it will not stop the model from inventing a plausible-sounding procedure. Casting sets the voice; **you** still own the facts. The next two legs give you the two tools that close that gap: audience context, and grounding.',
          ],
        },
        {
          type: 'callout',
          id: 'l21-evidence',
          variant: 'tower',
          title: 'Tower Advisory: the persona evidence is mixed — cast for voice, not correctness.',
          body: 'The research earns a straight answer. Zheng et al. (2024) tested 162 personas and found persona-prompting does **not** improve factual question-answering; a Wharton study ("Playing Pretend") went further, finding expert-persona priming can actually degrade factual recall. Some reasoning tasks benefit modestly — but the reliable wins are voice, tone, framing, and format. So use the uniform for how the output should sound, and let grounding (Leg 2.3) and verification (Gate 5) handle whether it\'s true.',
        },
      ],
    },
    // ── LEG 2.2 ────────────────────────────────────────────────────────────
    {
      id: '2.2',
      code: 'LEG 2.2',
      type: 'LESSON',
      title: 'Audience & Context: Who\'s Listening?',
      description:
        'The same delay notice reads differently for passengers, tenants, and the board. Stack the WHO / WHAT / WHY / WHERE cards and watch the output re-tailor itself.',
      durationMin: 7,
      takeaways: [
        'Audience persona: "Explain X to me. Assume that I am Persona Y" — same facts, fitted to the reader.',
        'Context is a four-card hand: WHO is involved, WHAT is happening, WHY it matters, WHERE/WHEN it lands.',
        'The model can\'t guess your context — it only knows what you load onto the cart.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l22-intro',
          heading: 'Every message has a reader',
          body: [
            'Gate 1 taught you to say exactly what you want done. Gate 2\'s next question is: **for whom?** A ground delay notice written for travelers at the podium, for tenant managers planning staffing, and for the board\'s monthly packet should share zero sentences — the facts are identical, the reader is not.',
            'Vanderbilt teaches this as the **Audience Persona pattern**: `Explain X to me. Assume that I am Persona Y.` You\'re no longer casting the AI — you\'re describing the person on the receiving end, and letting the model fit tone, detail, and vocabulary to them.',
          ],
        },
        {
          type: 'chipToggle',
          id: 'l22-audience',
          title: 'One ground delay, three readers',
          chips: [
            {
              label: 'Passengers at the gate',
              output:
                'Due to weather in the Chicago area, Flight 2147 is now expected to depart at 4:40 PM. Please stay near Gate A6 — boarding could begin quickly once we\'re released. We\'ll update you every 20 minutes, and the podium team can help with connections.',
            },
            {
              label: 'Tenant managers',
              output:
                'Heads-up for Concourse A: ATC has issued a ground delay for ORD-bound traffic, earliest release 4:40 PM. Expect passengers to dwell in the concourse an extra 60–90 minutes around Gates A3–A8. Consider extending grab-and-go staffing through the 5 PM bank.',
            },
            {
              label: 'Executive board packet',
              output:
                'At 15:10, FAA issued a ground delay program for ORD arrivals, affecting two IND departures (42 passengers rebooked). No diversions; terminal operations normal. Delay costs tracked under irregular-ops code WX-ORD. Full summary in the monthly ops report.',
            },
          ],
        },
        {
          type: 'prose',
          id: 'l22-four',
          heading: 'The four context cards: WHO · WHAT · WHY · WHERE',
          body: [
            'Audience is one card in a four-card hand. Before you prompt, deal them out: **WHO** is involved (who\'s writing, who\'s reading), **WHAT** is happening (the event, the document, the decision), **WHY** it matters (the deadline, the stakes, the policy), and **WHERE/WHEN** it lands (the channel, the place, the time).',
            'Anthropic suggests a mental test: treat the model like a brilliant new employee — with amnesia. They\'re smart, they write beautifully, and they have never heard of your airport, your tenants, or your 8 a.m. briefing. If a minimally-informed colleague couldn\'t do the task from your prompt alone, the model can\'t either. Context isn\'t padding; it\'s the briefing.',
          ],
        },
        {
          type: 'prose',
          id: 'l22-colleague',
          heading: 'The 30-second colleague test',
          body: [
            'Anthropic\'s docs offer a golden rule for context: **show your prompt to a colleague with minimal context on the task — if they\'d be confused, the model will be too.** It\'s a human spell-check for missing context, and it costs thirty seconds at the next desk.',
            'Watch it work. Prompt: *"Post the notice about the corridor."* A corridor-less colleague asks: which corridor? what notice? who\'s it for? when does it start? — four WHO/WHAT/WHERE cards, undealt. Prompt: *"Post this notice to the tenant portal for Concourse A storefront managers: overnight jet-bridge work near Gates A3–A5 starts March 3, 11 p.m.–5 a.m., for six weeks; pre-6 a.m. deliveries reroute to the A-side service corridor."* Same colleague just nods. If a minimally-informed human can run the errand, the model can too.',
          ],
        },
        {
          type: 'promptBuilder',
          id: 'l22-builder',
          title: 'Stack the cards yourself',
          parts: [
            {
              id: 'instruction',
              label: 'INSTRUCTION',
              caption: 'One task, one verb — Gate 1 rules still apply.',
            },
            {
              id: 'who',
              label: 'WHO',
              caption: 'Who\'s writing and who\'s reading — the audience persona.',
            },
            {
              id: 'what',
              label: 'WHAT',
              caption: 'The event or document the model is working with.',
            },
            {
              id: 'why',
              label: 'WHY',
              caption: 'The reason it matters — deadline, stakes, decision.',
            },
            {
              id: 'where',
              label: 'WHERE / WHEN',
              caption: 'Channel, place, and time the message will land.',
            },
            {
              id: 'format',
              label: 'OUTPUT FORMAT',
              caption: 'Length and shape, so nobody has to guess.',
            },
          ],
          previewTemplate:
            '{instruction} Draft a notice to Concourse A concessionaires.\n{who} Readers: tenant managers, not passengers — they plan staffing and deliveries.\n{what} Overnight jet-bridge construction near Gates A3–A5, six weeks starting March 3.\n{why} Stores need to reroute early-morning deliveries and expect overnight noise.\n{where} Posting to the tenant portal and emailed Tuesday 9 a.m.\n{format} 150 words, headline + 3 short paragraphs + contact line.',
          cannedResponse:
            'OVERNIGHT CONSTRUCTION NEAR GATES A3–A5 — WHAT TENANTS NEED TO KNOW\n\nStarting Monday, March 3, our facilities team will begin six weeks of overnight jet-bridge work near Gates A3–A5, between 11 p.m. and 5 a.m. No storefronts close, and the concourse stays fully open during business hours.\n\nWhat to expect: intermittent equipment noise overnight and a roped-off work zone by Gate A4. Early-morning deliveries before 6 a.m. should use the A-side service corridor; our team will flag the route on night one.\n\nQuestions or delivery conflicts? Contact the properties desk at properties@ind.example or ext. 2147 — we\'ll route you to the project lead within one business day.',
        },
        {
          type: 'compare',
          id: 'l22-compare',
          title: 'Same facts — with and without the four cards',
          weak: 'There will be construction happening near the gates over the next several weeks. We apologize for any inconvenience this may cause and appreciate your patience during this time.',
          strong:
            'Starting March 3, overnight jet-bridge work runs 11 p.m.–5 a.m. near Gates A3–A5 for six weeks. Deliveries before 6 a.m. use the A-side service corridor. Questions: properties desk, ext. 2147.',
        },
        {
          type: 'knowledgeCheck',
          id: 'l22-check',
          question:
            'A colleague\'s prompt reads: "Draft an email about the water-main shutdown in the Concourse B service corridor, Thursday 2–5 a.m., so vendors can plan around it." Which context card is missing?',
          options: [
            {
              text: 'WHAT — the event isn\'t described.',
              correct: false,
              feedback:
                'GO AROUND — WHAT is clearly there: a water-main shutdown, Thursday 2–5 a.m. Look for the card that isn\'t dealt.',
            },
            {
              text: 'WHO — it never says who the email is from or which vendors are reading.',
              correct: true,
              feedback:
                'CLEARED — exactly. WHAT (shutdown), WHERE/WHEN (Concourse B, Thursday 2–5 a.m.), and WHY (so vendors can plan) are all present. WHO — sender role and specific audience — is the gap the model will fill with a guess.',
            },
            {
              text: 'WHY — the purpose of the email isn\'t stated.',
              correct: false,
              feedback:
                'GO AROUND — WHY is stated: "so vendors can plan around it." Re-scan the four cards against the prompt.',
            },
          ],
        },
        {
          type: 'callout',
          id: 'l22-role-vs-audience',
          variant: 'tower',
          title: 'Tower Advisory: role is who the AI is; audience is who\'s reading.',
          body: 'Don\'t merge them. "Act as a public affairs officer" casts the writer. "Assume the reader is a tenant manager" casts the reader. Strong prompts usually carry both — a uniform on the model and a face across the desk.',
        },
      ],
    },
    // ── LEG 2.3 ────────────────────────────────────────────────────────────
    {
      id: '2.3',
      code: 'LEG 2.3',
      type: 'DRILL',
      title: 'Grounding: Answer Using Only This',
      description:
        'Hand the model the source text and one safety clause, and it stops inventing. Drill: ask a question whose answer is NOT in the notice — and watch a grounded prompt decline gracefully.',
      durationMin: 8,
      takeaways: [
        'Grounding = open-book test: provide the reference text and instruct the model to answer only from it.',
        'The safety clause does the work: "If the answer isn\'t in the text, say so."',
        'Grounding makes answers faithful to the source — not true. The source still has to be authoritative.',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l23-intro',
          heading: 'The open-book test',
          body: [
            'Left to its own devices, a model answers from patterns it absorbed in training — and it will answer confidently even when it\'s guessing. OpenAI\'s own guidance puts it plainly: models "can confidently invent fake answers, especially when asked about esoteric topics or for citations and URLs." Their fix is a metaphor every student knows: "In the same way that a sheet of notes can help a student do better on a test, providing reference text to these models can help in answering with fewer fabrications."',
            'That\'s **grounding**: you paste the source text into the prompt (fenced in delimiters, per Gate 1), and you instruct the model to answer **only** from it. The model stops being an encyclopedia and starts being a very fast reader of the one document you handed it.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l23-demo',
          label: 'THE DRILL — the answer is NOT in the notice. Watch both prompts handle it.',
          prompts: [
            {
              label: 'UNGROUNDED PROMPT',
              text: 'Why is the parking garage shuttle now running every 30 minutes?\n\nNotice: """Effective Monday, the Economy Parking shuttle runs every 30 minutes (previously every 15). Shuttle pickup remains at Zone 3 on the Ground Transportation level."""',
            },
            {
              label: 'GROUNDED PROMPT',
              text: 'Answer the question using ONLY the notice below. If the answer is not stated in the notice, say: "That\'s not stated in the notice."\n\nQuestion: Why is the parking garage shuttle now running every 30 minutes?\n\nNotice: """Effective Monday, the Economy Parking shuttle runs every 30 minutes (previously every 15). Shuttle pickup remains at Zone 3 on the Ground Transportation level."""',
            },
          ],
          responses: [
            {
              label: 'UNGROUNDED OUTPUT',
              text: 'The shuttle frequency was reduced to every 30 minutes due to ongoing driver shortages and lower off-peak ridership, part of a broader cost-saving measure across ground transportation services.',
              annotations: [
                'Fluent, specific, and 100% invented — the notice says nothing about drivers, ridership, or cost.',
                'This is how hallucinations get into passenger emails: a confident guess, copied forward.',
              ],
            },
            {
              label: 'GROUNDED OUTPUT',
              text: "That's not stated in the notice. The notice only confirms the new 30-minute frequency and the pickup location at Zone 3 — it gives no reason for the change.",
              annotations: [
                'Correct and honest: it reports what the source says and declines the rest.',
                'If you need the reason, you go find the authoritative source — the model is not it.',
              ],
            },
          ],
          variantToggle: true,
          chips: ['Answer ONLY from the text', 'Named fallback phrase', 'Delimited source', 'No guessing'],
        },
        {
          type: 'prose',
          id: 'l23-clause',
          heading: 'The safety clause is the whole trick',
          body: [
            'Two lines carry the load. First: `Answer using only the text provided.` Second, the fallback: `If the answer isn\'t in the text, say so.` Without the fallback, you\'ve told the model to use the text — but not what to do when the text comes up short, and it will usually fill the gap with a plausible guess.',
            'OpenAI\'s canonical version of this tactic reads: "Use the provided articles delimited by triple quotes to answer questions. If the answer cannot be found in the articles, write \'I could not find an answer.\'" Name the exact fallback phrase you want. When the model says it verbatim, you know it declined on purpose — not that it failed.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l23-cite',
          label: 'THE CITATION PASS — answer with receipts',
          prompts: [
            {
              label: 'CITATION PROMPT',
              text: 'Answer the question using ONLY the bulletin below. Answer in one sentence, then quote the exact line(s) from the bulletin that support your answer. If the answer is not stated, write: "Not stated in the bulletin."\n\nQuestion: Can vendors still access the south service dock during the apron work?\n\nBulletin: """Apron rehabilitation near the south service dock runs March 10–21. Vendor access to the south dock is suspended on weekdays 06:00–16:00; the north dock remains open at all hours. Weekend access is unrestricted."""',
            },
          ],
          responses: [
            {
              label: 'CITATION OUTPUT',
              text: 'Yes — but only outside weekday work hours: the south dock is closed to vendors weekdays 06:00–16:00 and open evenings, nights, and weekends.\nSupporting lines: "Vendor access to the south dock is suspended on weekdays 06:00–16:00" / "Weekend access is unrestricted."',
              annotations: [
                'The quote is the receipt: you can string-match it against the bulletin in seconds.',
                'Notice the honest nuance — "yes, but" — carried straight from the source, not invented.',
              ],
            },
          ],
        },
        {
          type: 'promptBuilder',
          id: 'l23-builder',
          title: 'Build a grounded Q&A prompt',
          parts: [
            {
              id: 'instruction',
              label: 'INSTRUCTION',
              caption: 'Answer the question — and only from the source.',
            },
            {
              id: 'fallback',
              label: 'FALLBACK CLAUSE',
              caption: 'The verbatim "not stated" line — the anti-invention device.',
            },
            {
              id: 'source',
              label: 'SOURCE TEXT',
              caption: 'The reference material, fenced in delimiters (Gate 1).',
            },
            {
              id: 'question',
              label: 'QUESTION',
              caption: 'The actual ask, kept separate from the source.',
            },
            {
              id: 'format',
              label: 'OUTPUT FORMAT',
              caption: 'How the answer should look — e.g., one sentence plus a quote.',
            },
          ],
          previewTemplate:
            '{instruction} Answer the question using ONLY the bulletin below.\n{fallback} If the answer is not stated in the bulletin, reply exactly: "Not stated in the bulletin."\n{source} Bulletin: """Terminal B restrooms on the upper level close nightly 1–4 a.m. for deep cleaning through March 29. Lower-level restrooms remain open.""" \n{question} Which restrooms stay open overnight?\n{format} Answer in one sentence, then quote the supporting line.',
          cannedResponse:
            'The lower-level Terminal B restrooms stay open overnight.\nSupporting line: "Lower-level restrooms remain open."',
        },
        {
          type: 'prose',
          id: 'l23-where',
          heading: 'Grounding\'s home address at IND',
          body: [
            'Grounding only works when the text you paste is authoritative. At the Authority that means: the current SOP or bulletin (not last year\'s printout in the break room), signed policies and lease documents, official FAA/TSA publications, the published flight-status page, and approved templates. It does not mean a forwarded email thread, a screenshot of a screenshot, or your memory of what the procedure "basically says."',
            'Build the reflex: before you paste a source into a prompt, confirm it\'s the version of record. OpenAI\'s citation tactic has a quiet superpower here — because the model\'s quote can be string-matched against your document, verification takes seconds, and a quote that doesn\'t match is an instant red flag.',
          ],
        },
        {
          type: 'callout',
          id: 'l23-source',
          variant: 'hold-short',
          title: 'Hold Short: grounded ≠ true.',
          body: 'Grounding guarantees the answer is faithful to the text you provided — it says nothing about whether that text was right. Ground the model in authoritative sources only: current SOPs, official bulletins, signed policies. A perfectly grounded answer from a stale or wrong document is still a wrong answer, delivered with confidence.',
        },
        {
          type: 'knowledgeCheck',
          id: 'l23-check',
          question:
            'Which addition to a prompt does the most to stop the model from inventing an answer when the source text doesn\'t contain it?',
          options: [
            {
              text: '"Be accurate and do not hallucinate."',
              correct: false,
              feedback:
                'GO AROUND — it\'s a wish, not a mechanism. The model already "tries" to be accurate; telling it to try harder doesn\'t give it a way to decline gracefully.',
            },
            {
              text: '"Answer using only the text provided. If the answer isn\'t in the text, say so."',
              correct: true,
              feedback:
                'CLEARED — the first line fences the answer to the source; the second names an honorable exit. Together they turn a confident guess into an honest "not stated."',
            },
            {
              text: '"You are an expert airport operations analyst with 20 years of experience."',
              correct: false,
              feedback:
                'GO AROUND — a persona changes the voice, not the knowledge. An "expert" with no source text is just a more convincing guesser.',
            },
          ],
        },
      ],
    },
    // ── LEG 2.4 ────────────────────────────────────────────────────────────
    {
      id: '2.4',
      code: 'LEG 2.4',
      type: 'DEMO',
      title: 'Flipped Interaction',
      description:
        'Sometimes the best move is handing the model the microphone. Watch the AI interview its user — three questions — then draft a tenant notice that an instant prompt couldn\'t touch.',
      durationMin: 7,
      takeaways: [
        'Flipped Interaction inverts control: the AI asks YOU questions until it has enough to do the task.',
        'Format: "I would like you to ask me questions to achieve X… ask me the first question."',
        'Question Refinement is the always-on cousin: "Whenever I ask a question, suggest a better version."',
      ],
      blocks: [
        {
          type: 'prose',
          id: 'l24-intro',
          heading: 'Hand over the microphone',
          body: [
            'Every prompt so far has followed the same script: you brief, the model delivers. But on fuzzy, high-stakes tasks — the kind where YOU don\'t yet know what the model needs — that script breaks. Vanderbilt\'s fix is the **Flipped Interaction pattern**: an intentional "inversion of control" where "the LLM asks the user questions to achieve some desired goal."',
            'The format is three sentences: `I would like you to ask me questions to achieve X.` / `You should ask questions until condition Y is met.` / `Ask me the first question.` The model knows what a good tenant notice requires — let it extract those details from you instead of guessing them.',
          ],
        },
        {
          type: 'typeAndRespond',
          id: 'l24-chat',
          label: 'SCRIPTED CHAT — the learner picks "Interview me first"',
          prompts: [
            {
              label: 'THE FLIP',
              text: 'I would like you to ask me questions to help you draft our tenant notice about overnight construction near Concourse A. Ask until you have enough information about the audience, the schedule, the impact, and who to contact. Ask me one question at a time. Ask me the first question.',
            },
          ],
          responses: [
            {
              label: 'AI · QUESTION 1 OF 3',
              text: 'Who is the primary reader of this notice — storefront managers, restaurant operators, or all Concourse A tenants — and is it going out by email, the tenant portal, or both?',
            },
            {
              label: 'AI · QUESTION 2 OF 3',
              text: 'What are the exact working hours and dates, and will any utilities, deliveries, or storefront access be affected overnight?',
            },
            {
              label: 'AI · QUESTION 3 OF 3',
              text: 'Who should tenants contact with questions or delivery conflicts, and how quickly can they expect a response?',
            },
            {
              label: 'AI · DRAFT (after your 3 answers)',
              text: 'OVERNIGHT WORK NEAR GATES A3–A5 — BEGINS MARCH 3. From March 3 through mid-April, jet-bridge work runs 11 p.m.–5 a.m. near Gates A3–A5. No storefronts close. Deliveries before 6 a.m. use the A-side service corridor. Contact the properties desk (ext. 2147) — replies within one business day.',
              annotations: [
                'Every specific came from the interview — dates, hours, delivery route, contact.',
                'Three questions cost the user ~90 seconds and saved two rewrite rounds.',
              ],
            },
          ],
        },
        {
          type: 'compare',
          id: 'l24-compare',
          title: 'Instant draft vs. post-interview draft',
          weak: 'Dear tenants, construction will be taking place near your location in the coming weeks. We apologize for any inconvenience and appreciate your cooperation. Please reach out with any questions.',
          strong:
            'From March 3 through mid-April, jet-bridge work runs 11 p.m.–5 a.m. near Gates A3–A5. No storefronts close. Pre-6 a.m. deliveries use the A-side service corridor. Properties desk, ext. 2147 — replies within one business day.',
        },
        {
          type: 'prose',
          id: 'l24-refine',
          heading: 'The always-on cousin: Question Refinement',
          body: [
            'Flipped Interaction is a session you start on purpose. Its lighter cousin runs in the background of every session. The **Question Refinement pattern** (Vanderbilt, verbatim): `From now on, whenever I ask a question, suggest a better version of the question to use instead.` Optional add-on: `Prompt me if I would like to use the better version instead.`',
            'IAA-flavored example: you ask "What should we tell passengers about the shuttle change?" and the model offers the refined version first — "What details should a passenger-facing notice include when Economy Parking shuttle frequency drops from 15 to 30 minutes, and what tone should it strike?" Accept the better question, and the answer improves before any drafting begins.',
          ],
        },
        {
          type: 'promptBuilder',
          id: 'l24-builder',
          title: 'Build the flip yourself',
          parts: [
            {
              id: 'goal',
              label: 'GOAL',
              caption: 'What the interview should achieve — one concrete deliverable.',
            },
            {
              id: 'until',
              label: 'STOP CONDITION',
              caption: 'What "enough information" means — the interview\'s runway end.',
            },
            {
              id: 'style',
              label: 'QUESTION STYLE',
              caption: 'One at a time or in batches — set the pace you can answer.',
            },
            {
              id: 'first',
              label: 'FIRST QUESTION',
              caption: 'The two magic words that hand over the microphone.',
            },
            {
              id: 'task',
              label: 'THEN THE TASK',
              caption: 'What the model produces once the interview closes.',
            },
          ],
          previewTemplate:
            '{goal} I would like you to ask me questions to help you draft our quarterly badging-office renewal reminder to all airport tenants.\n{until} Ask until you have enough information about the audience, the deadlines, the required documents, and the contact for questions.\n{style} Ask me one question at a time.\n{first} Ask me the first question.\n{task} When you have enough, draft the 120-word reminder in a friendly, plain-language tone.',
          cannedResponse:
            'AI · QUESTION 1 OF 4: Who exactly receives this reminder — all badge holders at tenant companies, or one authorized signatory per company — and how is it delivered (email, tenant portal, posted notice)?',
        },
        {
          type: 'callout',
          id: 'l24-when',
          variant: 'tower',
          title: 'Tower Advisory: flip when the task is fuzzy, not when it\'s quick.',
          body: 'Flipped Interaction shines on high-stakes, know-it-when-you-see-it work: board briefs, tenant notices, policy summaries. It costs your minutes — you become the interviewee — so skip it for quick factual asks. "What time does the tenant portal go live Tuesday?" deserves a direct prompt, not a press conference.',
        },
        {
          type: 'callout',
          id: 'l24-privacy',
          variant: 'hold-short',
          title: 'Hold Short: the interview cuts both ways.',
          body: 'When the model interviews you, your answers are the sensitive part — not its questions. Every rule from Gate 5\'s never-transmit list applies mid-conversation: no SSI, no PII, no badge data, no confidential terms, no matter how helpfully the model asks. If question three would need a passenger\'s name or a checkpoint detail to answer, answer it generically ("a passenger," "a secure area") — the draft will be fine.',
        },
        {
          type: 'knowledgeCheck',
          id: 'l24-check',
          question: 'What is Flipped Interaction?',
          options: [
            {
              text: 'Asking the model to rewrite its own answer in a different tone.',
              correct: false,
              feedback:
                'GO AROUND — that\'s revision (a tone transform, Gate 4 territory). Nothing is "flipped" — you\'re still driving every exchange.',
            },
            {
              text: 'Instructing the model to interview you — asking questions until it has enough information to complete the task.',
              correct: true,
              feedback:
                'CLEARED — the inversion of control: the model uses what it knows about good outputs to extract the details from you, then drafts. Best for fuzzy, high-stakes tasks.',
            },
            {
              text: 'Switching between two AI tools so they check each other\'s work.',
              correct: false,
              feedback:
                'GO AROUND — cross-checking is a verification habit (a good one — Gate 5), but it isn\'t Flipped Interaction. The pattern is one model asking YOU the questions.',
            },
          ],
        },
      ],
    },
  ],
  check: {
    title: 'Gate Check 2 — Clearance Exam',
    questionCount: 5,
    passScore: 80,
  },
  labScenarioIds: ['WTP-L04', 'WTP-L05', 'WTP-L08'],
};

/** Named export for registry imports (task spec: g2/g3/g4/g5 per file). */
export const g2 = gate;

export default gate;
