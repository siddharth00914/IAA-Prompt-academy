/**
 * IAA Prompt Academy — the 12 Prompt Lab scenarios (promptlab.md §S1, §S5).
 *
 * IDs are unpadded (`WTP-L1`…`WTP-L12`) because progress.ts keys capstone
 * completion on exactly `WTP-L10`, `WTP-L11`, `WTP-L12`. Use `scenarioCode()`
 * for the padded departures-board display (`WTP-L01`).
 *
 * Excerpts are canned training data. Scenarios flagged `containsFauxSensitive`
 * embed fake PII/SSI-shaped items on purpose — the excerpt card shows a HOLD
 * SHORT banner, and pasting genuine sensitivity signals (badge numbers, SSNs,
 * SSI markings) into a prompt trips the v2 safety wire (src/lib/rubric.ts).
 * Plain emails/phones earn an advisory, not a hold. Gold prompts model the
 * safe pattern and never contain the sensitive item.
 *
 * v2: every scenario authors an `anchors` set — the distinctive terms of the
 * assignment (facts, names, deliverables). The rubric scores scenario-anchored
 * relevance against it (near-zero overlap → OFF COURSE). The field rides on
 * top of the frozen Scenario model (types.ts) via the AnchoredScenario
 * intersection below.
 *
 * v2 gold prompts are deliberately VARIED, not one maximalist recipe: half
 * skip the persona entirely, several are compact (120–180 words), and the
 * structures differ (fenced facts, inline facts, numbered asks, letter-style).
 * Every gold scores ≥ 85 in the v2 engine.
 */
import type { Scenario } from '@/content/types';

/** Scenario model extension: v2 relevance anchors (kept out of types.ts). */
export type AnchoredScenario = Scenario & {
  /** Distinctive terms of the assignment used by the rubric's relevance check. */
  anchors: string[];
};

/** Padded board code: WTP-L1 → WTP-L01 (WTP-L10+ unchanged). */
export function scenarioCode(id: string): string {
  return id.replace(/^(WTP-L)(\d)$/, '$10$2');
}

