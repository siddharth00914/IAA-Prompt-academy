/**
 * Flight Manual catalog (glossary.md §S3) — 30 reference cards:
 * 10 core moves, 10 Vanderbilt prompt patterns (phrasings per research
 * dim05), 4 task patterns (dim06), 2 frameworks (dim09), 4 safety cards.
 * Adding future cards is data-only.
 */

export type ManualCategory = 'core' | 'pattern' | 'task' | 'framework' | 'safety';

export interface AltFramework {
  name: string;
  letters: string;
  note: string;
}

export interface ManualCard {
  code: string;
  title: string;
  category: ManualCategory;
  /** What it is — short, dense, no filler. */
  blurb: string;
  whenToUse: string[];
  /** Copy-able template; {curly} placeholders copied verbatim. */
  template: string;
  /** A filled-in instance from IND work. */
  example: string;
  /** Codes of related cards. */
  related: string[];
  /** Search synonyms beyond the title/code. */
  tags: string[];
  /** Gate/leg that teaches it (deep link). */
  taughtIn?: { label: string; to: string };
  /** For framework cards: related checklists block. */
  altFrameworks?: AltFramework[];
}

export const CATEGORY_META: Record<
  ManualCategory,
  { label: string; chipClass: string; tagClass: string }
> = {
  core: {
    label: 'CORE MOVES',
    chipClass: 'border-slate-500/60 text-slate-600 hover:bg-slate-100',
    tagClass: 'bg-slate-100 text-slate-600',
  },
  pattern: {
    label: 'PATTERNS',
    chipClass: 'border-amber-500/70 text-amber-600 hover:bg-amber-100',
    tagClass: 'bg-amber-100 text-amber-600',
  },
  task: {
    label: 'TASK PATTERNS',
    chipClass: 'border-field-500/60 text-field-600 hover:bg-field-100',
    tagClass: 'bg-field-100 text-field-600',
  },
  framework: {
    label: 'FRAMEWORKS',
    chipClass: 'border-ink-900/60 text-ink-900 hover:bg-paper-dim',
    tagClass: 'bg-paper-dim text-ink-900',
  },
  safety: {
    label: 'SAFETY',
    chipClass: 'border-signal-500/60 text-signal-600 hover:bg-signal-100',
    tagClass: 'bg-signal-100 text-signal-600',
  },
};

