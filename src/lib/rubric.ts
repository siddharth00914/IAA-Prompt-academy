/**
 * IAA Prompt Academy — the Prompt Lab feedback engine, RUBRIC V2.
 *
 * Fully client-side, pure and deterministic. NO LLM calls.
 *
 * v2 teaches the right lesson: reward good prompting, not keyword bingo.
 *
 *   • Scenario-anchored relevance — each scenario carries an `anchors` set
 *     (authored in scenarios.ts on top of the base Scenario model). Near-zero
 *     overlap with the anchors + brief terms → hard cap 40, verdict
 *     OFF COURSE, feedback says the submission doesn't address the assignment.
 *   • Anti-stuffing coherence — >2 distinct format demands earns a penalty
 *     and a note; all five detector families firing while substantive prose
 *     is thin (< CONTENT_WORD_FLOOR content words after stripping stopwords
 *     and detector phrases) → cap 59.
 *   • Dimension weights sum to exactly 100 and role is OPTIONAL (10 pts):
 *     a prompt with no persona tops out at 90, so GOLD (≥85) is reachable
 *     without one. Question marks are never penalized (flipped interaction
 *     is a legitimate technique).
 *
 *   1 Task & action verb   20   imperative verb early, or a flipped-
 *                                interaction pattern; single-task focus
 *   2 Specificity & detail 20   concrete anchors (numbers, named entities,
 *                                quoted phrases, scenario-data references)
 *                                − vague words. NO character-length points.
 *   3 Context & audience   15   who it's for + why it matters
 *   4 Output format & len  15   format words + a length spec ("about N
 *                                words" counts) − format-demand overload
 *   5 Constraints & tone   10   do/don't rules + tone words
 *   6 Role / persona       10   OPTIONAL — "you are a/an/the …", "act as …",
 *                                implicit "as communications coordinator";
 *                                validated against role nouns, so
 *                                "as a headline" earns nothing
 *   7 Examples              5   "e.g."/"for example" FOLLOWED by ≥10 chars
 *                                of actual example content
 *   8 Structure             5   delimiters + sectioning
 *
 * Tripwire v2 runs BEFORE scoring: only genuine sensitivity signals HOLD
 * SHORT (SSI markings, SSN patterns, badge/employee IDs, passport numbers).
 * Plain emails/phones no longer trip — they append an advisory note instead.
 */
import type { DebriefReport, RubricDimension, RubricScore, Scenario } from '@/content/types';

// ── Word helpers ─────────────────────────────────────────────────────────────

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function firstWords(text: string, n: number): string {
  return text.trim().split(/\s+/).filter(Boolean).slice(0, n).join(' ');
}

/** Lowercase, unify dash variants, strip thousands separators ("3,210" → "3210"). */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/(\d),(\d{3})\b/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Signal vocabularies (rubric v2) ──────────────────────────────────────────

/** The imperative action-verb list (detector 1) — expanded for v2. */
export const ACTION_VERBS = [
  'act', 'analyze', 'analyse', 'categorize', 'classify', 'compare', 'compose',
  'condense', 'convert', 'craft', 'create', 'critique', 'define', 'describe',
  'draft', 'evaluate', 'explain', 'extract', 'find', 'generate', 'identify',
  'list', 'measure', 'organize', 'outline', 'parse', 'pick', 'predict',
  'prepare', 'prioritize', 'provide', 'pull', 'rank', 'recommend', 'rephrase',
  'retrieve', 'return', 'rewrite', 'select', 'show', 'sort', 'summarize',
  'translate', 'turn', 'write',
] as const;

const VERB_RE = new RegExp(`\\b(${ACTION_VERBS.join('|')})\\b`, 'gi');

/** Flipped-interaction patterns — a legitimate task spec (Gate 2 leg 4). */
const FLIPPED_RES: RegExp[] = [
  /\bask me\b/i,
  /\binterview me\b/i,
  /\bone question at a time\b/i,
  /\bquestions? one (?:at a time|by one)\b/i,
  /\bbefore you answer\b/i,
  /\bbefore answering,?\s+ask\b/i,
];

const VAGUE_RE = /\b(stuff|things?|something|anything|nice|whatever|etc\.?)\b/gi;