export const SCENARIOS: AnchoredScenario[] = [
  // ── WTP-L1 ────────────────────────────────────────────────────────────────
  {
    id: 'WTP-L1',
    title: '"Best Airport, Again" press release',
    fn: 'Public Affairs',
    gateId: 'g1',
    role: 'Communications coordinator, Indianapolis Airport Authority.',
    persona: 'comms',
    brief:
      'IND has just been named Best Airport in North America for the 14th straight year. Draft the announcement press release: a headline and three body paragraphs, quote-ready in tone, no more than 300 words. The award facts, the record passenger year, and the solar farm all belong in the story.',
    greatLooksLike: [
      'Names the award + the 14-year streak',
      'Mentions the record 10.6M passengers (2025)',
      'Works the solar farm in naturally',
      'Quote-ready, community-proud tone',
      'Headline + 3 paragraphs, ≤ 300 words',
    ],
    anchors: [
      'press release',
      'best airport',
      '14th',
      'consecutive',
      '10.6',
      'passenger',
      'solar farm',
      'award',
      'headline',
      'IND',
      'acres',
      'embargo',
      'ACI',
      'ASQ',
    ],
    dataExcerpt: `AWARD FACT SHEET — INTERNAL
• Indianapolis International Airport (IND) named Best Airport in North America, Airports Council International (ACI) Airport Service Quality (ASQ) Awards.
• 14th consecutive year — a streak no other airport on the continent holds.
• IND welcomed a record 10.6 million passengers in 2025 — nearly 100,000 more than in 2024.
• Solar farm: 183 acres — among the largest airport-based solar farms in the nation.
• Quote on file from the executive director, available on request.
Embargo lifts Tuesday 06:00 ET.`,
    suggestedLength: '≤ 300 words',
    hint: 'A press release answers who/what/why in sentence one. Tell the model the award, the streak, the audience, and the tone — then cap the words, because releases sprawl without a limit.',
    exampleFragment:
      'Draft a press release announcing that Indianapolis International Airport (IND) has been named Best Airport in North America for the 14th consecutive year. Format: headline + 3 paragraphs, ≤ 300 words. Tone: confident, community-proud…',
    goldPrompt: `You are the communications coordinator at the Indianapolis Airport Authority. Draft the press release announcing that IND has been named Best Airport in North America for the 14th consecutive year — for local media and central Indiana travelers, because the streak is a genuine point of community pride.

Give me a headline plus three body paragraphs, about 280 words and no more than 300. Confident, community-proud, quote-ready — plain language, no jargon. Work only from the facts below; do not invent quotes or figures. The record passenger year (10.6 million in 2025) must appear, and close on a forward-looking line such as the solar farm milestone.

Facts:
\`\`\`
• Best Airport in North America, ACI Airport Service Quality (ASQ) Awards — 14th consecutive year, a streak no other airport holds.
• Record 10.6 million passengers in 2025 — nearly 100,000 more than in 2024.
• 183-acre solar farm — among the largest airport-based solar farms in the nation.
• Quote on file from the executive director, available on request.
\`\`\``,
  },

  // ── WTP-L2 ────────────────────────────────────────────────────────────────
  {
    id: 'WTP-L2',
    title: 'Winter-storm irregular-ops summary',
    fn: 'Operations',
    gateId: 'g4',
    role: 'Operations coordinator on the midnight shift, Indianapolis Airport Authority.',
    persona: 'ops',
    brief:
      'Winter Storm Kai chewed up the overnight operation, and the 2-page irregular-ops report on your desk must reach the executive team as five bullets — 120 words or fewer — with any decisions-needed items flagged before their 08:00 meeting. The excerpt is attached.',
    greatLooksLike: [
      'Exactly 5 bullets, ≤ 120 words',
      'Decisions-needed items flagged',
      'Numbers match the excerpt exactly',
      'Calm, plain language — no radio jargon',
    ],
    anchors: [
      'winter storm kai',
      'kai',
      'irregular ops',
      'runway',
      'de-ice',
      'deice',
      'executive',
      'bullet',
      'diversion',
      'ground-delay',
      'snow-removal',
      'parking',
      'departure',
      '08:00',
      'report',
      'decision',
    ],
    dataExcerpt: `IRREGULAR OPS REPORT — WINTER STORM KAI (EXCERPT)
02:10–04:25 — Runway 5L/23R closed for plowing; 5R/23L stayed open at a reduced arrival rate.
47 departures delayed, 11 cancelled (mostly regional carriers). De-ice queue peaked at a 38-minute average wait, 05:00–07:00.
6 diversions received from Chicago O'Hare.
Terminal: 340 passengers stayed overnight; cots distributed, concessionaires extended hours.
DECISIONS PENDING: (1) request an FAA ground-delay program for tomorrow's 06:00–10:00 bank, yes/no; (2) overtime approval for 14 additional snow-removal crew through Friday; (3) waiving parking fees for stranded passengers (est. $8,400).`,
    suggestedLength: '5 bullets · ≤ 120 words',
    hint: 'Executives skim. Tell the model the audience, the exact bullet count, and the word cap — and tell it to mark anything that needs a decision so nothing pending hides in a bullet.',
    exampleFragment:
      'Summarize the report below as 5 bullets for the executive team, ≤ 120 words. Flag any bullet that needs a decision with DECIDE. Use only the report — do not invent numbers…',
    goldPrompt: `Turn the irregular-ops report below into a morning brief for the executive team, who must settle open items before 08:00 because the next arrival bank starts at 06:00.

Exactly five bullets, 120 words or fewer, calm plain language — no radio jargon. Flag every bullet that needs a decision with DECIDE; a flagged bullet reads, e.g., "DECIDE: approve overtime for 14 extra snow-removal crew." Numbers must match the report exactly — do not round or invent.

Report:
\`\`\`
02:10–04:25 — Runway 5L/23R closed for plowing; 5R/23L open at reduced arrival rate.
47 departures delayed, 11 cancelled; de-ice queue peaked at a 38-minute average wait, 05:00–07:00.
6 diversions received from Chicago O'Hare; 340 passengers stayed overnight, cots distributed.
Pending: FAA ground-delay program for the 06:00–10:00 bank (yes/no); overtime for 14 extra snow-removal crew through Friday; parking-fee waiver for stranded passengers (est. $8,400).
\`\`\``,
  },

  // ── WTP-L3 ────────────────────────────────────────────────────────────────
  {
    id: 'WTP-L3',
    title: 'Delayed-bag passenger reply',
    fn: 'Terminal Services',
    gateId: 'g1',
    role: 'Guest services agent, Indianapolis Airport Authority.',
    persona: 'ops',
    brief:
      'A passenger\u2019s bag arrived 26 hours late on their first-ever visit to Indianapolis, and they are (fairly) upset. Draft the reply: empathetic and accountable, one clear next step, the claim reference IND-4471, 120 words or fewer.',
    greatLooksLike: [
      'Empathetic, accountable tone — apologizes once',
      'States the next step (hotel delivery tonight)',
      'Includes claim reference IND-4471',
      '≤ 120 words, no contact data in the prompt',
    ],
    anchors: [
      'bag',
      'claim',
      'IND-4471',
      '26 hour',
      'passenger',
      'hotel',
      'reply',
      'atlanta',
      'lightning',
      'first visit',
      'empathetic',
      'deliver',
    ],
    dataExcerpt: `CASE FILE — BAG CLAIM IND-4471
Passenger: M. Alvarez · m.alvarez317@example.com · 317-555-0148
Flight: WTP 1182, Orlando (MCO) → Indianapolis (IND), arrived Tuesday 22:40.
Bag arrived 26 hours after the passenger; delivered to the claim office Wednesday 14:20.
Cause: bag missed the Atlanta connection during a ramp lightning delay.
Passenger is upset; first visit to Indianapolis.
Next step per policy: deliver the bag to the passenger's downtown hotel tonight; reference claim IND-4471 in all contact.`,
    containsFauxSensitive: true,
    suggestedLength: '≤ 120 words',
    hint: 'Empathy is a spec, not a vibe: name the tone, the one next step, and the claim reference. And notice the case file — real PII like emails and phone numbers never goes into a prompt. Describe the case; don\u2019t paste the person.',
    exampleFragment:
      'Draft a reply to an upset passenger whose bag arrived 26 hours late, ≤ 120 words. Tone: warm, accountable, plain language. Use only the case facts below — reference claim IND-4471 and leave out all contact details…',
    goldPrompt: `You are a guest services agent for the Indianapolis Airport Authority. Draft the reply to an upset passenger whose bag arrived 26 hours late on their first visit to Indianapolis, because how we answer decides whether they ever fly IND again.

One email, 120 words or fewer: warm, empathetic, accountable plain language. Apologize once — one plain sentence, e.g., "We are sorry your bag kept you waiting." — then move to the fix. State the one next step (the bag missed the Atlanta connection during a ramp lightning delay and is being delivered to their downtown hotel tonight) and reference claim IND-4471. Describe the case only; leave out all contact details.`,
  },

  // ── WTP-L4 ────────────────────────────────────────────────────────────────
  {
    id: 'WTP-L4',
    title: 'Concourse construction tenant newsletter',
    fn: 'Properties',
    gateId: 'g2',
    role: 'Properties coordinator, Indianapolis Airport Authority.',
    persona: 'maint',
    brief:
      'Six weeks of overnight construction start near the Concourse A gates, and every concessionaire needs to know what is happening, when, and who to call. Draft the tenant newsletter notice: professional and reassuring, with deliveries and staffing in mind.',
    greatLooksLike: [
      'What / when / who-to-contact all covered',
      '6 weeks, 22:00–05:00 work window, Mar 3 – Apr 13',
      'Delivery reroute to the B-side dock mentioned',
      'Reassuring, professional tone',
    ],
    anchors: [
      'concourse a',
      'construction',
      'concessionaire',
      'tenant',
      'terrazzo',
      '22:00',
      '05:00',
      'deliveries',
      'b-side',
      'newsletter',
      'gate a3',
      '6 week',
      'okafor',
      'holdroom',
    ],
    dataExcerpt: `CONSTRUCTION BULLETIN — CONCOURSE A
Contractor: Summit & Rieger Builders.
Scope: terrazzo floor replacement and ceiling work near Gates A3–A7.
Schedule: 6 weeks, March 3 – April 13. Work runs 22:00–05:00 only; the concourse stays fully open during the day.
Impact: Gates A3–A7 holdrooms close in rotating pairs (never more than 2 at once); dust partitions up overnight, down by 05:00; wayfinding detours posted.
Concessionaire ops: deliveries reroute to the B-side dock on work nights; no utility shutoffs expected.
Contact: R. Okafor, Properties, ext. 4410.`,
    suggestedLength: '≤ 180 words',
    hint: 'Tenants read for impact on their business. Give the model the audience (concessionaires), the structure (what/when/contact), and a reassurance instruction so the notice calms instead of alarms.',
    exampleFragment:
      'Draft a newsletter notice for concessionaires about 6 weeks of overnight construction near Concourse A gates. Format: headline + 3 short paragraphs (what / when / who to contact), ≤ 180 words. Tone: professional, reassuring…',
    goldPrompt: `Draft a tenant newsletter notice for concessionaires about six weeks of overnight construction near the Concourse A gates, because they must plan deliveries and staffing around the work.

Structure the notice as a short headline plus three short paragraphs — what's happening, when, and who to contact — about 170 words, 180 at most. Professional, reassuring, plain language. Use only the bulletin below; do not speculate about impacts beyond it, and make sure the delivery reroute to the B-side dock is in there. Reassure tenants the concourse stays open during the day, e.g., a line like "business as usual until 22:00."

Bulletin:
\`\`\`
Terrazzo and ceiling work near Gates A3–A7, March 3 – April 13 (6 weeks), 22:00–05:00 only; the concourse stays fully open during the day.
Holdrooms close in rotating pairs, never more than 2 at once; detours posted.
Deliveries reroute to the B-side dock on work nights; no utility shutoffs expected.
Contact: R. Okafor, Properties, ext. 4410.
\`\`\``,
  },

  // ── WTP-L5 ────────────────────────────────────────────────────────────────
  {
    id: 'WTP-L5',
    title: 'Solar-farm milestone social posts',
    fn: 'Public Affairs',
    gateId: 'g2',
    role: 'Public affairs officer, Indianapolis Airport Authority.',
    persona: 'comms',
    brief:
      'For Earth Week, Public Affairs is spotlighting the airport’s 183-acre solar farm — among the largest airport-based solar farms in the nation. Draft three platform posts (LinkedIn, X, Facebook) at platform-appropriate lengths, sharing one hashtag set.',
    greatLooksLike: [
      'Three labeled posts: LinkedIn / X / Facebook',
      'Platform lengths respected (X ≤ 280 chars)',
      'One shared hashtag set',
      '183 acres + 3,675 homes figures used correctly',
    ],
    anchors: [
      'solar farm',
      '183 acre',
      '3675',
      'home',
      'linkedin',
      'facebook',
      'earth week',
      'hashtag',
      'apiary',
      'sustainability',
      'post',
      'panel',
    ],
    dataExcerpt: `EARTH WEEK MEMO — SOLAR FARM SPOTLIGHT
The IND solar farm covers 183 acres (17.5 MW) — among the largest airport-based solar farms in the nation.
Output: enough electricity to power roughly 3,675 average American homes per year.
The airport’s wider sustainability program also keeps a bee apiary on airport land and runs electric shuttle buses.
Visual available: aerial photo of the panel field with the terminal roof behind it.
Posting window: Earth Week.`,
    suggestedLength: 'LinkedIn ≤ 100 words · X ≤ 280 chars · Facebook ≤ 60 words',
    hint: 'One story, three packages. Name each platform, its length, and a shared hashtag set — and give the model the two or three facts that must survive every cut.',
    exampleFragment:
      'Create three social posts announcing Phase III of the IND solar farm. Format: LinkedIn (≤ 100 words), X (≤ 280 characters), Facebook (≤ 60 words), plus one hashtag set. Tone: upbeat, community-proud…',
    goldPrompt: `Create three social posts spotlighting the airport's 183-acre solar farm for Earth Week — for our followers and the central Indiana community, because this is a story about the region, not just the airport.

Package it three ways, plus one shared hashtag set:
1. LinkedIn — 100 words or fewer; open with the homes-powered figure, e.g., "enough electricity to power about 3,675 average American homes a year."
2. X — 280 characters or fewer.
3. Facebook — 60 words or fewer, warm and community-proud.

Use only these facts; do not invent figures:
\`\`\`
The solar farm covers 183 acres (17.5 MW) — among the largest airport-based solar farms in the nation.
Powers roughly 3,675 average American homes per year.
Sustainability program extras: a bee apiary on airport land; electric shuttle buses.
\`\`\``,
  },

  // ── WTP-L6 ────────────────────────────────────────────────────────────────
  {
    id: 'WTP-L6',
    title: 'Parking-revenue board brief',
    fn: 'Finance',
    gateId: 'g4',
    role: 'Finance analyst, Indianapolis Airport Authority.',
    persona: 'comms',
    brief:
      'The year-end parking revenue table goes before the board next week, and the finance director needs a meeting brief: exactly three key takeaways, one risk, and one recommendation. Every number must match the table exactly — the board will check.',
    greatLooksLike: [
      'Exactly 3 takeaways + 1 risk + 1 recommendation',
      'Numbers match the table ($40.1M total, +6.6%)',
      'Risk tied to a real line (valet or surface)',
      'Recommendation follows from the numbers',
    ],
    anchors: [
      'parking',
      'revenue',
      'board',
      'takeaway',
      'risk',
      'recommendation',
      'garage',
      'valet',
      'economy',
      '40.1',
      '6.6',
      'table',
      'fy2025',
      'shuttle',
    ],
    dataExcerpt: `PARKING REVENUE — FY2025 YEAR-END TABLE
Product        FY2024      FY2025      Change
Garage         $21.4M      $23.1M      +8.0%
Surface lots   $6.2M       $5.8M       −6.5%
Economy        $8.9M       $10.3M      +15.7%
Valet          $1.1M       $0.9M       −18.2%
TOTAL          $37.6M      $40.1M      +6.6%
Notes: economy growth tracks the new 7-minute shuttle frequency; valet decline follows the contractor rate increase in Q2; the 48 garage EV spaces ran at 92% utilization.`,
    suggestedLength: '3 takeaways + 1 risk + 1 recommendation · ≤ 150 words',
    hint: 'Boards want shape, not a spreadsheet read aloud. Specify the exact structure (3 takeaways, 1 risk, 1 recommendation), the word cap, and a hard rule that numbers must match the table — that rule is what keeps a model honest.',
    exampleFragment:
      'Summarize the parking-revenue table below for the board: exactly 3 key takeaways, 1 risk, 1 recommendation, ≤ 150 words. Numbers must match the table exactly — do not round or invent figures…',
    goldPrompt: `You are a finance analyst at the Indianapolis Airport Authority. Summarize the parking-revenue table below as a board-meeting brief for the board of directors, because members must vote on next year's rate proposal at this meeting.

Exactly 3 key takeaways, 1 risk, and 1 recommendation — labeled lines, 150 words or fewer. Measured, professional, no jargon. Use only the table below; numbers must match it exactly — do not round or invent figures.

Table:
\`\`\`
Garage $21.4M → $23.1M (+8.0%)
Surface lots $6.2M → $5.8M (−6.5%)
Economy $8.9M → $10.3M (+15.7%) — tracks the new 7-minute shuttle frequency
Valet $1.1M → $0.9M (−18.2%) — follows the Q2 contractor rate increase
TOTAL $37.6M → $40.1M (+6.6%); 48 garage EV spaces at 92% utilization
\`\`\``,
  },
];

