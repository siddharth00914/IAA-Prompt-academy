import { motion } from 'framer-motion';
import { Check, OctagonAlert, Paperclip } from 'lucide-react';
import type { Scenario } from '@/content/types';
import { scenarioCode } from '@/content/scenarios';

const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PERSONA_SRC: Record<string, string> = {
  ops: '/persona-ops.webp',
  comms: '/persona-comms.webp',
  maint: '/persona-maint.webp',
};

interface BriefStackProps {
  scenario: Scenario;
}

/**
 * The left-hand brief stack (promptlab.md §S2): role card (2px ink frame,
 * persona portrait, YOU ARE line) → task brief (DISPATCH + GREAT LOOKS LIKE
 * checklist) → data excerpt (attached-document card, torn top edge, paperclip,
 * HOLD SHORT banner when the excerpt carries faux-sensitive items).
 */
export default function BriefStack({ scenario }: BriefStackProps) {
  const personaSrc = PERSONA_SRC[scenario.persona ?? 'ops'];

  return (
    <div className="flex flex-col gap-5">
      {/* Role card */}
      <motion.section
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: EASE_EXPO }}
        className="rounded-[6px] border-2 border-ink-900 bg-paper-bright p-5"
        aria-label="Your role"
      >
        <div className="flex items-center gap-4">
          <img
            src={personaSrc}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-line object-cover"
          />
          <div>
            <p className="label text-amber-600">YOU ARE:</p>
            <p className="body-strong mt-1 text-ink-900">{scenario.role}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-[2px] border border-line bg-paper px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            {scenario.fn}
          </span>
          <span className="rounded-[2px] border border-line bg-paper px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            RELATES TO {scenario.gateId.toUpperCase()}
          </span>
          {scenario.capstone ? (
            <span className="rounded-[2px] border border-amber-600/60 bg-amber-100 px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-600">
              CAPSTONE · CHAIN {scenario.chainStep}/3
            </span>
          ) : null}
        </div>
      </motion.section>

      {/* Task brief */}
      <motion.section
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: EASE_EXPO, delay: 0.08 }}
        className="rounded-[6px] border border-line bg-paper-bright p-5 shadow-card"
        aria-label="Task brief"
      >
        <p className="label text-ink-500">
          DISPATCH · {scenarioCode(scenario.id)}
        </p>
        <h3 className="h3 mt-3 text-ink-900">{scenario.title}</h3>
        <p className="body mt-3 text-[15px] text-ink-700">{scenario.brief}</p>

        <div className="mt-5 rounded-[4px] border border-line bg-paper p-4">
          <p className="label text-field-600">GREAT LOOKS LIKE</p>
          <ul className="mt-3 flex flex-col gap-2">
            {scenario.greatLooksLike.map((item) => (
              <li key={item} className="flex items-start gap-2 font-mono text-[13px] leading-snug text-ink-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-field-500" strokeWidth={2.5} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Data excerpt — attached document card */}
      <motion.section
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: EASE_EXPO, delay: 0.16 }}
        aria-label="Data excerpt"
      >
        {/* torn top edge */}
        <div
          aria-hidden
          className="h-3 w-full bg-paper-dim"
          style={{
            clipPath:
              'polygon(0 100%, 0 45%, 3% 90%, 7% 30%, 11% 85%, 15% 40%, 20% 95%, 24% 35%, 29% 80%, 33% 25%, 38% 90%, 42% 45%, 47% 85%, 51% 30%, 56% 95%, 60% 35%, 65% 80%, 69% 25%, 74% 90%, 78% 40%, 83% 85%, 87% 30%, 92% 95%, 96% 35%, 100% 80%, 100% 100%)',
          }}
        />
        <div className="border border-t-0 border-line bg-paper-dim p-5">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-ink-500" strokeWidth={1.5} aria-hidden />
            <p className="label text-ink-500">ATTACHED · SOURCE MATERIAL</p>
          </div>
          <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-ink-700">
            {scenario.dataExcerpt}
          </pre>

          {scenario.containsFauxSensitive ? (
            <div className="mt-4 flex items-start gap-2 rounded-[4px] border border-signal-500/40 bg-signal-100 px-3 py-2">
              <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0 text-signal-600" strokeWidth={1.5} aria-hidden />
              <p className="font-mono text-[12px] leading-snug text-signal-600">
                <span className="font-semibold uppercase tracking-[0.1em]">HOLD SHORT — </span>
                Training data. Nothing here is real — but in the real world, never paste SSI or PII.
              </p>
            </div>
          ) : null}
        </div>
      </motion.section>
    </div>
  );
}