export const MANUAL_CARDS: ManualCard[] = [
  // ── Core moves (Gates 0–3) ────────────────────────────────────────────────
  {
    code: 'CORE-01',
    title: 'Clear instruction',
    category: 'core',
    blurb:
      'One task, one action verb. The single biggest upgrade to any prompt: say exactly what you want done — summarize, draft, classify, extract — in a sentence a new hire could not misread.',
    whenToUse: [
      'Every prompt, always — this is the base layer',
      'When outputs come back vague or off-task',
    ],
    template: 'Summarize the report below in 5 bullets for the executive team.',
    example:
      'Summarize the February ops log below in 5 bullets for the VP of Operations.',
    related: ['CORE-03', 'CORE-04', 'FRMW-02'],
    tags: ['instruction', 'verb', 'clear', 'task', 'specific'],
    taughtIn: { label: 'GATE 1 · LEG 1.1', to: '/gates/g1/legs/1.1' },
  },
  {
    code: 'CORE-02',
    title: 'Delimiters',
    category: 'core',
    blurb:
      'Fence source text so instructions and data never mix. Triple backticks, quotes, or XML-ish tags tell the model: this block is material to work on, not orders to follow.',
    whenToUse: [
      'Pasting emails, logs, or documents to work on',
      'When pasted text contains instructions the model might obey',
    ],
    template:
      'Summarize the email delimited by triple backticks into one action sentence. Email: ```{text}```',
    example:
      'Summarize the passenger complaint delimited by triple backticks into one action sentence. Email: ```{passenger email}```',
    related: ['CORE-07', 'SAFE-02', 'TASK-01'],
    tags: ['delimiters', 'backticks', 'fence', 'source text', 'injection'],
    taughtIn: { label: 'GATE 1 · LEG 1.2', to: '/gates/g1/legs/1.2' },
  },
  {
    code: 'CORE-03',
    title: 'Output format & length',
    category: 'core',
    blurb:
      'Name the container and its size. Models guess format when you don’t — a named container (table, bullets, memo) plus a size (rows, words, sentences) removes the guesswork.',
    whenToUse: ['You know what the deliverable looks like', 'Anything destined for a document or email'],
    template: 'Return a 3-row table: ISSUE | OWNER | ETA. Under 100 words total.',
    example: 'Return a 4-row table: FLIGHT | ISSUE | OWNER | ETA. Under 80 words total.',
    related: ['CORE-01', 'PAT-04', 'TASK-01'],
    tags: ['format', 'length', 'table', 'words', 'structure'],
    taughtIn: { label: 'GATE 1 · LEG 1.3', to: '/gates/g1/legs/1.3' },
  },
  {
    code: 'CORE-04',
    title: 'Positive instructions',
    category: 'core',
    blurb:
      'Say what to do, not what to avoid. “Answer in 3 sentences or less” gives the model a target; “don’t be verbose” gives it nothing to aim at.',
    whenToUse: ['Rewriting instructions that start with “don’t”', 'Tone and length control'],
    template: 'Answer in 3 sentences or less.',
    example: 'Keep the tenant notice under 120 words and put the reopening date in the first sentence.',
    related: ['CORE-01', 'CORE-03', 'TASK-03'],
    tags: ['positive', "don't", 'concise', 'avoid'],
  },
  {
    code: 'CORE-05',
    title: 'Role / persona',
    category: 'core',
    blurb:
      'Give the model a job to work from. A role selects vocabulary, priorities, and depth — the same task reads differently from an ops coordinator than from a public affairs officer.',
    whenToUse: ['Domain-specific drafting', 'When you need a professional point of view, not generic text'],
    template: 'Act as a customer service supervisor at Indianapolis International Airport. {task}',
    example:
      'Act as a customer service supervisor at Indianapolis International Airport. Draft a reply to a passenger whose bag arrived 24 hours late.',
    related: ['PAT-09', 'PAT-03', 'FRMW-02'],
    tags: ['persona', 'role', 'act as', 'expert'],
    taughtIn: { label: 'GATE 2 · LEG 2.1', to: '/gates/g2/legs/2.1' },
  },
  {
    code: 'CORE-06',
    title: 'Audience spec',
    category: 'core',
    blurb:
      'Name the reader and what they don’t know. “Write for concessionaires with no construction background” changes word choice more than any style adjective.',
    whenToUse: ['Public-facing text', 'Anything read by mixed audiences (tenants, passengers, board)'],
    template: 'Write for concessionaires with no construction background.',
    example:
      'Write the Concourse B closure notice for tenants and travelers — no construction jargon, plain dates and times.',
    related: ['PAT-03', 'CORE-05', 'TASK-03'],
    tags: ['audience', 'reader', 'plain language', 'level'],
  },
  {
    code: 'CORE-07',
    title: 'Grounding',
    category: 'core',
    blurb:
      'The anti-hallucination move: chain the model to the source text and give it a sanctioned way to say “not in here.” If the answer isn’t in the text, it says so — instead of inventing one.',
    whenToUse: ['Q&A over documents', 'Anything where a wrong fact costs credibility'],
    template:
      'Answer using ONLY the text below. If the answer isn’t in the text, reply "Not stated in the source."',
    example:
      'Using ONLY the board-paper excerpt below, list the three decision points. If a figure isn’t in the text, reply "Not stated in the source."',
    related: ['CORE-02', 'PAT-06', 'SAFE-01'],
    tags: ['grounding', 'source', 'hallucination', 'verify', 'only'],
    taughtIn: { label: 'GATE 2 · LEG 2.3', to: '/gates/g2/legs/2.3' },
  },
  {
    code: 'CORE-08',
    title: 'Zero-shot vs few-shot',
    category: 'core',
    blurb:
      'Zero-shot asks cold; few-shot shows two or three demonstrations first. Start zero-shot — when the output misses, escalate with examples of exactly what “right” looks like.',
    whenToUse: ['Zero-shot output is close but off-pattern', 'Classification, tone, or format you can show faster than describe'],
    template:
      'Here are two examples of the output I want: {example 1} {example 2}. Now do the same for: {input}.',
    example:
      'Comment: "Wi-Fi was blazing fast" → THEME: Amenities. Comment: "Couldn’t find my carousel" → THEME: Wayfinding. Now label: "Security line moved like a dream."',
    related: ['TASK-02', 'PAT-04', 'CORE-03'],
    tags: ['zero-shot', 'few-shot', 'examples', 'demonstrations'],
    taughtIn: { label: 'GATE 3 · LEG 3.1', to: '/gates/g3/legs/3.1' },
  },
  {
    code: 'CORE-09',
    title: 'Chain-of-thought',
    category: 'core',
    blurb:
      'Ask for the reasoning, not just the answer. “Let’s think step by step” — or better, naming the steps — measurably improves multi-step analysis. Skip it for simple lookups.',
    whenToUse: ['Multi-step trade-offs and comparisons', 'Checking the model’s work on something you’ll sign'],
    template: 'Let’s think step by step: first {step 1}, then {step 2}, then conclude.',
    example:
      'Let’s think step by step: first list the constraints on consolidating employee shuttle routes, then compare the two options against each, then recommend one.',
    related: ['PAT-08', 'CORE-10', 'PAT-07'],
    tags: ['chain of thought', 'cot', 'reasoning', 'steps', 'think'],
    taughtIn: { label: 'GATE 3 · LEG 3.2', to: '/gates/g3/legs/3.2' },
  },
  {
    code: 'CORE-10',
    title: 'Step-back',
    category: 'core',
    blurb:
      'Ask the general principle first, then the specific task with that answer in context. The principle anchors the specifics — like checking the chart before the approach plate.',
    whenToUse: ['Tasks where first principles matter (policy, tone, structure)', 'When direct answers keep missing the point'],
    template:
      'First, state the general principle for {domain}. Then, using that principle, answer: {specific task}.',
    example:
      'First, state the principles of clear public-records writing for a municipal body. Then, using them, rewrite this media advisory.',
    related: ['CORE-09', 'PAT-01', 'FRMW-01'],
    tags: ['step-back', 'principle', 'abstract', 'general'],
  },

  // ── Vanderbilt prompt patterns ────────────────────────────────────────────
  {
    code: 'PAT-01',
    title: 'Question Refinement',
    category: 'pattern',
    blurb:
      'The model sharpens your question before answering it. Great when you know the topic is fuzzy — it will usually name the detail you forgot to specify.',
    whenToUse: ['Vague or exploratory requests', 'Learning a new domain and its vocabulary'],
    template:
      'Whenever I ask a question, suggest a better version of it and ask if I’d like to use it instead.',
    example:
      'Whenever I ask a question about our passenger Wi-Fi survey results, suggest a better version of the question and ask if I’d like to use it instead.',
    related: ['PAT-08', 'CORE-10', 'PAT-02'],
    tags: ['question', 'refine', 'better version', 'sharpen'],
    taughtIn: { label: 'GATE 2 · LEG 2.4', to: '/gates/g2/legs/2.4' },
  },
  {
    code: 'PAT-02',
    title: 'Flipped Interaction',
    category: 'pattern',
    blurb:
      'The AI interviews you. Instead of guessing what you need, it asks questions one at a time until it has enough to do the task well.',
    whenToUse: ['Big drafts where requirements live in your head', 'First pass at a document you haven’t scoped'],
    template:
      'I would like you to ask me questions to {task}. Ask questions one at a time until you have enough information. Ask me the first question.',
    example:
      'I would like you to ask me questions to help me draft the monthly tenant newsletter. Ask questions one at a time until you have enough to write it. Ask me the first question.',
    related: ['PAT-01', 'FRMW-01', 'CORE-05'],
    tags: ['flipped', 'interview', 'ask me', 'questions'],
  },
  {
    code: 'PAT-03',
    title: 'Audience Persona',
    category: 'pattern',
    blurb:
      'Explain it to me as if I were a specific person. The fastest way to re-level any explanation — jargon disappears when the model pictures the listener.',
    whenToUse: ['Getting up to speed on something outside your specialty', 'Prepping to brief a non-technical audience'],
    template: 'Explain {topic} to me. Assume that I am {audience}.',
    example:
      'Explain the FAA VALE grant program to me. Assume that I am an airfield maintenance lead with no grant-writing background.',
    related: ['CORE-06', 'PAT-09', 'CORE-05'],
    tags: ['audience persona', 'explain', 'assume', 'as if'],
  },
  {
    code: 'PAT-04',
    title: 'Template',
    category: 'pattern',
    blurb:
      'Hand the model the skeleton with PLACEHOLDERS and it fills every slot while preserving the structure exactly. Built for recurring notices, briefs, and logs.',
    whenToUse: ['Recurring documents with a fixed shape', 'Anything that must match a house format'],
    template:
      'I will give you a template: {template with PLACEHOLDERS}. Fill each placeholder with appropriate content; preserve the structure exactly.',
    example:
      'Template: CONSTRUCTION NOTICE — {AREA} · {DATES} · Work: {SCOPE} · Tenant impact: {IMPACT} · Contact: {OFFICE}. Fill each placeholder; preserve the structure exactly.',
    related: ['CORE-03', 'PAT-10', 'CORE-08'],
    tags: ['template', 'placeholders', 'structure', 'format'],
  },
  {
    code: 'PAT-05',
    title: 'Recipe',
    category: 'pattern',
    blurb:
      'You know the goal and some of the steps; the model supplies the complete sequence, filling in what you missed and flagging what you don’t need.',
    whenToUse: ['Processes you’re running for the first time', 'Turning a goal into a checklist'],
    template:
      'I want to achieve {goal}. I know I need to do {steps A, B}. Provide the complete sequence including any steps I’m missing.',
    example:
      'I want to publish the new gate-change signage plan. I know I need to draft the notice and get tower sign-off. Provide the complete sequence including any steps I’m missing.',
    related: ['PAT-10', 'FRMW-01', 'CORE-09'],
    tags: ['recipe', 'steps', 'sequence', 'complete'],
  },
  {
    code: 'PAT-06',
    title: 'Fact Check List',
    category: 'pattern',
    blurb:
      'The Gate 5 companion: the model lists the factual claims its own answer depends on, so you can verify them one by one before the answer leaves your desk.',
    whenToUse: ['Any output with dates, numbers, names, or citations', 'Drafts you’ll sign your name to'],
    template:
      'After your answer, list the key factual claims it depends on that I should verify.',
    example:
      'Summarize the capital-projects board paper, then list the key factual claims — figures, dates, project names — that I should verify against the original.',
    related: ['SAFE-01', 'CORE-07', 'PAT-07'],
    tags: ['fact check', 'verify', 'claims', 'citations', 'hallucination'],
    taughtIn: { label: 'GATE 4 · LEG 4.3', to: '/gates/g4/legs/4.3' },
  },
  {
    code: 'PAT-07',
    title: 'Reflection',
    category: 'pattern',
    blurb:
      'The model critiques its own answer against a standard you name — accuracy, completeness, tone — and revises once. A built-in second pair of eyes.',
    whenToUse: ['Important drafts', 'When the first answer feels off but you can’t say why'],
    template:
      'After answering, critique your own response for {accuracy/completeness/tone} and revise it once.',
    example:
      'Draft the snow-day social post, then critique your own response for accuracy, completeness, and tone, and revise it once.',
    related: ['PAT-06', 'PAT-01', 'CORE-09'],
    tags: ['reflection', 'critique', 'revise', 'self-check'],
  },
  {
    code: 'PAT-08',
    title: 'Cognitive Verifier',
    category: 'pattern',
    blurb:
      'Big questions get subdivided: the model breaks your question into smaller sub-questions, answers each, then combines them into a final answer.',
    whenToUse: ['Questions with several moving parts', 'When one-shot answers keep dropping a dimension'],
    template:
      'Break my question into smaller sub-questions, answer each, then combine them into a final answer.',
    example:
      'Break my question about consolidating the employee shuttle routes into smaller sub-questions, answer each, then combine them into a recommendation.',
    related: ['CORE-09', 'PAT-01', 'CORE-10'],
    tags: ['cognitive verifier', 'sub-questions', 'break down', 'combine'],
  },
  {
    code: 'PAT-09',
    title: 'Persona (expert)',
    category: 'pattern',
    blurb:
      'The domain-depth variant of the persona move: name the specialty and point of view the model should write from. It sharpens voice, vocabulary, and frame — but the evidence is mixed: personas don’t improve factual accuracy and can even degrade recall. Cast for perspective, then verify the facts as always.',
    whenToUse: ['Specialized review (ops, legal-adjacent, grants)', 'Stress-testing a plan against an expert’s habits'],
    template: 'Act as an airport operations manager with 20 years of irregular-ops experience. {task}',
    example:
      'Act as an airport operations manager with 20 years of irregular-ops experience. Review this tarmac-delay staffing plan and name the three weakest points.',
    related: ['CORE-05', 'PAT-03', 'FRMW-02'],
    tags: ['persona', 'expert', 'act as', 'experience'],
  },
  {
    code: 'PAT-10',
    title: 'Output Automator',
    category: 'pattern',
    blurb:
      'Turn a good answer into a reusable tool: the model produces a checklist or script you can apply to every future document of that type.',
    whenToUse: ['You solved it once and will face it monthly', 'Standardizing a team’s drafts'],
    template:
      'Produce a reusable checklist I can apply to every future {document type}.',
    example:
      'Produce a reusable checklist I can apply to every future tenant construction notice before it goes to Properties for review.',
    related: ['PAT-04', 'PAT-05', 'CORE-03'],
    tags: ['automator', 'checklist', 'reusable', 'script'],
  },

  // ── Task patterns (Gate 4, DeepLearning.AI set) ───────────────────────────
  {
    code: 'TASK-01',
    title: 'Summarize',
    category: 'task',
    blurb:
      'Compression with limits and focus: name the length and the lens. “Summarize” alone summarizes everything; “in ≤120 words, focusing on decisions and risks” summarizes for a reader.',
    whenToUse: ['Long documents into briefs', 'Meeting logs, board papers, feedback dumps'],
    template: 'Summarize {doc} in ≤120 words, focusing only on decisions needed and risks.',
    example:
      'Summarize the Tarmac Delay Contingency Plan in ≤120 words, focusing only on decisions needed from station managers and the risks of getting them wrong.',
    related: ['CORE-02', 'CORE-03', 'TASK-02'],
    tags: ['summarize', 'summary', 'brief', 'extract', 'condense'],
    taughtIn: { label: 'GATE 4 · LEG 4.1', to: '/gates/g4/legs/4.1' },
  },
  {
    code: 'TASK-02',
    title: 'Infer',
    category: 'task',
    blurb:
      'Read what the text implies: sentiment, themes, intent, urgency. Give the model the labels (or ask it to propose them) and get structured signal from messy text.',
    whenToUse: ['Guest comments, survey text, complaint letters', 'Triaging a pile of unstructured feedback'],
    template:
      'Classify each comment’s sentiment (positive/neutral/negative) and list the top 3 themes as a table.',
    example:
      'Classify each of these 25 guest comments’ sentiment (positive/neutral/negative) and list the top 3 themes as a table with counts.',
    related: ['CORE-08', 'TASK-01', 'CORE-03'],
    tags: ['infer', 'sentiment', 'classify', 'themes', 'topics'],
  },
  {
    code: 'TASK-03',
    title: 'Transform',
    category: 'task',
    blurb:
      'Same content, new shape: tone shifts, jargon removal, format conversion, translation (with human review). The raw material stays; the package changes.',
    whenToUse: ['Internal log → public statement', 'Technical → plain language', 'Rewrite and tone jobs'],
    template: 'Rewrite this radio log as a calm, jargon-free public statement of 2 sentences.',
    example:
      'Rewrite this deice-pad operations log as a calm, jargon-free public statement of 2 sentences for the airport’s social channels.',
    related: ['CORE-04', 'CORE-06', 'TASK-04'],
    tags: ['transform', 'rewrite', 'tone', 'translate', 'convert', 'plain language'],
  },
  {
    code: 'TASK-04',
    title: 'Expand',
    category: 'task',
    blurb:
      'Bullets become prose: give the model your skeleton points plus tone and length, and it drafts the full document. You stay the author of the facts.',
    whenToUse: ['Notes → email, outline → draft', 'When you know what to say but not how to phrase it'],
    template: 'Using these 3 bullets, draft a 150-word tenant email. Tone: reassuring, specific about dates.',
    example:
      'Using these 3 bullets — overnight water shutoff Tuesday, Concourse B east restrooms, back by 05:00 — draft a 150-word tenant email. Tone: reassuring, specific about dates.',
    related: ['TASK-03', 'CORE-06', 'PAT-04'],
    tags: ['expand', 'draft', 'bullets', 'email', 'tone'],
  },

  // ── Frameworks ────────────────────────────────────────────────────────────
  {
    code: 'FRMW-01',
    title: 'CO-STAR',
    category: 'framework',
    blurb:
      'The six-part pre-flight checklist for big jobs: Context, Objective, Style, Tone, Audience, Response format. From GovTech Singapore’s data team — the framework that won their national prompt competition.',
    whenToUse: ['High-stakes or public-facing drafts', 'When a prompt keeps underperforming and you can’t see why'],
    template: `Context: {who you are and the situation}
Objective: {the one thing you want done}
Style: {the writing style to match}
Tone: {the attitude of the delivery}
Audience: {who will read it and what they don't know}
Response format: {container and length}`,
    example:
      'Context: IAA public affairs, irregular ops. Objective: draft a 150-word storm-prep post. Style: IND’s Hoosier-hospitality voice. Tone: calm, practical. Audience: departing passengers. Response: 3 short paragraphs + link line.',
    related: ['FRMW-02', 'CORE-01', 'PAT-02'],
    tags: ['co-star', 'framework', 'checklist', 'context', 'objective', 'style', 'tone', 'audience', 'response'],
    // Reference card: no single leg teaches CO-STAR end-to-end; Gates 1–2 cover its components.
  },
  {
    code: 'FRMW-02',
    title: 'CREATE',
    category: 'framework',
    blurb:
      'Character, Request, Examples, Adjustments, Type of output, Extras. The conversational framework: strong on iteration — Adjustments is where second drafts happen.',
    whenToUse: ['Iterative drafting sessions', 'When you’ll refine through several replies'],
    template: `Character: {role for the AI}
Request: {clear, specific task with context}
Examples: {samples of the tone/format you want}
Adjustments: {what to change after the first pass}
Type of output: {format and length}
Extras: {anything else: closing lines, constraints}`,
    example:
      'Character: airport communications specialist. Request: reply to a lost-item inquiry. Examples: match our posted replies. Adjustments: under 100 words. Type: plain-text email + subject. Extras: end with the Guest Services hours.',
    related: ['FRMW-01', 'CORE-05', 'PAT-07'],
    tags: ['create', 'framework', 'character', 'request', 'examples', 'adjustments', 'tone', 'iterate'],
    // Reference card: no single leg teaches CREATE end-to-end; Gate 4 covers its iteration loop.
    altFrameworks: [
      {
        name: 'RISEN',
        letters: 'Role · Instructions · Steps · End goal · Narrowing',
        note: 'when the task is a procedure with an obvious finish line.',
      },
      {
        name: 'RTCF',
        letters: 'Role · Task · Context · Format',
        note: 'the four-part minimum for everyday asks.',
      },
      {
        name: 'CLEAR',
        letters: 'Concise · Logical · Explicit · Adaptive · Reflective',
        note: 'the checklist for reviewing a prompt before you send it.',
      },
    ],
  },

  // ── Safety (Gate 5) ───────────────────────────────────────────────────────
  {
    code: 'SAFE-01',
    title: 'Verify before use',
    category: 'safety',
    blurb:
      'Every fact, number, date, gate, regulation, and name gets checked against an authoritative source before it leaves your desk. AI is never the source of truth — and never cited as authority.',
    whenToUse: ['Every output, every time', 'Anything with a number, date, name, or citation in it'],
    template:
      'Before sending: check every fact, number, date, name, and citation in this output against {authoritative source}.',
    example:
      'The draft says the solar farm powers “3,210 homes.” Check that figure against the indsolarfarm.com fact sheet before the release goes out.',
    related: ['PAT-06', 'CORE-07', 'SAFE-04'],
    tags: ['verify', 'fact', 'hallucination', 'check', 'source'],
    taughtIn: { label: 'SAFETY BRIEFING', to: '/safety' },
  },
  {
    code: 'SAFE-02',
    title: 'Never-transmit list',
    category: 'safety',
    blurb:
      'SSI (49 CFR 1520), passenger and employee PII, badge and door data, and law-enforcement material never go into an AI tool. Not redacted, not “just the schedule” — never.',
    whenToUse: ['Before anything is pasted anywhere', 'Training new staff on the boundary'],
    template:
      'Paste check: no SSI (49 CFR 1520), no PII, no badge/door/access data, no law-enforcement data, no business-confidential terms.',
    example:
      'Security checkpoint staffing schedules are SSI — need-to-know only, civil penalties for disclosure. They never go into an AI tool.',
    related: ['SAFE-03', 'SAFE-01', 'CORE-02'],
    tags: ['ssi', 'pii', 'never', 'transmit', 'badge', 'law enforcement', '1520'],
    taughtIn: { label: 'SAFETY BRIEFING', to: '/safety' },
  },
  {
    code: 'SAFE-03',
    title: 'Prompts are public records',
    category: 'safety',
    blurb:
      'IAA is a public body. Assume anything typed into an AI tool could be requested under Indiana’s public-records law or read back to you in a headline.',
    whenToUse: ['Composing any prompt', 'Deciding what work belongs in approved tools'],
    template:
      'Write every prompt as if it will be read aloud at a public meeting — because it could be.',
    example:
      'Before prompting about the concession negotiation, assume the prompt itself could be requested under APRA. Choose words — and tools — accordingly.',
    related: ['SAFE-02', 'SAFE-04', 'SAFE-01'],
    tags: ['public record', 'apra', 'transparency', 'prompt'],
    taughtIn: { label: 'SAFETY BRIEFING', to: '/safety' },
  },
  {
    code: 'SAFE-04',
    title: 'Human in charge of safety-critical text',
    category: 'safety',
    blurb:
      'No AI-drafted NOTAMs, emergency instructions, security procedures, or regulatory correspondence without review and sign-off by the authorized official. AI drafts; humans certify.',
    whenToUse: ['Anything safety-critical or regulatory', 'Setting team norms for AI-assisted drafting'],
    template:
      'AI drafts; the authorized official signs. No exceptions for NOTAMs, emergency instructions, security procedures, or regulatory correspondence.',
    example:
      'The storm-procedures memo can be AI-drafted for structure — but the director of operations reviews and signs it before distribution.',
    related: ['SAFE-01', 'SAFE-03', 'PAT-06'],
    tags: ['human', 'sign-off', 'safety-critical', 'notam', 'review'],
    taughtIn: { label: 'SAFETY BRIEFING', to: '/safety' },
  },
];

export const TOTAL_CARDS = MANUAL_CARDS.length;

/** Instant client-side search: name/code/tags/blurb. */
export function searchCards(query: string, category: ManualCategory | 'all'): ManualCard[] {
  const q = query.trim().toLowerCase();
  return MANUAL_CARDS.filter((c) => {
    if (category !== 'all' && c.category !== category) return false;
    if (!q) return true;
    const haystack = [c.code, c.title, c.blurb, ...c.tags, ...c.related].join(' ').toLowerCase();
    return q.split(/\s+/).every((term) => haystack.includes(term));
  });
}