// ── WTP-L7 ────────────────────────────────────────────────────────────────
SCENARIOS.push({
  id: 'WTP-L7',
  title: 'Radio log → public status statement',
  fn: 'Maintenance',
  gateId: 'g4',
  role: 'Maintenance communications lead, Indianapolis Airport Authority.',
  persona: 'maint',
  brief:
    'An escalator outage on Concourse B came across the maintenance radio in pure shorthand. Turn the log into a calm, jargon-free public status statement of two sentences — the kind guest services can post at the top of the escalator and read aloud.',
  greatLooksLike: [
    'Exactly 2 sentences, jargon-free',
    'States the detour (B-1 or elevator E-2)',
    'Calm tone — no alarm, no radio shorthand',
    'Unit/badge numbers stay out of the prompt',
  ],
  anchors: [
    'escalator',
    'concourse b',
    'radio log',
    'status statement',
    'passenger',
    'b-1',
    'e-2',
    'elevator',
    'jargon',
    'sentence',
    'out of service',
    'food court',
    'unit',
  ],
  dataExcerpt: `RADIO LOG — CONCOURSE B (TRANSCRIPT)
14:02 Unit 412: "Escalator B-3 southbound U/S, repeating, B-3 is U/S."
14:03 Dispatch: "Copy 412. What's the TTR?"
14:04 Unit 412: "Tech on site says motor contactor — parts on hand, maybe 2 hrs. Badge #4417 signing the lockout tag."
14:06 Dispatch: "Copy. Redirect pax to escalator B-1 north end or elevator E-2 by the food court."
14:31 Unit 412: "B-3 back in service, testing complete."`,
  containsFauxSensitive: true,
  suggestedLength: '2 sentences · ≤ 45 words',
  hint: 'Translation prompts live or die on what you tell the model to leave out. Name the audience (passengers), the sentence count, and the strip-list: unit numbers, badge numbers, and radio shorthand never reach the public. Notice the badge number in the log — in the real world, that stays out of any prompt too.',
  exampleFragment:
    'Rewrite the log below as a public status statement for passengers: 2 sentences, ≤ 45 words, calm and jargon-free. Omit unit numbers, badge numbers, and radio shorthand…',
  goldPrompt: `You are the maintenance communications lead at Indianapolis International Airport. Turn the radio log below into a public status statement for passengers in the terminal, because travelers need a calm, clear picture while the escalator is down.

Two sentences, 45 words or fewer, calm and jargon-free. Use only the log; leave out unit numbers, badge numbers, and radio shorthand — say only what staff would say aloud.

Log:
\`\`\`
14:02 Escalator B-3 (southbound, Concourse B) reported out of service.
14:04 Technician on site: motor contactor, parts on hand, about 2 hours. Passengers redirected to escalator B-1 (north end) or elevator E-2 by the food court.
14:31 Back in service, testing complete.
\`\`\``,
});

