/**
 * G0 · Leg 1 SceneVideo — "The prediction engine" (30s).
 * An ops sentence assembles token by token; a candidate panel scores three
 * possible next words with probability bars; the winner lands in the
 * sentence; the remaining tokens cascade; a verdict line stamps on.
 */
import { gsap } from 'gsap';

const SENTENCE_TOKENS = [
  { l: 'tok-1', text: 'THE RAMP AT CONCOURSE B' },
  { l: 'tok-2', text: 'CLOSES' },
  { l: 'tok-3', text: 'AT' },
  { l: 'tok-win', text: '14:00', win: true },
  { l: 'tok-4', text: 'FOR MAINTENANCE' },
  { l: 'tok-5', text: 'UNTIL' },
  { l: 'tok-6', text: '06:00' },
];

const CANDIDATES = [
  { l: 'cand-1', word: '14:00', pct: 72 },
  { l: 'cand-2', word: 'NOON', pct: 18 },
  { l: 'cand-3', word: 'DAWN', pct: 7 },
];

export function PredictionStage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper-bright">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(#EDE7D9 1px, transparent 1px), linear-gradient(90deg, #EDE7D9 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* title card — transient (hidden in final frame) */}
      <div data-l="title" className="absolute inset-0 flex items-center justify-center opacity-0">
        <p className="rounded-[2px] border-2 border-ink-900 bg-paper px-5 py-3 font-mono text-lg font-semibold uppercase tracking-[0.2em] text-ink-900 md:text-2xl">
          The Prediction Engine
        </p>
      </div>

      {/* sentence strip */}
      <div className="absolute left-[6%] right-[6%] top-[12%]">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          INPUT SO FAR
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 md:gap-2">
          {SENTENCE_TOKENS.map((t) => (
            <span
              key={t.l}
              data-l={t.l}
              className={`rounded-[2px] border px-2 py-1 font-mono text-[10px] font-semibold tracking-wide md:px-2.5 md:text-[13px] ${
                t.win
                  ? 'border-amber-500 bg-amber-100 text-amber-600'
                  : 'border-ink-900/30 bg-paper text-ink-900'
              }`}
            >
              {t.text}
            </span>
          ))}
          <span
            data-l="caret"
            className="inline-block h-[18px] w-[9px] animate-caret-blink bg-amber-500 motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      </div>

      {/* candidate panel — transient */}
      <div
        data-l="candidates"
        className="absolute bottom-[16%] left-[6%] w-[46%] min-w-[240px] rounded-[6px] border-2 border-ink-900 bg-paper p-3 opacity-0 shadow-card md:p-4"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          NEXT-WORD SCORES
        </p>
        <div className="mt-2 space-y-2">
          {CANDIDATES.map((c) => (
            <div key={c.l} data-l={c.l} className="rounded-[2px] px-1 py-0.5">
              <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-ink-900 md:text-[13px]">
                <span>{c.word}</span>
                <span data-l={`${c.l}-pct`}>{c.pct}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-[2px] bg-paper-dim">
                <div
                  data-l={`${c.l}-bar`}
                  className="h-full origin-left rounded-[2px] bg-amber-500"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* verdict */}
      <div className="absolute bottom-[10%] right-[6%] max-w-[44%] text-right">
        <p
          data-l="verdict"
          className="font-mono text-[12px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-ink-900 md:text-[16px]"
        >
          It completes patterns.
          <br />
          It doesn&rsquo;t look things up.
        </p>
        <div data-l="verdict-underline" className="ml-auto mt-2 h-[3px] w-full origin-right bg-amber-500" />
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- scene builder is part of the scene API
export function buildPrediction(tl: gsap.core.Timeline, root: HTMLElement) {
  const q = (sel: string) => root.querySelectorAll(`[data-l="${sel}"]`);
  const set = (sel: string, vars: gsap.TweenVars) => gsap.set(q(sel), vars);

  // initial states — sentence hidden, winner/cascade tokens hidden, panel out
  set('tok-1', { opacity: 0, y: 10 });
  set('tok-2', { opacity: 0, y: 10 });
  set('tok-3', { opacity: 0, y: 10 });
  set('tok-win', { opacity: 0, scale: 1.4 });
  set('tok-4', { opacity: 0, y: 10 });
  set('tok-5', { opacity: 0, y: 10 });
  set('tok-6', { opacity: 0, y: 10 });
  set('caret', { opacity: 0 });
  set('verdict', { opacity: 0, scale: 1.25 });
  set('verdict-underline', { scaleX: 0 });
  CANDIDATES.forEach((c) => {
    set(`${c.l}-bar`, { scaleX: 0 });
  });

  // 0–4s — title card on, then off
  tl.to(q('title'), { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.4);
  tl.to(q('title'), { opacity: 0, duration: 0.5, ease: 'power2.in' }, 3.3);

  // 4–10s — sentence tokens appear one at a time
  tl.to(q('tok-1'), { opacity: 1, y: 0, duration: 0.5 }, 4.2);
  tl.to(q('caret'), { opacity: 1, duration: 0.2 }, 4.4);
  tl.to(q('tok-2'), { opacity: 1, y: 0, duration: 0.5 }, 6.0);
  tl.to(q('tok-3'), { opacity: 1, y: 0, duration: 0.5 }, 7.6);

  // 10–16s — candidate panel rises, bars extend, leader highlights
  tl.to(q('candidates'), { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 10);
  CANDIDATES.forEach((c, i) => {
    tl.to(q(`${c.l}-bar`), { scaleX: 1, duration: 1.1, ease: 'power3.out' }, 10.8 + i * 0.35);
  });
  tl.to(q('cand-1'), { backgroundColor: '#F9E8CB', duration: 0.4 }, 13.4);
  tl.to(q('cand-1-pct'), { scale: 1.3, transformOrigin: 'right center', duration: 0.3, yoyo: true, repeat: 1 }, 13.6);

  // 16–20s — winner lands in the sentence
  tl.to(q('candidates'), { opacity: 0, duration: 0.5 }, 17.4);
  tl.to(q('tok-win'), { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.8)' }, 16.4);

  // 20–26s — cascade of fast predictions
  tl.to(q('tok-4'), { opacity: 1, y: 0, duration: 0.25 }, 20.2);
  tl.to(q('tok-5'), { opacity: 1, y: 0, duration: 0.25 }, 21.0);
  tl.to(q('tok-6'), { opacity: 1, y: 0, duration: 0.25 }, 21.8);

  // 26–30s — verdict stamps on, underline sweeps
  tl.to(q('verdict'), { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 26);
  tl.to(q('verdict-underline'), { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, 26.8);
}