const DIGIT_RE = /\d/;
const ENTITY_RE =
  /\b(IND|Indianapolis|Concourse\s?[ABC]|Taxiway\s?[A-Z0-9]?|Runway\s?[\dLRC/]+|FAA|TSA|DOT|49\s?CFR|ASQ|ACI|Best Airport|solar farm|de-?ice|civic plaza|Col\. H\.|Weir Cook|O'Hare)\b/i;
/** Multiword proper nouns ("Winter Storm Kai", "Earth Week") or acronyms ("PCI", "GSA"). */
const PROPER_NOUN_RE =
  /\b[A-Z][a-z]{2,}(?:\s+(?:of|the|de|&|for)\s+|\s+)[A-Z][a-zA-Z0-9]+\b|\b[A-Z]{2,5}\b/;
const QUOTED_RE = /["“][^"”\n]{3,120}["”]/;

const AUDIENCE_STRONG_RE =
  /\b(audience|executives?|exec(utive)? team|passengers?|travell?ers?|guests?|tenants?|concessionaires?|board(\s+members?|\s+of\s+directors)?|commissioners?|staff|employees?|new hires?|hires|media|press|journalists?|public|followers|readers?|families|funders?|reviewers?|customers?|volunteers?|passenger-facing|community|residents?|hoosiers?)\b/i;
const AUDIENCE_FOR_RE = /\bfor\s+(the|our|your|a|an)\s+[a-z-]{3,}/i;

const CONTEXT_RE =
  /\b(because|background|context|so that|who|why|currently|situation|given(\s+that)?|since|here'?s why|for context|ahead of)\b/i;

/**
 * Output-format lexicon, grouped into categories so the anti-stuffing check
 * can count DISTINCT format demands (bullets AND table AND JSON AND email…).
 */
const FORMAT_CATEGORIES: { id: string; re: RegExp }[] = [
  { id: 'bullets', re: /\bbullets?(?:\s+points?)?\b/i },
  { id: 'table', re: /\btables?\b/i },
  { id: 'json', re: /\bjson\b/i },
  { id: 'email', re: /\be-?mails?\b/i },
  { id: 'memo', re: /\bmemos?\b/i },
  { id: 'press-release', re: /\bpress releases?\b/i },
  { id: 'faq', re: /\bfaqs?\b|\bq&a\b|\bquestion[- ]and[- ]answer\b/i },
  // NOTE: structural components (paragraph, headline, sections, brief) are NOT
  // format demands — a press release naturally contains a headline and a quote
  // paragraph, and "the brief" is scenario vocabulary. Counting them produced
  // false OVERLOAD verdicts on well-formed prompts.
  { id: 'list', re: /\b(?:numbered\s+)?lists?\b/i },
  { id: 'outline', re: /\boutlines?\b/i },
  { id: 'posts', re: /\b(?:social\s+)?posts?\b|\btweets?\b|\blinkedin\b|\bfacebook\b/i },
  { id: 'script', re: /\bscripts?\b/i },
  { id: 'newsletter', re: /\bnewsletters?\b/i },
  { id: 'statement', re: /\bstatements?\b/i },
  { id: 'summary', re: /\bsummar(?:y|ies)\b/i },
  { id: 'narrative', re: /\bnarratives?\b/i },
  { id: 'announcement', re: /\bannouncements?\b/i },
  { id: 'blurb', re: /\bblurbs?\b/i },
  { id: 'letter', re: /\bletters?\b/i },
  { id: 'caption', re: /\bcaptions?\b/i },
  { id: 'one-pager', re: /\bone[- ]pagers?\b/i },
  { id: 'report', re: /\breports?\b/i },
  { id: 'reply', re: /\brepl(?:y|ies)\b/i },
];

/**
 * Format DEMANDS: categories matched in the instruction prose — fenced source
 * blocks don't count (they're data, not demands), and negated mentions
 * ("include no email addresses") don't count either.
 */
function demandedFormats(text: string): string[] {
  const prose = text.replace(/```[\s\S]*?```/g, ' ').replace(/"""[\s\S]*?"""/g, ' ');
  const cats: string[] = [];
  for (const c of FORMAT_CATEGORIES) {
    const re = new RegExp(c.re.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(prose)) !== null) {
      const before = prose.slice(Math.max(0, m.index - 26), m.index);
      if (/\b(no|never|not|without|exclude|excluding|omit|omitting|strip|stripped|instead of|rather than)\s*[^.;:]{0,18}$/i.test(before)) {
        continue;
      }
      cats.push(c.id);
      break;
    }
  }
  return cats;
}

const LENGTH_CAP_RES: RegExp[] = [
  /[≤<]=?\s*\d[\d,]*\s*(words?|sentences?|bullets?|paragraphs?|lines?|characters?|chars?)/i,
  /\b(max|maximum|max\.|under|no more than|not more than|at most|up to|fewer than|less than|limit(?:ed)? to|capped? at|keep (it|the \w+|this) (to|at|under))\s+\d[\d,]*\s*(words?|sentences?|bullets?|paragraphs?|lines?|characters?|chars?)/i,
  /\b(around|about|approximately|approx\.?|roughly|circa|~)\s*\d[\d,]*\s*(words?|sentences?|paragraphs?|bullets?|lines?|characters?|chars?)/i,
  /\b\d[\d,]*\s*(words?|sentences?|paragraphs?|characters?|chars?)\s+(?:per\s+\w+\s+)?(?:or\s+(?:less|fewer)|max|maximum|limit|tops)\b/i,
  /\b\d[\d,]*\s*(words?|sentences?)\s*(max|maximum|or less|or fewer|limit|tops)/i,
  /\b\d[\d,]*\s*-\s*(words?|sentences?|paragraphs?|characters?)\b/i, // "150-word blurb"
  /\b(keep it|keep the \w+|limit it|stick)\s+(to|at|under)\s+\d[\d,]*\s*(words?|sentences?|bullets?)/i,
];

const CONSTRAINT_RE =
  /\b(only|do not|don't|avoid|must|never|no jargon|use only|stick to|without|omit|exclude|refrain from|do n't|limit yourself to|exactly|at least|at most|no more than|stay inside|leave out)\b/i;

const TONE_RE =
  /\b(tone|warm|formal|empathetic|professional|calm|plain language|jargon-free|reassuring|confident|friendly|concise|respectful|upbeat|welcoming|authoritative|apologetic|accountable|measured|approachable|community-proud|factual)\b/i;

/**
 * Role nouns — a persona claim must name a SEAT, not a container. This list
 * is what separates "as communications coordinator" (role) from
 * "as a headline" (a format, worth zero role points).
 */
const ROLE_NOUN_RE =
  /\b(coordinators?|officers?|agents?|analysts?|specialists?|leads?|trainers?|managers?|directors?|editors?|writers?|spokespersons?|spokespeople|representatives?|experts?|advisors?|advisers?|consultants?|engineers?|planners?|reviewers?|journalists?|correspondents?|copywriters?|professionals?|guides?|mentors?|coaches?|instructors?|teachers?|strategists?|marketers?|communicators?|producers?|developers?|designers?|architects?|scientists?|researchers?|economists?|attorneys?|lawyers?|accountants?|controllers?|supervisors?|administrators?|executives?|veterans?|insiders?|staffers?)\b/i;

/** Generic personas earn partial credit only. */
const ROLE_GENERIC_RE = /\b(assistants?|helpers?|chatbots?|ai(?:\s+assistant)?)\b/i;

/**
 * Role triggers. Each captures the ~6 words following the trigger; the
 * captured phrase must contain a role noun (above) to earn credit.
 * Accepts a/an/the ("You are the coordinator") and the implicit,
 * article-less "As communications coordinator, …".
 */
const ROLE_TRIGGER_RES: RegExp[] = [
  /\byou(?:\s+are|'re)\s+(?:a|an|the)\s+([a-z][a-z0-9/&'+-]*(?:\s+[a-z][a-z0-9/&'+-]*){0,5})/i,
  /\bact\s+as\s+(?:(?:a|an|the)\s+)?([a-z][a-z0-9/&'+-]*(?:\s+[a-z][a-z0-9/&'+-]*){0,5})/i,
  /\b(?:your role is|take on the role of|imagine you(?:'re| are)|speaking as|write as|respond as|answer as|reply as|think as)\s+(?:(?:a|an|the)\s+)?([a-z][a-z0-9/&'+-]*(?:\s+[a-z][a-z0-9/&'+-]*){0,5})/i,
  /(?:^|[\n.!?]\s+)as\s+(?:(?:a|an|the)\s+)?([a-z][a-z0-9/&'+-]*(?:\s+[a-z][a-z0-9/&'+-]*){0,5})/im,
];

const EXAMPLE_MARKER_RE = /\b(e\.g\.?|for example|for instance|such as|like this|example\s*:)/i;
const EXEMPLAR_BLOCK_RE = /\binput\s*:[\s\S]{0,400}\boutput\s*:/i;

const DELIMITER_RE =
  /(```|"""|<[a-zA-Z][a-zA-Z0-9-]{0,20}>|\b(?:text|source|excerpt|document|data|log|policy|comments?|table|facts?|report|outline|services?|bulletin|case facts?)\s*:)/;
const SECTION_LINE_RE = /^\s*[A-Za-z][A-Za-z0-9 /&'()-]{0,32}:\s*\S/m;
const NUMBERED_STEP_RE = /^\s*(?:\d+[.)]|step\s+\d+[:.)]?)\s+\S/im;

// ── Safety tripwire v2 (runs before scoring) ─────────────────────────────────

export interface SafetyCheckResult {
  tripped: boolean;
  /** Human-readable descriptions of what was detected. */
  hits: string[];
}

/**
 * HOLD SHORT only for genuine sensitivity signals: SSI-family markings, SSN
 * patterns, badge/employee IDs, passport numbers. Plain emails and phone
 * numbers do NOT trip the wire — they earn an advisory note (below) so a
 * press-release media contact like media@ind.org isn't treated as a breach.
 */
const SAFETY_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b\d{3}-\d{2}-\d{4}\b/, label: 'an SSN-shaped number' },
  { re: /\bssn\b/i, label: 'an SSN reference' },
  { re: /\bbadge\s*(?:#|no\.?|number)?\s*\d{2,}\b/i, label: 'a badge number' },
  { re: /\bemployee\s*(?:id|#|no\.?|number)\s*[:#-]?\s*[a-z0-9-]{3,}\b/i, label: 'an employee ID' },
  { re: /\bpassport\s*(?:#|no\.?|number)?\s*[:#-]?\s*[a-z]?\d{6,9}\b/i, label: 'a passport number' },
  { re: /\bssi\s*[:—–-]/i, label: 'an "SSI:" marking' },
  { re: /\bsensitive security information\b/i, label: 'an SSI marking' },
  { re: /\blaw enforcement sensitive\b/i, label: 'a law-enforcement-sensitive marking' },
  { re: /\bfor official use only\b|\bfouo\b/i, label: 'a FOUO marking' },
];

/** Contact data — not a tripwire, just an advisory. */
const CONTACT_DATA_RE =
  /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b|\b\d{3}[-.]\d{3}[-.]\d{4}\b/i;

export const CONTACT_ADVISORY =
  'Contact data spotted: if that\u2019s private contact data, keep it out; public business contacts like media@ind.org are fine.';

/** Pre-score scan for genuinely sensitive content (SSI/SSN/IDs/passport). */
export function safetyCheck(promptText: string): SafetyCheckResult {
  const hits = SAFETY_PATTERNS.filter((p) => p.re.test(promptText)).map((p) => p.label);
  return { tripped: hits.length > 0, hits };
}

export const SAFETY_HOLD_TITLE = 'HOLD SHORT — possible sensitive data detected';
export const SAFETY_HOLD_MESSAGE =
  'This prompt contains what looks like sensitive data. In the real world: stop, delete, and check Gate 5 before transmitting. Score withheld for this attempt — miles still logged, because the lesson is the point.';

// ── Scenario-anchored relevance (the big fix) ────────────────────────────────

/** Words too common to anchor relevance (prompt boilerplate + function words). */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'to', 'of', 'in', 'on', 'for',
  'with', 'without', 'at', 'by', 'from', 'into', 'over', 'under', 'about',
  'around', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its',
  'this', 'that', 'these', 'those', 'you', 'your', 'yours', 'we', 'our',
  'ours', 'they', 'their', 'them', 'i', 'me', 'my', 'he', 'she', 'his', 'her',
  'as', 'if', 'then', 'than', 'when', 'while', 'where', 'which', 'who',
  'whom', 'why', 'how', 'what', 'not', 'no', 'yes', 'do', 'does', 'did',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  'just', 'also', 'too', 'very', 'really', 'please', 'make', 'sure', 'keep',
  'let', 'us', 'per', 'via', 'all', 'any', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'own', 'same', 'here', 'there',
  'below', 'above', 'out', 'up', 'down', 'off', 'again', 'once', 'now',
  'new', 'use', 'using', 'used', 'say', 'says', 'said', 'tell', 'tells',
  'give', 'gives', 'need', 'needs', 'like', 'get', 'gets', 'got', 'one',
  'two', 'three', 'four', 'five', 'six', 'first', 'second', 'third', 'last',
  'next', 'before', 'after', 'during', 'between', 'through', 'against',
]);

/** Brief words that are prompt boilerplate, not assignment anchors. */
const BRIEF_BOILERPLATE = new Set([
  'draft', 'write', 'prompt', 'model', 'attached', 'excerpt', 'words',
  'paragraphs', 'bullets', 'sentences', 'format', 'should', 'would',
]);

/**
 * Read the scenario's authored anchor set. The base Scenario model
 * (types.ts) is frozen, so scenarios.ts carries `anchors` via intersection —
 * read them structurally here.
 */
export function scenarioAnchors(scenario: Scenario): string[] {
  const authored = (scenario as { anchors?: unknown }).anchors;
  if (!Array.isArray(authored)) return [];
  return authored.filter((a): a is string => typeof a === 'string' && a.trim().length > 0);
}

/** Distinctive ≥5-letter terms from the brief — a second, derived anchor set. */
function briefTerms(brief: string): string[] {
  const tokens = normalizeText(brief).match(/[a-z][a-z'-]{4,}/g) ?? [];
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const raw of tokens) {
    const t = raw.replace(/^-+|-+$/g, '');
    if (t.length < 5 || STOPWORDS.has(t) || BRIEF_BOILERPLATE.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    terms.push(t);
    if (terms.length >= 14) break;
  }
  return terms;
}

/** Build a boundary-anchored matcher for one anchor phrase (plural-tolerant). */
function anchorRegex(anchor: string): RegExp {
  const tokens = normalizeText(anchor)
    .split(' ')
    .filter(Boolean)
    .map((tok) => {
      const esc = escapeRegExp(tok);
      return /[a-z]$/i.test(tok) && !/s$/i.test(tok) ? `${esc}s?` : esc;
    });
  return new RegExp(`(?:^|[^a-z0-9])${tokens.join('[^a-z0-9]+')}(?:[^a-z0-9]|$)`, 'i');
}

export interface RelevanceResult {
  /** Distinct anchor/brief terms matched in the submission. */
  hits: number;
  matched: string[];
  /** True when the submission doesn't address the assignment at all. */
  offCourse: boolean;
}

/**
 * Overlap between the submission and the scenario's anchor set (authored
 * anchors + derived brief terms). Fewer than OFF_COURSE_MIN_HITS distinct
 * hits means the prompt isn't about this assignment.
 */
export const OFF_COURSE_MIN_HITS = 2;
export const OFF_COURSE_CAP = 40;
export const OFF_COURSE_VERDICT = 'OFF COURSE';

export function relevanceCheck(promptText: string, scenario: Scenario): RelevanceResult {
  const text = normalizeText(promptText);
  const candidates = [...scenarioAnchors(scenario), ...briefTerms(scenario.brief)];
  const seen = new Set<string>();
  const matched: string[] = [];
  for (const anchor of candidates) {
    const key = normalizeText(anchor);
    if (seen.has(key)) continue;
    seen.add(key);
    if (anchorRegex(anchor).test(text)) matched.push(anchor);
  }
  const hits = matched.length;
  return { hits, matched, offCourse: hits < OFF_COURSE_MIN_HITS };
}

// ── Anti-stuffing coherence ──────────────────────────────────────────────────

/**
 * Substantive prose: words left after removing stopwords and every detector
 * phrase the rubric listens for. Keyword salads collapse to ~zero here.
 */
export function contentWordCount(text: string): number {
  let t = ` ${text} `;
  for (const re of ROLE_TRIGGER_RES) t = t.replace(re, ' ');
  t = t
    .replace(EXEMPLAR_BLOCK_RE, ' ')
    .replace(EXAMPLE_MARKER_RE, ' ')
    .replace(FORMAT_ANY_RE, ' ')
    .replace(TONE_RE, ' ')
    .replace(CONSTRAINT_RE, ' ')
    .replace(VERB_RE, ' ')
    .replace(FLIPPED_ANY_RE, ' ')
    .replace(/```/g, ' ')
    .replace(/"""/g, ' ');
  for (const re of LENGTH_CAP_RES) t = t.replace(re, ' ');
  const words = t.split(/\s+/).filter((w) => {
    const clean = w.toLowerCase().replace(/[^a-z'-]/g, '');
    return clean.length >= 3 && /[a-z]/.test(clean) && !STOPWORDS.has(clean);
  });
  return words.length;
}

const FORMAT_ANY_RE = new RegExp(
  FORMAT_CATEGORIES.map((c) => `(?:${c.re.source})`).join('|'),
  'gi',
);
const FLIPPED_ANY_RE = new RegExp(FLIPPED_RES.map((r) => `(?:${r.source})`).join('|'), 'gi');

/** Below this many content words a prompt is scaffolding, not substance. */
export const CONTENT_WORD_FLOOR = 12;
/** Total cap when every detector family fires but the prose is thin. */
export const STUFFED_CAP = 59;

// ── Rubric metadata ──────────────────────────────────────────────────────────

type Band = 'full' | 'partial' | 'zero';

interface DimensionMeta {
  id: string;
  name: string;
  max: number;
  /** Strength-panel line shown when the dimension earns full marks. */
  strength: string;
  /** Detector notes keyed by score band (fallback templates). */
  notes: Record<Band, string>;
  /** Scenario-templated suggestion shown when this dimension is weak. */
  suggestion: (scenario: Scenario) => string;
}

export const RUBRIC_META: DimensionMeta[] = [
  {
    id: 'task',
    name: 'Task & action verb',
    max: 20,
    strength: 'Clear single task with a strong verb.',
    notes: {
      full: 'Imperative verb early · single task detected',
      partial: 'Verb found, but the prompt piles on extra jobs',
      zero: 'No imperative action verb detected',
    },
    suggestion: () =>
      'Lead with one imperative verb — "Draft", "Summarize", "Compare", "Turn" — and keep this prompt to a single job. (Asking the model to interview you first is a task too — say so.)',
  },
  {
    id: 'specificity',
    name: 'Specificity & detail',
    max: 20,
    strength: 'Concrete detail — numbers, names, quoted phrases, and scenario facts anchor the prompt.',
    notes: {
      full: 'Concrete anchors found · no vague words',
      partial: 'Some concrete detail, but vague wording dilutes it',
      zero: 'No concrete numbers, names, or scenario facts detected',
    },
    suggestion: (s) =>
      `Pull 2–3 concrete facts straight from the excerpt (numbers, names, places) — for ${s.id}: ${s.greatLooksLike[0] ?? 'the key facts'}. Vague words like "stuff" and "something" cost points.`,
  },
  {
    id: 'context',
    name: 'Context & audience',
    max: 15,
    strength: 'Audience and context specified — the model knows who this is for and why.',
    notes: {
      full: 'Audience and context markers found',
      partial: 'Audience or context present, not both',
      zero: 'No audience or background context detected',
    },
    suggestion: () =>
      'Say who it is for and why it matters — one sentence of audience plus background, e.g. "for the executive team, who must decide before 08:00".',
  },
  {
    id: 'format',
    name: 'Output format & length',
    max: 15,
    strength: 'Output format and length pinned down — no sprawl.',
    notes: {
      full: 'Format word and length spec found',
      partial: 'Format or length specified, not both',
      zero: 'No output format or length limit detected',
    },
    suggestion: (s) =>
      `Name the ONE container the deliverable needs (not three) and add a length spec: ${s.suggestedLength ?? 'e.g. ≤ 150 words'}. "About 120 words" counts too.`,
  },
  {
    id: 'constraints',
    name: 'Constraints & tone',
    max: 10,
    strength: 'Boundaries and tone set — the model knows the guardrails.',
    notes: {
      full: 'Do/don\u2019t rules and tone words found',
      partial: 'Constraints or tone present, not both',
      zero: 'No constraints or tone guidance detected',
    },
    suggestion: () =>
      'Add one do/don\u2019t rule ("use only the text below", "no jargon") and name the tone — "warm, accountable, plain language".',
  },
  {
    id: 'role',
    name: 'Role / persona',
    max: 10,
    strength: 'Role assigned — the model answers from the right seat.',
    notes: {
      full: 'Role/persona phrase found',
      partial: 'Generic role — name a domain seat instead',
      zero: 'No role assignment detected (optional)',
    },
    suggestion: (s) => {
      const role = s.role.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase());
      return `Optional, but useful when voice matters: "You are the ${role}" — persona is a tool, not a toll; plenty of gold prompts skip it.`;
    },
  },
  {
    id: 'examples',
    name: 'Examples',
    max: 5,
    strength: 'An example anchors the pattern you want.',
    notes: {
      full: 'Example with real content found',
      partial: 'Example hinted at but not explicit',
      zero: 'No example content detected',
    },
    suggestion: () =>
      'Include one mini example of the output shape you want — "e.g.," followed by an actual sample line, not just the marker.',
  },
  {
    id: 'structure',
    name: 'Structure',
    max: 5,
    strength: 'Clean structure — delimiters keep source separate from instruction.',
    notes: {
      full: 'Delimiters and sectioning found',
      partial: 'Some structure detected',
      zero: 'No delimiters or sectioning detected',
    },
    suggestion: () =>
      'Fence source material in triple backticks (```) or labeled sections ("Text:", "Facts:") so data reads as source, not instruction.',
  },
];

/** Build the rubric dimensions for a scenario (types.ts contract). */
export function buildRubricDimensions(scenario: Scenario): RubricDimension[] {
  return RUBRIC_META.map((m) => ({
    id: m.id,
    name: m.name,
    max: m.max,
    notes: { ...m.notes },
    suggestion: m.suggestion(scenario),
  }));
}

// ── Per-dimension detectors ──────────────────────────────────────────────────

interface DetectorResult {
  earned: number;
  band: Band;
  note: string;
}

function detectTask(text: string): DetectorResult {
  const head = firstWords(text, 25);
  const headMatch = head.match(VERB_RE);
  const allMatches = [...text.matchAll(VERB_RE)].map((m) => m[1].toLowerCase());
  // DISTINCT verbs — repeating a noun-shaped verb ("the outline … the
  // outline") is not task overload; piling on different imperatives is.
  const verbCount = new Set(allMatches).size;
  const flipped = FLIPPED_RES.some((re) => re.test(text));
  const foundVerb = headMatch?.[0]?.toLowerCase() ?? allMatches[0] ?? null;

  // Verb part: +10 early (first 25 words), +5 anywhere else. A flipped-
  // interaction pattern ("interview me first") is a full task spec: +10.
  let verbPart = 0;
  if (headMatch || flipped) verbPart = 10;
  else if (allMatches.length > 0) verbPart = 5;

  // Single-task focus: +10. Penalize joined imperatives — question marks
  // are NEVER penalized (flipped interaction is a technique, not noise).
  const focusPart = verbCount <= 3 ? 10 : verbCount <= 5 ? 5 : 0;

  const earned = Math.min(20, verbPart + focusPart);
  const band: Band = earned === 20 ? 'full' : earned === 0 ? 'zero' : 'partial';

  let note: string;
  if (band === 'full') {
    note = flipped && !headMatch
      ? 'Flipped-interaction task found ("interview me" / "before you answer") · single focus'
      : `Found action verb "${foundVerb}" early · single task detected`;
  } else if (!foundVerb && !flipped) {
    note = 'No action verb found — lead with "Draft", "Summarize", "Compare"…';
  } else if (verbPart < 10 && focusPart === 10) {
    note = `Verb "${foundVerb}" arrives late — put it in the first 25 words`;
  } else {
    note = `Found "${foundVerb ?? 'the task'}" but ${verbCount} joined imperatives — one prompt, one job`;
  }
  return { earned, band, note };
}

function detectSpecificity(text: string, anchorHits: number): DetectorResult {
  const hasNumbers = DIGIT_RE.test(text);
  const hasEntity = ENTITY_RE.test(text) || PROPER_NOUN_RE.test(text);
  const hasQuote = QUOTED_RE.test(text);
  const vagueHits = [...text.matchAll(VAGUE_RE)].map((m) => m[0].toLowerCase().replace(/\.$/, ''));

  // Concrete anchors only — character length earns NOTHING (v2).
  const concrete =
    (hasNumbers ? 5 : 0) +
    (hasEntity ? 5 : 0) +
    (hasQuote ? 4 : 0) +
    (anchorHits >= 2 ? 6 : anchorHits === 1 ? 3 : 0);
  const earned = Math.max(0, Math.min(20, concrete - vagueHits.length * 2));
  const band: Band = earned === 20 ? 'full' : earned === 0 ? 'zero' : 'partial';

  let note: string;
  if (band === 'full') {
    note = 'Numbers, named entities, quoted phrases, and scenario facts found · no vague words';
  } else if (concrete === 0) {
    note = 'No concrete numbers, names, or scenario facts detected';
  } else if (vagueHits.length > 0) {
    note = `Concrete detail found, but vague wording dilutes it: ${[...new Set(vagueHits)]
      .map((w) => `"${w}"`)
      .join(', ')}`;
  } else {
    const missing: string[] = [];
    if (!hasNumbers) missing.push('a number');
    if (!hasEntity) missing.push('a named entity');
    if (!hasQuote) missing.push('a quoted sample');
    if (anchorHits < 2) missing.push('scenario facts');
    note = `Concrete detail found · add ${missing.slice(0, 2).join(' and ')} for full marks`;
  }
  return { earned, band, note };
}

function detectContext(text: string): DetectorResult {
  const strongAudience = AUDIENCE_STRONG_RE.test(text);
  const forHint = AUDIENCE_FOR_RE.test(text);
  const audiencePart = strongAudience ? 8 : forHint ? 4 : 0;
  const contextPart = CONTEXT_RE.test(text) ? 7 : 0;
  const earned = audiencePart + contextPart;
  const band: Band = earned === 15 ? 'full' : earned === 0 ? 'zero' : 'partial';

  let note: string;
  if (band === 'full') {
    note = 'Audience and context markers found';
  } else if (audiencePart > 0 && contextPart === 0) {
    note = strongAudience
      ? 'Audience named · no "why/background" context found'
      : 'A "for …" phrase hints at a reader — name them, then add the why';
  } else if (audiencePart === 0 && contextPart > 0) {
    note = 'Context found · no audience marker (passengers, executives, tenants…)';
  } else {
    note = 'No audience or background context detected';
  }
  return { earned, band, note };
}

interface FormatResult extends DetectorResult {
  categories: string[];
}

function detectFormat(text: string): FormatResult {
  const categories = demandedFormats(text);
  const formatMatch = categories[0] ?? null;
  const lengthMatch = LENGTH_CAP_RES.map((re) => text.match(re)).find((m) => m !== null) ?? null;

  // Anti-stuffing: >2 DISTINCT format demands is a kitchen sink, not a spec.
  const overloadPenalty = categories.length > 3 ? 6 : categories.length > 2 ? 2 : 0;

  const raw = (formatMatch ? 8 : 0) + (lengthMatch ? 7 : 0);
  const earned = Math.max(0, raw - overloadPenalty);
  const band: Band = earned === 15 ? 'full' : earned === 0 ? 'zero' : 'partial';

  const overloadNote =
    categories.length > 3
      ? ` · OVERLOAD: ${categories.length} distinct formats demanded (${categories.slice(0, 4).join(', ')}…) — pick the one container the job needs`
      : categories.length > 2
        ? ` · several formats named (${categories.join(', ')}) — fine only if each earns its place`
        : '';

  let note: string;
  if (band === 'full') {
    note = `Format "${formatMatch}" + length spec "${lengthMatch?.[0].trim()}" found`;
  } else if (formatMatch && lengthMatch) {
    note = `Format "${formatMatch}" + length spec found${overloadNote}`;
  } else if (formatMatch) {
    note = `Format word "${formatMatch}" found · no length limit — add "≤ N words" or "about N words"${overloadNote}`;
  } else if (lengthMatch) {
    note = 'Length spec found · no format word (bullets, table, press release…)';
  } else {
    note = 'No format word or length limit found — add "≤ N words"';
  }
  return { earned, band, note, categories };
}

function detectConstraints(text: string): DetectorResult {
  const constraintMatch = text.match(CONSTRAINT_RE);
  const toneMatch = text.match(TONE_RE);
  const earned = (constraintMatch ? 6 : 0) + (toneMatch ? 4 : 0);
  const band: Band = earned === 10 ? 'full' : earned === 0 ? 'zero' : 'partial';

  let note: string;
  if (band === 'full') {
    note = `Rule "${constraintMatch?.[0].toLowerCase()}" + tone "${toneMatch?.[0].toLowerCase()}" found`;
  } else if (constraintMatch) {
    note = `Boundary "${constraintMatch[0].toLowerCase()}" found · no tone word (warm, formal, calm…)`;
  } else if (toneMatch) {
    note = `Tone "${toneMatch[0].toLowerCase()}" found · no do/don\u2019t rule ("only", "avoid", "must")`;
  } else {
    note = 'No constraints or tone guidance detected';
  }
  return { earned, band, note };
}

interface RoleResult extends DetectorResult {
  found: boolean;
  generic: boolean;
}

function detectRole(text: string): RoleResult {
  let triggerSeen: string | null = null;
  for (const re of ROLE_TRIGGER_RES) {
    const m = text.match(re);
    if (!m) continue;
    const candidate = (m[1] ?? '').trim();
    if (ROLE_NOUN_RE.test(candidate)) {
      const earned = 10;
      return {
        earned,
        band: 'full',
        note: `Role phrase "${m[0].slice(0, 42).toLowerCase()}…" found — model answers from the right seat`,
        found: true,
        generic: false,
      };
    }
    if (ROLE_GENERIC_RE.test(candidate)) {
      return {
        earned: 4,
        band: 'partial',
        note: 'Generic role ("assistant") — name a domain seat ("guest services agent") for full credit',
        found: true,
        generic: true,
      };
    }
    triggerSeen = triggerSeen ?? m[0];
  }
  const note = triggerSeen
    ? `"${triggerSeen.slice(0, 34).toLowerCase()}…" names a container, not a seat — a role must be a person ("You are the coordinator")`
    : 'No role assignment — optional, but "You are the …" sets vocabulary and judgment';
  return { earned: 0, band: 'zero', note, found: false, generic: false };
}

interface ExampleResult extends DetectorResult {
  found: boolean;
}

function detectExamples(text: string): ExampleResult {
  const block = EXEMPLAR_BLOCK_RE.test(text);
  const marker = text.match(EXAMPLE_MARKER_RE);
  // Credit requires example CONTENT: ≥10 visible chars after the marker.
  let withContent = false;
  if (marker && marker.index !== undefined) {
    const after = text
      .slice(marker.index + marker[0].length)
      .replace(/^[\s,;:—–-]+/, '')
      .trim();
    withContent = after.length >= 10;
  }
  const earned = block || withContent ? 5 : 0;
  const found = earned === 5;
  const note = block
    ? 'Exemplar Input:/Output: block found'
    : withContent
      ? `Example "${marker?.[0].toLowerCase()}" followed by real sample content`
      : marker
        ? `"${marker[0].toLowerCase()}" with nothing after it — an example marker needs ≥10 chars of actual sample`
        : 'No example — "e.g.," plus a real sample line anchors the pattern';
  return { earned, band: found ? 'full' : 'zero', note, found };
}

function detectStructure(text: string): DetectorResult {
  const delimiterMatch = text.match(DELIMITER_RE);
  const hasSections = SECTION_LINE_RE.test(text) || NUMBERED_STEP_RE.test(text);
  const earned = (delimiterMatch ? 3 : 0) + (hasSections ? 2 : 0);
  const band: Band = earned === 5 ? 'full' : earned === 0 ? 'zero' : 'partial';

  let note: string;
  if (band === 'full') {
    note = 'Delimiters and sectioning found';
  } else if (delimiterMatch) {
    note = 'Delimiters found · add labeled lines or numbered steps';
  } else if (hasSections) {
    note = 'Sectioning found · fence source text in ``` or "Text:"';
  } else {
    note = 'No delimiters or sectioning detected';
  }
  return { earned, band, note };
}

// ── Verdicts ─────────────────────────────────────────────────────────────────

export function verdictFor(total: number): DebriefReport['verdict'] {
  if (total >= 90) return 'GOLD PROMPT';
  if (total >= 80) return 'CLEARED';
  if (total >= 60) return 'WORKABLE — REFINE';
  return 'RETURN TO RAMP';
}

/** OFF COURSE is a v2 verdict outside the frozen types.ts union — compare via this helper. */
export function isOffCourse(report: DebriefReport): boolean {
  return (report.verdict as string) === OFF_COURSE_VERDICT;
}

/** DebriefReport plus v2 runtime extras (advisory notes). Optional fields keep
 * the object assignable wherever the base DebriefReport is expected. */
export type LabReport = DebriefReport & { advisories?: string[] };

// ── The engine ───────────────────────────────────────────────────────────────

/** Sum of the v2 weights: 20/20/15/15/10/10/5/5 = 100 (role optional). */
export const RUBRIC_RAW_MAX = RUBRIC_META.reduce((sum, m) => sum + m.max, 0); // 100

/** v2 weights already sum to 100 — kept for backward compatibility. */
export function scaleToHundred(raw: number): number {
  return Math.round((raw / RUBRIC_RAW_MAX) * 100);
}

/**
 * Score one lab submission. Pure & deterministic — same input, same report.
 * The safety tripwire runs first: when it trips, the score is withheld
 * (total 0, safetyHold true) and the debrief renders as a Hold Short.
 *
 * Caps, in order: OFF COURSE (relevance) at 40, then anti-stuffing at 59.
 * The returned object is a DebriefReport plus an optional `advisories`
 * string list (v2 additive field consumed by the Debrief).
 */
export function scorePrompt(promptText: string, scenario: Scenario, attempt: number): DebriefReport {
  const text = promptText.trim();

  const safety = safetyCheck(text);
  if (safety.tripped) {
    return {
      scenarioId: scenario.id,
      attempt,
      total: 0,
      verdict: 'RETURN TO RAMP',
      dimensions: RUBRIC_META.map((m) => ({
        dimensionId: m.id,
        earned: 0,
        max: m.max,
        note: `Score withheld — safety hold (${safety.hits.join(', ')}).`,
      })),
      strengths: [],
      nextAltitude: [],
      safetyHold: true,
    };
  }

  const relevance = relevanceCheck(text, scenario);

  // Run detectors (format & role & examples expose extra signals for the
  // anti-stuffing density heuristic).
  const task = detectTask(text);
  const specificity = detectSpecificity(text, relevance.hits);
  const context = detectContext(text);
  const format = detectFormat(text);
  const constraints = detectConstraints(text);
  const role = detectRole(text);
  const examples = detectExamples(text);
  const structure = detectStructure(text);

  const results: Record<string, DetectorResult> = {
    task,
    specificity,
    context,
    format,
    constraints,
    role,
    examples,
    structure,
  };

  const dimensions: RubricScore[] = RUBRIC_META.map((m) => {
    const result = results[m.id];
    return { dimensionId: m.id, earned: result.earned, max: m.max, note: result.note };
  });
  const rawTotal = scaleToHundred(dimensions.reduce((sum, d) => sum + d.earned, 0));

  // ── Caps & advisories ────────────────────────────────────────────────────
  const advisories: string[] = [];
  let total = rawTotal;

  // Anti-stuffing density: all five detector families firing while
  // substantive prose is thin → cap 59.
  const detectorFamilies = [
    role.found,
    format.categories.length > 0,
    TONE_RE.test(text),
    CONSTRAINT_RE.test(text),
    examples.found || EXAMPLE_MARKER_RE.test(text),
  ].filter(Boolean).length;
  const contentWords = contentWordCount(text);
  const stuffed = detectorFamilies >= 5 && contentWords < CONTENT_WORD_FLOOR;

  if (relevance.offCourse) {
    total = Math.min(total, OFF_COURSE_CAP);
    advisories.push(
      `OFF COURSE — this doesn\u2019t address the ${scenario.id} assignment (near-zero overlap with the dispatch). Re-read the brief and anchor the prompt in the scenario, e.g. ${scenarioAnchors(scenario).slice(0, 3).join(', ')}.`,
    );
  }
  if (stuffed) {
    total = Math.min(total, STUFFED_CAP);
    advisories.push(
      `Detector stuffing detected — every rubric keyword family is present but only ${contentWords} words of substance. Write the prompt you\u2019d actually send; the rubric rewards substance, not bingo.`,
    );
  }
  if (CONTACT_DATA_RE.test(text)) {
    advisories.push(CONTACT_ADVISORY);
  }

  const verdict = (
    relevance.offCourse ? OFF_COURSE_VERDICT : verdictFor(total)
  ) as DebriefReport['verdict'];

  // Strengths first: dimensions at max, weight order (RUBRIC_META is weight-sorted), max 3.
  const strengths = RUBRIC_META.filter((m) =>
    dimensions.some((d) => d.dimensionId === m.id && d.earned === m.max),
  )
    .slice(0, 3)
    .map((m) => m.strength);

  // Next altitude: off-course guidance first, then biggest weight deficits, max 3.
  const nextAltitude = RUBRIC_META.map((m, i) => ({
    meta: m,
    deficit: m.max - dimensions[i].earned,
  }))
    .filter((x) => x.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit || b.meta.max - a.meta.max)
    .slice(0, relevance.offCourse ? 2 : 3)
    .map((x) => x.meta.suggestion(scenario));
  if (relevance.offCourse) {
    nextAltitude.unshift(
      `This doesn\u2019t address the assignment — the dispatch asks for: ${scenario.greatLooksLike[0] ?? scenario.brief}. Anchor the prompt in the scenario (${scenarioAnchors(scenario).slice(0, 3).join(', ')}), then rebuild.`,
    );
  }

  const report: LabReport = {
    scenarioId: scenario.id,
    attempt,
    total,
    verdict,
    dimensions,
    strengths,
    nextAltitude,
    advisories,
  };
  return report;
}