// ── WTP-L8 ────────────────────────────────────────────────────────────────
SCENARIOS.push({
  id: 'WTP-L8',
  title: 'Travel-policy HR FAQ',
  fn: 'Human Resources',
  gateId: 'g2',
  role: 'HR coordinator, Indianapolis Airport Authority.',
  persona: 'comms',
  brief:
    'The new staff travel policy took effect this month, and the HR inbox is already filling up. Generate a six-question FAQ from the policy excerpt — plain language, question-and-answer format — that answers what staff actually ask before they travel.',
  greatLooksLike: [
    'Exactly 6 question-and-answer pairs',
    'Plain language — no policy jargon',
    'Covers booking, per diem, lodging, mileage, approvals',
    'Numbers match the policy ($68/day, 14 days, $100)',
  ],
  anchors: [
    'faq',
    'travel policy',
    'staff',
    'per diem',
    'concur',
    'mileage',
    'lodging',
    'approval',
    '68',
    'question',
    'booking',
    'gsa',
    'receipt',
  ],
  dataExcerpt: `POLICY EXCERPT — IAA STAFF TRAVEL (FY26)
Booking: all airfare goes through the Concur portal at least 14 days before departure; lowest logical fare within $100 of the cheapest option.
Per diem: $68/day for meals at the destination city's GSA rate; receipts required over $25.
Lodging: conference-rate hotels first; cap is the GSA rate + 20%.
Mileage: personal vehicle reimbursed at the IRS rate when driving beats flying under 300 miles.
Approvals: out-of-state travel needs director sign-off; international needs executive director approval 60 days out.
Sustainability: rail preferred under 250 miles where schedules allow.`,
  suggestedLength: '6 Q&A pairs · ≤ 40 words per answer',
  hint: 'FAQs are a format spec: tell the model how many questions, the question-and-answer shape, and a per-answer length. Then fence the policy so it answers from the excerpt, not from the internet.',
  exampleFragment:
    'Generate a 6-question FAQ from the policy below, for staff across the authority. Format: 6 numbered question-and-answer pairs, ≤ 40 words per answer, plain language. Use only the policy — do not invent rules…',
  goldPrompt: `Generate a six-question FAQ about the staff travel policy below, for employees across the authority, because the same questions land in the HR inbox every conference season.

Six numbered question-and-answer pairs, no more than 40 words per answer, warm plain language, no policy jargon. Answer only from the policy — do not invent rules or numbers. Cover what staff actually ask — booking, per diem, lodging, mileage, approvals — e.g., "Can I book my own flight?"

Policy:
\`\`\`
Booking: Concur portal, at least 14 days before departure; lowest logical fare within $100 of cheapest.
Per diem: $68/day for meals at the destination GSA rate; receipts required over $25.
Lodging: conference-rate hotels first; cap is the GSA rate + 20%.
Mileage: IRS rate when driving beats flying under 300 miles.
Approvals: director sign-off for out-of-state; executive director approval 60 days out for international.
Sustainability: rail preferred under 250 miles.
\`\`\``,
});

