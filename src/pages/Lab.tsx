/**
 * The Prompt Lab (promptlab.md) — the platform's signature practice surface.
 *
 * Board view: scenario departures board (filters, best scores, statuses).
 * Workspace view: dispatch desk — brief stack left, writing desk right —
 * with transmit → taxiway-blink → the animated 8-dimension Debrief.
 * Every submission is scored by the deterministic engine in src/lib/rubric.ts
 * and recorded via recordLabAttempt (+40 miles, best score kept); the three
 * capstone scenarios WTP-L10/11/12 chain for the certificate logic.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, OctagonAlert } from 'lucide-react';
import type { DebriefReport, Scenario } from '@/content/types';
import { getScenario, SCENARIOS, scenarioCode } from '@/content/scenarios';
import {
  awardWing,
  capstoneSubmittedCount,
  getProgress,
  hasWing,
  isGateUnlocked,
  markGoldViewed,
  recordLabAttempt,
  useProgress,
  WINGS,
} from '@/lib/progress';
import { scorePrompt } from '@/lib/rubric';
import { getLenis, prefersReducedMotion, scrollToTarget } from '@/lib/smooth-scroll';
import { useToast } from '@/components/Toast';
import DeparturesBoard from '@/components/lab/DeparturesBoard';
import BriefStack from '@/components/lab/BriefStack';
import WritingDesk from '@/components/lab/WritingDesk';
import Debrief from '@/components/lab/Debrief';
import HintLadder from '@/components/lab/HintLadder';
import ChainHeader from '@/components/lab/ChainHeader';
import AttemptLog from '@/components/lab/AttemptLog';
import type { LabAttemptEntry } from '@/components/lab/AttemptLog';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

// ── Local persistence (drafts + attempt history) ─────────────────────────────

const DRAFT_KEY = (id: string) => `iaa-prompt-academy:lab-draft:v1:${id}`;
const HISTORY_KEY = 'iaa-prompt-academy:lab-history:v1';

type LabHistory = Record<string, LabAttemptEntry[]>;

function readDraft(id: string): string {
  try {
    return window.localStorage.getItem(DRAFT_KEY(id)) ?? '';
  } catch {
    return '';
  }
}

function writeDraft(id: string, text: string): void {
  try {
    if (text) window.localStorage.setItem(DRAFT_KEY(id), text);
    else window.localStorage.removeItem(DRAFT_KEY(id));
  } catch {
    // storage blocked — draft lives in state only
  }
}

function loadHistory(): LabHistory {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as LabHistory) : {};
  } catch {
    return {};
  }
}

function saveHistory(h: LabHistory): void {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  } catch {
    // storage blocked — history lives in state only
  }
}

function scrollToTop(): void {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(0, { duration: 0.6 });
  else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

// ── Workspace (one scenario, keyed by id so switching scenarios remounts) ────

interface LabWorkspaceProps {
  scenario: Scenario;
  onExit: () => void;
  onSelectScenario: (id: string) => void;
}

function LabWorkspace({ scenario, onExit, onSelectScenario }: LabWorkspaceProps) {
  const progress = useProgress();
  const { showToast } = useToast();

  const [draft, setDraft] = useState(() => readDraft(scenario.id));
  const [chipsUsed, setChipsUsed] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<DebriefReport | null>(null);
  const [reportPrompt, setReportPrompt] = useState('');
  const [isNewBest, setIsNewBest] = useState(false);
  const [chainJustCompleted, setChainJustCompleted] = useState(false);
  const [history, setHistory] = useState<LabHistory>(loadHistory);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const deskRef = useRef<HTMLDivElement | null>(null);
  const debriefRef = useRef<HTMLDivElement | null>(null);

  // Arriving at a workspace scrolls to the top of the desk (external system).
  useEffect(() => {
    scrollToTop();
  }, []);

  const updateDraft = useCallback(
    (v: string) => {
      setDraft(v);
      writeDraft(scenario.id, v);
    },
    [scenario.id],
  );

  const handleChipUsed = useCallback((id: string) => {
    setChipsUsed((list) => (list.includes(id) ? list : [...list, id]));
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitting) return;
    const text = draft.trim();
    if (!text) return;
    setSubmitting(true);

    // Taxiway-blink "transmitting" beat; the engine itself runs in <1s.
    window.setTimeout(
      () => {
        const prev = getProgress().lab[scenario.id];
        const prevBest = prev?.bestScore ?? 0;
        const attemptNo = (prev?.attempts ?? 0) + 1;
        const result = scorePrompt(text, scenario, attemptNo);

        const chainBefore = capstoneSubmittedCount();
        const milesAwarded = recordLabAttempt(scenario.id, result.total);
        showToast(
          'RAMP:',
          milesAwarded > 0
            ? `+${milesAwarded} miles logged for the attempt.`
            : 'Attempt logged — beat your best to earn more miles.'
        );

        // Gold Prompt wing — earned unaided (gold prompt never opened here).
        if (
          !result.safetyHold &&
          result.total >= 90 &&
          !prev?.goldViewed &&
          !hasWing(WINGS.GOLD_PROMPT)
        ) {
          awardWing(WINGS.GOLD_PROMPT);
          showToast('TOWER:', 'Gold Prompt wing earned — 90+ with no aid.');
        }

        setIsNewBest(prevBest > 0 && result.total > prevBest);
        setReport(result);
        setReportPrompt(text);
        setSubmitting(false);

        const entry: LabAttemptEntry = {
          attempt: attemptNo,
          score: result.total,
          safetyHold: Boolean(result.safetyHold),
          prompt: text,
          report: result,
          at: new Date().toISOString(),
        };
        setHistory((h) => {
          const next = { ...h, [scenario.id]: [...(h[scenario.id] ?? []), entry].slice(-12) };
          saveHistory(next);
          return next;
        });

        if (scenario.capstone && chainBefore < 3 && capstoneSubmittedCount() === 3) {
          setChainJustCompleted(true);
          showToast('TOWER:', 'Capstone chain complete — final approach.');
        }

        window.setTimeout(() => {
          if (debriefRef.current) scrollToTarget(debriefRef.current, -96);
        }, 80);
      },
      prefersReducedMotion() ? 150 : 1100,
    );
  }, [scenario, submitting, draft, showToast]);

  const handleRefine = useCallback(() => {
    if (deskRef.current) scrollToTarget(deskRef.current, -80);
    window.setTimeout(() => editorRef.current?.focus({ preventScroll: true }), 500);
  }, []);

  const handleOpenGold = useCallback(() => {
    const already = getProgress().lab[scenario.id]?.goldViewed;
    markGoldViewed(scenario.id);
    if (!already) {
      showToast('TOWER:', 'Gold prompt viewed — wing eligibility for this scenario caps at 89.');
    }
  }, [scenario, showToast]);

  const labRecord = progress.lab[scenario.id];
  const attempts = labRecord?.attempts ?? 0;

  if (scenario.capstone && !isGateUnlocked('g5')) {
    return (
      <div className="mt-8 rounded-[10px] border-2 border-signal-500/50 bg-signal-100 p-8">
        <p className="label flex items-center gap-2 text-signal-600">
          <OctagonAlert className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          CAPSTONE — LOCKED
        </p>
        <h1 className="h2 mt-4 text-ink-900">This chain boards at Gate 5.</h1>
        <p className="body mt-3 text-ink-700">
          The capstone chain (WTP-L10 → L11 → L12) opens once Gate 4&apos;s check is cleared at 80%
          or better. Fly the curriculum first — the range will hold your slot.
        </p>
        <button type="button" className="btn-ghost mt-6" onClick={onExit}>
          ← Back to the board
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <p className="label text-amber-600">{scenarioCode(scenario.id)} · DISPATCH DESK</p>
        <h1 className="h2 text-ink-900">{scenario.title}</h1>
      </div>

      {scenario.capstone ? (
        <div className="mt-6">
          <ChainHeader
            currentId={scenario.id}
            celebrating={chainJustCompleted}
            onSelect={onSelectScenario}
          />
        </div>
      ) : null}

      <div ref={deskRef} className="mt-8 grid gap-8 lg:grid-cols-[45fr_55fr]">
        <BriefStack scenario={scenario} />
        <div className="flex flex-col gap-6">
          <WritingDesk
            value={draft}
            onChange={updateDraft}
            onSubmit={handleSubmit}
            submitting={submitting}
            attempts={attempts}
            bestScore={labRecord?.bestScore ?? 0}
            goldViewed={Boolean(labRecord?.goldViewed)}
            chipsUsed={chipsUsed}
            onChipUsed={handleChipUsed}
            editorRef={editorRef}
          />
          <HintLadder
            scenario={scenario}
            attempts={attempts}
            goldViewed={Boolean(labRecord?.goldViewed)}
            onOpenGold={handleOpenGold}
          />
        </div>
      </div>

      <div ref={debriefRef}>
        {report ? (
          <Debrief
            scenario={scenario}
            report={report}
            promptText={reportPrompt}
            isNewBest={isNewBest}
            chipsUsed={chipsUsed}
            onRefine={handleRefine}
            onNewScenario={onExit}
          />
        ) : null}
      </div>

      <div className="mt-6">
        <AttemptLog entries={history[scenario.id] ?? []} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Lab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('scn');
  const scenario = getScenario(selectedId);

  const select = useCallback(
    (id: string | null) => {
      setSearchParams(id ? { scn: id } : {}, { replace: false });
    },
    [setSearchParams],
  );

  // Returning to the board restores the top of the page (external system).
  useEffect(() => {
    if (!selectedId) scrollToTop();
  }, [selectedId]);

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-12 md:py-16">
        <AnimatePresence mode="wait">
          {scenario ? (
            /* ── Workspace (flight-pushback transition; keyed = fresh desk) ── */
            <motion.div
              key={`workspace-${scenario.id}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35, ease: EASE_EXPO }}
            >
              <button
                type="button"
                onClick={() => select(null)}
                className="flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-500 transition-colors hover:text-amber-600"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                ALL DEPARTURES
              </button>

              <LabWorkspace
                key={scenario.id}
                scenario={scenario}
                onExit={() => select(null)}
                onSelectScenario={(id) => select(id)}
              />
            </motion.div>
          ) : (
            /* ── Board view ─────────────────────────────────────────────── */
            <motion.div
              key="board"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35, ease: EASE_EXPO }}
            >
              <header>
                <p className="label text-amber-600">THE PRACTICE RANGE</p>
                <h1 className="h1 mt-4 max-w-[16ch] text-ink-900">
                  Write the prompt. Transmit. Get the debrief.
                </h1>
                <p className="body mt-4 text-ink-700">
                  Twelve scenarios from real IAA work — press releases, storm summaries, tenant
                  notices, grant narratives. No live AI: every scenario runs on a deterministic
                  feedback engine that scores your prompt&apos;s craft across eight dimensions. Your
                  words stay in your browser.
                </p>
              </header>

              <div className="mt-8">
                <DeparturesBoard scenarios={SCENARIOS} onSelect={(id) => select(id)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
