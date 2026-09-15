import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Clapperboard, Expand, Pause, Play } from 'lucide-react';
import type { SceneVideoBlock } from '@/content/types';
import { prefersReducedMotion } from '@/lib/smooth-scroll';
import { SCENE_REGISTRY } from './scenes/registry';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

gsap.registerPlugin(useGSAP);

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * SceneVideo (lesson.md §3.2) — the "video-style" explainer. A 16:9 framed
 * card with full playback chrome (play/pause, scrub, timecode, caption line,
 * 1×/1.5×, expand-to-dialog) whose picture is a GSAP timeline over DOM/SVG
 * scene layers — no video files. Auto-plays once at 60% visibility, pauses
 * off-screen, scrubbable. Reduced motion: static final-frame poster with the
 * caption list beneath (which also serves print).
 */
export default function SceneVideo({ block }: { block: SceneVideoBlock }) {
  const reduced = prefersReducedMotion();
  const scene = SCENE_REGISTRY[block.id];
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const autoPlayedRef = useRef(false);
  const scrubbingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 1.5>(1);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Build the timeline (skipped for reduced motion — poster renders instead).
  useGSAP(
    () => {
      if (reduced || !scene || !rootRef.current) return;
      const tl = gsap.timeline({ paused: true });
      tlRef.current = tl;
      scene.build(tl, rootRef.current);
      tl.set({}, {}, block.duration);
      tl.eventCallback('onComplete', () => setPlaying(false));

      const update = () => {
        const t = tl.time();
        if (fillRef.current) {
          fillRef.current.style.transform = `scaleX(${Math.min(1, t / block.duration)})`;
        }
        if (timeRef.current) {
          timeRef.current.textContent = `${fmt(t)} / ${fmt(block.duration)}`;
        }
        const idx = block.captions.findIndex((c) => t >= c.t0 && t < c.t1);
        setCaptionIdx((prev) => (prev === idx ? prev : idx));
      };
      gsap.ticker.add(update);
      return () => {
        gsap.ticker.remove(update);
        tl.kill();
        tlRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [block.id, reduced] },
  );

  // Auto-play once when ≥60% visible; pause when scrolled off.
  useEffect(() => {
    if (reduced || !rootRef.current) return;
    const el = rootRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        const tl = tlRef.current;
        if (!tl) return;
        if (e.intersectionRatio >= 0.6 && !autoPlayedRef.current) {
          autoPlayedRef.current = true;
          tl.play(0);
          setPlaying(true);
        } else if (e.intersectionRatio < 0.2 && !tl.paused()) {
          tl.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.2, 0.6] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  const toggle = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (tl.paused()) {
      if (tl.progress() >= 1) tl.restart();
      else tl.play();
      setPlaying(true);
    } else {
      tl.pause();
      setPlaying(false);
    }
  };

  const changeSpeed = (s: 1 | 1.5) => {
    setSpeed(s);
    tlRef.current?.timeScale(s);
  };

  const seekTo = (clientX: number, track: HTMLElement) => {
    const tl = tlRef.current;
    if (!tl) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    tl.seek(ratio * block.duration);
  };

  const onScrubDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    scrubbingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekTo(e.clientX, e.currentTarget);
  };
  const onScrubMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubbingRef.current) seekTo(e.clientX, e.currentTarget);
  };
  const onScrubUp = () => {
    scrubbingRef.current = false;
  };

  const caption = captionIdx >= 0 ? block.captions[captionIdx] : undefined;

  return (
    <section aria-label={`${block.title} — animated explainer`}>
      <div
        ref={rootRef}
        tabIndex={reduced ? undefined : 0}
        role="group"
        aria-label={`${block.title} player. Press space to play or pause.`}
        onKeyDown={(e) => {
          if (e.key === ' ' && !reduced) {
            e.preventDefault();
            toggle();
          }
        }}
        className="overflow-hidden rounded-[6px] border-2 border-ink-900 bg-paper-bright shadow-card focus-visible:shadow-glow-ring"
      >
        {/* title bar */}
        <div className="flex items-center gap-2 border-b-2 border-ink-900 bg-paper px-4 py-2.5">
          <Clapperboard className="h-4 w-4 text-amber-600" strokeWidth={1.5} aria-hidden />
          <span className="label text-ink-500">FLIGHT DECK VIDEO</span>
          <span className="body-strong ml-1 truncate text-[15px] text-ink-900">{block.title}</span>
          <span className="data ml-auto shrink-0 text-ink-500">{block.duration}S</span>
        </div>

        {/* 16:9 stage */}
        <div className="relative aspect-video w-full overflow-hidden">
          {reduced && block.poster ? (
            <img
              src={block.poster}
              alt={`${block.title} — final frame`}
              className="h-full w-full bg-paper object-contain"
            />
          ) : scene ? (
            <scene.Stage />
          ) : block.poster ? (
            <img
              src={block.poster}
              alt={`${block.title} — final frame`}
              className="h-full w-full bg-paper object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-paper-dim">
              <p className="label text-ink-500">SCENE ON FINAL APPROACH — POSTER FOLLOWS</p>
            </div>
          )}
          {reduced ? (
            <span className="absolute right-3 top-3 rounded-[2px] border border-ink-900 bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700">
              Static poster
            </span>
          ) : null}
        </div>

        {/* playback chrome */}
        {reduced ? null : (
          <div className="border-t border-line bg-paper px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'Pause' : 'Play'}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] bg-amber-500 text-ink-900 transition-colors hover:bg-amber-400"
              >
                {playing ? (
                  <Pause className="h-4 w-4" strokeWidth={2} aria-hidden />
                ) : (
                  <Play className="h-4 w-4" strokeWidth={2} aria-hidden />
                )}
              </button>
              {/* scrub track */}
              <div
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={block.duration}
                tabIndex={-1}
                onPointerDown={onScrubDown}
                onPointerMove={onScrubMove}
                onPointerUp={onScrubUp}
                className="group relative h-6 flex-1 cursor-pointer"
              >
                <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-[2px] bg-paper-dim" />
                <div
                  ref={fillRef}
                  className="absolute inset-x-0 top-1/2 h-[6px] origin-left -translate-y-1/2 rounded-[2px] bg-amber-500"
                  style={{ transform: 'scaleX(0)' }}
                />
              </div>
              <span ref={timeRef} className="data shrink-0 tabular-nums text-ink-700">
                {`0:00 / ${fmt(block.duration)}`}
              </span>
              <div
                className="flex shrink-0 overflow-hidden rounded-[2px] border border-line"
                role="group"
                aria-label="Playback speed"
              >
                {([1, 1.5] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeSpeed(s)}
                    className={`px-2 py-1 font-mono text-[11px] font-semibold ${
                      speed === s ? 'bg-ink-900 text-paper' : 'bg-paper-bright text-ink-500'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Expand poster and transcript"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-line text-ink-700 transition-colors hover:border-amber-500 hover:text-ink-900"
              >
                <Expand className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            {/* caption line */}
            <p className="prompt-text mt-2 min-h-[1.7em] text-ink-700" aria-live="polite">
              {caption ? caption.text : ' '}
            </p>
          </div>
        )}
      </div>

      {/* caption transcript — visible for reduced motion, available to print */}
      <ol
        className={`mt-3 space-y-1 ${reduced ? '' : 'hidden print:block'}`}
        aria-label="Scene captions"
      >
        {block.captions.map((c) => (
          <li key={`${c.t0}`} className="flex gap-3">
            <span className="data shrink-0 text-ink-500">
              {fmt(c.t0)}–{fmt(c.t1)}
            </span>
            <span className="small text-ink-700">{c.text}</span>
          </li>
        ))}
      </ol>

      {/* expand → dialog with poster + transcript */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl border-2 border-ink-900 bg-paper">
          <DialogHeader>
            <DialogTitle className="h4 text-ink-900">{block.title}</DialogTitle>
            <DialogDescription className="small text-ink-500">
              Final frame and full caption transcript.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-[4px] border-2 border-ink-900">
            {block.poster ? (
              <img
                src={block.poster}
                alt={`${block.title} — final frame`}
                className="h-full w-full bg-paper object-contain"
              />
            ) : scene ? (
              <scene.Stage />
            ) : null}
          </div>
          <ol className="mt-2 space-y-1">
            {block.captions.map((c) => (
              <li key={`dlg-${c.t0}`} className="flex gap-3">
                <span className="data shrink-0 text-ink-500">
                  {fmt(c.t0)}–{fmt(c.t1)}
                </span>
                <span className="small text-ink-700">{c.text}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </section>
  );
}