// ── WTP-L9 ────────────────────────────────────────────────────────────────
SCENARIOS.push({
  id: 'WTP-L9',
  title: 'FAA infrastructure grant narrative',
  fn: 'Properties',
  gateId: 'g3',
  role: 'Grants specialist, Indianapolis Airport Authority.',
  persona: 'comms',
  brief:
    'The authority is seeking federal support to rehabilitate Taxiway B, and the narrative\u2019s problem statement is the paragraph reviewers weigh first. Draft it from the project fact sheet: formal, funder-facing, and concrete about condition, safety, and operational cost.',
  greatLooksLike: [
    'One formal paragraph, ≤ 160 words',
    'Pavement condition (PCI 58), safety (2 FOD events), ops cost (41 closures)',
    'Funder-facing tone — no marketing language',
    'Every figure traceable to the fact sheet',
  ],
  anchors: [
    'taxiway b',
    'grant',
    'faa',
    'pci',
    'fod',
    'foreign object',
    'closure',
    'rehabilitation',
    'problem statement',
    'federal',
    '14.6',
    'pavement',
    'runway 5r',
  ],
  dataExcerpt: `PROJECT FACT SHEET — TAXIWAY B REHABILITATION
Taxiway B (8,200 ft, parallel to Runway 5R/23L) last overlaid in 2009. PCI rating 58 (fair–poor), down from 71 in 2019.
Condition: raveling and joint spalling on 34% of panels; two Foreign Object Debris events in FY2025 traced to pavement fragments.
Ops impact: when Taxiway B closes for patching, arrivals to 5R/23L taxi an extra 6–9 minutes; 41 closures in FY2025.
Request: $14.6M (90% federal share) for full-depth reconstruction of the worst 3,100 ft plus LED edge lighting.
Environmental review: categorical exclusion documented, February 2025.`,
  suggestedLength: 'one paragraph · ≤ 160 words',
  hint: 'Reviewers fund problems they can measure. Tell the model the three beats — condition, safety, operational cost — and require that every figure come from the fact sheet. Formal tone is a constraint: say it.',
  exampleFragment:
    'Draft the problem-statement paragraph of a federal grant narrative for the Taxiway B rehabilitation, for FAA reviewers. Format: one paragraph, ≤ 160 words, formal. Use only the facts below — cover condition, safety, and operational cost…',
  goldPrompt: `You are a grants specialist for the Indianapolis Airport Authority. Draft the problem-statement paragraph of a federal grant narrative for the Taxiway B rehabilitation — for FAA reviewers weighing dozens of applications, because the case for funding must be concrete and urgent.

One paragraph, 160 words or fewer, formal narrative prose. Formal, factual, funder-facing. Use only the project facts below — do not invent figures or history. The paragraph must cover pavement condition, safety impact, and operational cost.

Project facts:
\`\`\`
Taxiway B (8,200 ft, parallel to Runway 5R/23L), last overlaid 2009. PCI 58 (fair–poor), down from 71 in 2019.
Raveling and joint spalling on 34% of panels; two Foreign Object Debris events in FY2025 traced to pavement fragments.
Patching closures force arrivals to taxi an extra 6–9 minutes; 41 closures in FY2025.
Request: $14.6M (90% federal share) for full-depth reconstruction of the worst 3,100 ft plus LED edge lighting.
\`\`\``,
});

