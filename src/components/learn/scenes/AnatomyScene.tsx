/**
 * G0 · Leg 2 SceneVideo — "Anatomy builds itself" (lesson.md §S4, 45s).
 * A luggage cart taxis in and six cargo blocks load onto it: INSTRUCTION
 * (amber), CONTEXT (green), INPUT (slate), OUTPUT FORMAT (ink) + mono format
 * tag, then ROLE and EXAMPLES tags (red outline); the cart taxis right and a
 * plane lifts off behind it. Final frame doubles as the anatomy illustration.
 */
import { gsap } from 'gsap';
import type { ReactNode } from 'react';
import { FileText, Plane } from 'lucide-react';

function Container({
  l,
  className,
  label,
  labelClass,
  width,
  children,
}: {
  l: string;
  className: string;
  label: string;
  labelClass: string;
  width: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-l={l}
      className={`relative flex items-center justify-center rounded-[2px] shadow-card ${className}`}
      style={{ width, height: 34 }}
    >
      <span
        data-l={`${l}-label`}
        className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${labelClass}`}
      >
        {label}
      </span>
      {children}
      {/* rivet corners */}
      <span aria-hidden className="absolute left-1 top-1 h-1 w-1 rounded-full bg-black/20" />
      <span aria-hidden className="absolute right-1 top-1 h-1 w-1 rounded-full bg-black/20" />
    </div>
  );
}

export function AnatomyStage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper-bright">
      {/* faint airfield grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(#EDE7D9 1px, transparent 1px), linear-gradient(90deg, #EDE7D9 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* taxiway centerline */}
      <div
        data-l="taxiway"
        aria-hidden
        className="absolute bottom-[16%] left-0 right-0 border-t-2 border-dashed border-amber-500/70"
      />
      {/* plane + dashed trail */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 450"
        preserveAspectRatio="none"
      >
        <path
          data-l="trail"
          d="M 430 340 C 520 320, 600 240, 690 120"
          fill="none"
          stroke="#A9A294"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
      </svg>
      <div data-l="plane" className="absolute right-[10%] top-[14%] text-ink-900">
        <Plane className="h-9 w-9 -rotate-12" strokeWidth={1.5} aria-hidden />
      </div>

      {/* cart group — natural position is the final (taxied) spot */}
      <div data-l="cart" className="absolute bottom-[16%] left-[16%] w-[280px]">
        {/* cargo stack, bottom-aligned */}
        <div className="relative flex flex-col-reverse items-center gap-[3px] pb-1">
          <Container l="instruction" className="bg-amber-500" label="INSTRUCTION" labelClass="text-ink-900" width="66%" />
          <Container l="context" className="bg-field-500" label="CONTEXT" labelClass="text-paper" width="58%" />
          <Container l="input" className="bg-slate-500" label="INPUT" labelClass="text-paper" width="72%">
            <FileText
              data-l="input-doc"
              className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/80"
              strokeWidth={1.5}
              aria-hidden
            />
          </Container>
          <Container l="output" className="bg-ink-900" label="OUTPUT FORMAT" labelClass="text-paper" width="62%">
            <span
              data-l="format-tag"
              className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap rounded-[2px] border border-ink-900 bg-paper-bright px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-ink-900"
            >
              5 BULLETS · ≤120 WORDS
            </span>
          </Container>
          {/* red-outline extras pinned to the stack */}
          <span
            data-l="role-tag"
            className="absolute -left-4 -top-3 -rotate-6 rounded-[2px] border-2 border-signal-500 bg-paper-bright px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-signal-600"
          >
            ROLE
          </span>
          <span
            data-l="examples-tag"
            className="absolute -right-2 -top-6 rotate-3 rounded-[2px] border-2 border-signal-500 bg-paper-bright px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-signal-600"
          >
            EXAMPLES
          </span>
        </div>
        {/* cart bed + wheels + handle */}
        <div className="relative">
          <div className="h-[7px] w-full rounded-[2px] bg-ink-900" />
          <div className="absolute -left-5 top-0 h-[7px] w-4 rounded-l-[2px] bg-ink-900" />
          <div className="absolute -left-5 -top-9 h-9 w-[3px] bg-ink-900" />
          <div className="mt-[3px] flex justify-between px-6">
            <span data-l="wheel" className="block h-4 w-4 rounded-full border-[3px] border-ink-900 bg-paper-bright" />
            <span data-l="wheel" className="block h-4 w-4 rounded-full border-[3px] border-ink-900 bg-paper-bright" />
          </div>
        </div>
      </div>

      {/* corner mono label */}
      <span className="absolute left-3 top-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
        IND · CARGO LOAD 06:00
      </span>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- scene builder is part of the scene API
export function buildAnatomy(tl: gsap.core.Timeline, root: HTMLElement) {
  const q = (sel: string) => root.querySelectorAll(`[data-l="${sel}"]`);
  const set = (sel: string, vars: gsap.TweenVars) => gsap.set(q(sel), vars);

  // initial (pre-roll) states
  set('cart', { x: -300, opacity: 0 });
  set('instruction', { y: -180, scale: 1.15, opacity: 0 });
  set('context', { x: -260, opacity: 0 });
  set('input', { x: -320, opacity: 0 });
  set('output', { y: -160, scale: 1.15, opacity: 0 });
  set('format-tag', { scale: 0, transformOrigin: 'left center' });
  set('role-tag', { scale: 0, transformOrigin: 'center' });
  set('examples-tag', { scale: 0, transformOrigin: 'center' });
  set('plane', { x: -180, y: 200, opacity: 0, rotate: 6 });
  // Trail wipe: clip-path inset (scrub-safe; avoids dash-offset merging issues).
  set('trail', { clipPath: 'inset(0% 100% 0% 0%)' });

  // 0–4s — cart rolls in
  tl.to(q('cart'), { x: 0, opacity: 1, duration: 3.2, ease: 'power2.out' }, 0);
  tl.to(q('wheel'), { rotate: 540, duration: 3.2, ease: 'power2.out' }, 0);

  // 4–12s — INSTRUCTION drops on with a thud; label prints
  tl.to(q('instruction'), { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power2.in' }, 4.2);
  tl.to(q('cart'), { y: 4, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 5.1);
  tl.fromTo(q('instruction-label'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 6.4);

  // 12–20s — CONTEXT slides in and stacks
  tl.to(q('context'), { x: 0, opacity: 1, duration: 1.6, ease: 'power3.out' }, 12.2);
  tl.to(q('cart'), { y: 3, duration: 0.1, yoyo: true, repeat: 1 }, 13.8);
  tl.fromTo(q('context-label'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 14.6);

  // 20–28s — INPUT slides in low with its document glyph
  tl.to(q('input'), { x: 0, opacity: 1, duration: 1.6, ease: 'power3.out' }, 20.2);
  tl.to(q('cart'), { y: 3, duration: 0.1, yoyo: true, repeat: 1 }, 21.8);
  tl.fromTo(q('input-label'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 22.6);
  tl.fromTo(q('input-doc'), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.6 }, 23.2);

  // 28–36s — OUTPUT FORMAT drops on top; mono tag prints
  tl.to(q('output'), { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power2.in' }, 28.2);
  tl.to(q('cart'), { y: 4, duration: 0.12, yoyo: true, repeat: 1 }, 29.1);
  tl.fromTo(q('output-label'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 30.2);
  tl.to(q('format-tag'), { scale: 1, duration: 0.6, ease: 'back.out(2)' }, 31.6);

  // 36–45s — ROLE + EXAMPLES pin on; cart taxis right; plane lifts off
  tl.to(q('role-tag'), { scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, 36.2);
  tl.to(q('examples-tag'), { scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, 37.6);
  tl.to(q('cart'), { x: 64, duration: 3.4, ease: 'power1.inOut' }, 40);
  tl.to(q('wheel'), { rotate: '+=260', duration: 3.4, ease: 'power1.inOut' }, 40);
  tl.to(q('plane'), { x: 0, y: 0, opacity: 1, rotate: -12, duration: 4.2, ease: 'power1.in' }, 40.2);
  tl.to(q('trail'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 4.4, ease: 'power1.inOut' }, 40.2);
}