// ── WTP-L10 ─ CAPSTONE CHAIN 1 ───────────────────────────────────────────────
SCENARIOS.push({
  id: 'WTP-L10',
  title: 'CAPSTONE 1 — Accessibility wayfinding page',
  fn: 'Terminal Services',
  gateId: 'g5',
  role: 'Terminal services coordinator, Indianapolis Airport Authority.',
  persona: 'ops',
  brief:
    'CAPSTONE — CHAIN STEP 1 OF 3 (OUTLINE). The accessibility-services page is being rebuilt. Write the prompt that produces the page outline — wayfinding, the sensory room, mobility assistance — using only the provided service inventory. Carry this outline into Chain 2 and 3.',
  greatLooksLike: [
    'Page outline: H1 + up to 5 H2 sections with bullets',
    'Uses only the provided services — nothing invented',
    'Sensory-inclusive services (KultureCity) get their own section',
    'Audience named: passengers & families',
  ],
  anchors: [
    'accessibility',
    'wayfinding',
    'sensory room',
    'kulturecity',
    'mobility',
    'wheelchair',
    'outline',
    'web page',
    'passenger',
    'family',
    'tsa cares',
    'aira',
    'lanyard',
  ],
  dataExcerpt: `ACCESSIBILITY SERVICES AT IND (SOURCE INVENTORY)
• Wayfinding: wayfinding beacons for the Aira app; service-animal relief areas pre- and post-security.
• Sensory-inclusive: certified by KultureCity — quiet sensory rooms on Concourse A and Concourse B; free, no reservation.
• Mobility assistance: wheelchair service via airline request (48 hrs notice recommended); adult changing table in a family restroom.
• Security: TSA Cares helpline (72 hrs notice) for screening support.`,
  capstone: true,
  chainStep: 1,
  suggestedLength: '≤ 200 words',
  hint: 'Chain step 1 is about structure. Ask for an outline with named heading levels and a word cap, and fence the inventory — a chain only works if step 1 invents nothing for steps 2 and 3 to inherit.',
  exampleFragment:
    'Organize an outline for an accessibility-services web page, for passengers and families. Format: one H1, up to 5 H2 sections with 2–4 bullets each, ≤ 200 words. Use only the services below…',
  goldPrompt: `Organize an outline for a new accessibility-services web page, for passengers and families who need wayfinding, sensory, or mobility support — the page must be scannable before a travel day.

One H1 plus up to five H2 sections with two to four bullets each, 200 words or fewer. Warm, welcoming, plain language. Use only the services below; do not invent services or policies. Give the sensory-inclusive services their own section, e.g., "Calm & comfort."

Services:
\`\`\`
Wayfinding: Aira wayfinding beacons; service-animal relief areas pre- and post-security.
Sensory-inclusive: certified by KultureCity — quiet sensory rooms on Concourse A and Concourse B; free, no reservation.
Mobility: wheelchair service via airline request (48 hrs notice); adult changing table in a family restroom.
TSA Cares helpline (72 hrs notice) for screening support.
\`\`\``,
});

// ── WTP-L11 ─ CAPSTONE CHAIN 2 ───────────────────────────────────────────────
SCENARIOS.push({
  id: 'WTP-L11',
  title: 'CAPSTONE 2 — Survey sentiment summary',
  fn: 'Operations',
  gateId: 'g5',
  role: 'Operations analyst, Indianapolis Airport Authority.',
  persona: 'ops',
  brief:
    'CAPSTONE — CHAIN STEP 2 OF 3 (INFER). Forty open-end survey comments came back about the very services you outlined in Chain 1 (8 shown below, the rest in the survey dashboard). Write the prompt that infers overall sentiment and the top three themes, output as a table for the quarterly service review.',
  greatLooksLike: [
    'Table: theme / sentiment / count / representative quote',
    'Top 3 themes inferred, not invented',
    'Named individuals + emails stripped from the prompt',
    '2-sentence summary under the table',
  ],
  anchors: [
    'survey',
    'sentiment',
    'theme',
    'comment',
    'table',
    'quarterly',
    'executive',
    'signage',
    'shuttle',
    'representative quote',
    '40',
    'wi-fi',
  ],
  dataExcerpt: `PASSENGER SURVEY — OPEN-END COMMENTS (8 OF 40 SHOWN; FULL FILE IN THE SURVEY DASHBOARD)
1. "Security was fast but the signage to Concourse B is confusing." — Dana R., d.riggins@example.net
2. "Love the new local food options. Prices feel fair for an airport."
3. "My gate changed three times and nobody announced why."
4. "The sensory room saved our travel day. Please advertise it more!"
5. "Parking shuttle waited 20 minutes in the cold."
6. "Cleanest airport bathrooms I've seen, seriously."
7. "Wi-Fi dropped twice during my call." — K. Osei, kosei@example.net
8. "Staff at the info desk walked me to my gate. Above and beyond."`,
  containsFauxSensitive: true,
  capstone: true,
  chainStep: 2,
  suggestedLength: '≤ 160 words + table',
  hint: 'Inference prompts need an output schema. Name the table columns, the theme count, and the tone — and strip the respondents\u2019 names and emails. Survey comments are PII-adjacent: quote the words, never the person.',
  exampleFragment:
    'Categorize the sentiment of these survey comments for the executive team. Format: a table — Theme, Sentiment, Comment count, Representative quote — plus a 2-sentence summary, ≤ 160 words. Do not include names or email addresses…',
  goldPrompt: `You are an operations analyst at Indianapolis International Airport. Categorize the sentiment of the 40 passenger survey comments (8 shown below, the rest in the survey dashboard) — for the executive team, because the quarterly service review needs themes, not anecdotes.

One table — columns Theme, Sentiment, Comment count, Representative quote — then a 2-sentence summary, 160 words or fewer. Measured, professional, no jargon. Use only the comments below; attribute nothing to named individuals, include no email addresses, and infer the top 3 themes from the comments themselves.

Comments:
\`\`\`
"Security was fast but the signage to Concourse B is confusing."
"Love the new local food options. Prices feel fair for an airport."
"My gate changed three times and nobody announced why."
"The sensory room saved our travel day. Please advertise it more!"
"Parking shuttle waited 20 minutes in the cold."
"Cleanest airport bathrooms I've seen, seriously."
"Wi-Fi dropped twice during my call."
"Staff at the info desk walked me to my gate. Above and beyond."
\`\`\``,
});

// ── WTP-L12 ─ CAPSTONE CHAIN 3 ───────────────────────────────────────────────
SCENARIOS.push({
  id: 'WTP-L12',
  title: 'CAPSTONE 3 — New-hire training blurb',
  fn: 'Terminal Services',
  gateId: 'g5',
  role: 'Terminal services trainer, Indianapolis Airport Authority.',
  persona: 'ops',
  brief:
    'CAPSTONE — CHAIN STEP 3 OF 3 (EXPAND + CHECK). Take the outline approved in Chain 1 (a canned version is attached if you need it) and write the prompt that expands it into a warm 150-word training-page blurb for new terminal-services hires — then self-checks the draft against the Fact Check List pattern from Gate 5.',
  greatLooksLike: [
    'One warm paragraph, ≤ 150 words',
    'Expansion stays inside the approved outline',
    'Includes a self-check instruction (Fact Check List)',
    'Welcoming tone for a nervous new hire',
  ],
  anchors: [
    'new hire',
    'training',
    'blurb',
    'terminal services',
    'outline',
    'fact check',
    'welcome',
    'first week',
    'kulturecity',
    '150',
    'badge',
    'radio',
    'dashboard',
  ],
  dataExcerpt: `APPROVED OUTLINE (CANNED VERSION — FOR ANYONE WHO WANTS IT)
H1: Welcome to Terminal Services at IND
H2: Your first week — badge, radio, and the lay of the land
H2: The passenger comes first — help, directions, and sensory-inclusive services
H2: Tools you'll use — radios, the ops dashboard, the service cart
H2: Who to call — supervisors, the ops center, guest services

FACT CHECK LIST PATTERN (GATE 5): after drafting, re-read the source, compare every fact in the draft against it, and strike anything the source doesn't support.`,
  capstone: true,
  chainStep: 3,
  suggestedLength: '≤ 150 words',
  hint: 'Chains end with verification. Ask for the expansion and the check in one prompt: draft from the outline, then compare every sentence against it and flag anything unsupported. The Fact Check List is a pattern you ask for by name.',
  exampleFragment:
    'Write a warm ≤ 150-word training-page blurb for new terminal-services hires using only the approved outline below. Then fact-check: compare every sentence against the outline and note anything unsupported…',
  goldPrompt: `Write a warm welcome blurb for new terminal-services hires based on the approved outline below — because this is the paragraph a nervous new hire reads on day one.

One paragraph, about 150 words, warm and welcoming, plain language. Stay inside the outline: do not add policies or promises it doesn't support. Then fact-check the draft against the outline, line by line, and flag claims the outline doesn't support, e.g., "Checked: no facts beyond the outline."

Approved outline:
\`\`\`
H1: Welcome to Terminal Services at IND
H2: Your first week — badge, radio, and the lay of the land
H2: The passenger comes first — help, directions, and sensory-inclusive services
H2: Tools you'll use — radios, the ops dashboard, the service cart
H2: Who to call — supervisors, the ops center, guest services
\`\`\``,
});

export const SCENARIO_BY_ID: Record<string, AnchoredScenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export function getScenario(id: string | null | undefined): AnchoredScenario | null {
  if (!id) return null;
  return SCENARIO_BY_ID[id] ?? null;
}

/** Capstone chain scenarios in chain order (WTP-L10 → L11 → L12). */
export const CAPSTONE_CHAIN: AnchoredScenario[] = SCENARIOS.filter((s) => s.capstone).sort(
  (a, b) => (a.chainStep ?? 0) - (b.chainStep ?? 0),
);
