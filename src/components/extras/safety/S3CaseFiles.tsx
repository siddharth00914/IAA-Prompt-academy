import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Plane } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CaseFileData {
  tab: string;
  title: string;
  body: string;
  redacted: string[];
  principle: string;
  stamp: string;
  source: string;
}

const CASES: CaseFileData[] = [
  {
    tab: 'CASE FILE 01 · TRIBUNAL · 2024',
    title: 'AIR CANADA — 2024 BCCRT 149',
    body:
      'A customer asked Air Canada’s website chatbot about bereavement fares. The bot invented a retroactive refund policy that did not exist. The tribunal held the airline liable for what its chatbot said — rejecting the argument that the bot was “a separate legal entity.” Award: C$812.02. Principle: the organization owns every word its AI says. Whatever a bot — or your AI-assisted draft — tells a passenger, the Authority says it.',
    redacted: ['▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓ ▓▓▓▓▓▓▓▓▓', '▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓ ▓▓'],
    principle: 'the organization owns every word its AI says',
    stamp: 'YOU OWN THE OUTPUT',
    source: 'Source: Moffatt v. Air Canada, 2024 BCCRT 149 · BC Civil Resolution Tribunal, Feb 14 2024',
  },
  {
    tab: 'CASE FILE 02 · FEDERAL COURT · 2023',
    title: 'MATA v. AVIANCA — S.D.N.Y. 2023',
    body:
      'Attorneys filed a brief containing six court cases ChatGPT had fabricated — fake quotes, fake docket numbers. When challenged, they stood by the fakes. The court sanctioned them $5,000, calling the submission “gibberish” dressed as law. One lawyer admitted he believed the tool “could not possibly be fabricating cases.” Principle: plausible formatting is not evidence. Citations must be opened, not assumed.',
    redacted: ['▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓', '▓▓▓▓▓▓▓▓ ▓▓▓▓ ▓▓▓▓▓'],
    principle: 'plausible formatting is not evidence',
    stamp: 'VERIFY OR DON’T FILE',
    source: 'Source: Mata v. Avianca, Inc., S.D.N.Y., June 22 2023 · Rule 11 sanctions, $5,000',
  },
];

/**
 * S3 — Case Files (safety.md §S3): GSAP pinned horizontal-scroll-feel story,
 * 180vh scrub. Cards slide in from the right, redacted bars flicker-reveal,
 * verdict stamps slam at each card's midpoint. GSAP is isolated in this
 * component (react-dev.md library-isolation rule); reduced motion and small
 * screens render the cards stacked, stamps at rest.
 */
export default function S3CaseFiles() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stampRefs = useRef<(HTMLDivElement | null)[]>([]);
  const redactRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const [card1, card2] = cardRefs.current;
        const [stamp1, stamp2] = stampRefs.current;
        const redacts = redactRefs.current.filter(Boolean) as HTMLParagraphElement[];
        if (!card1 || !card2 || !stamp1 || !stamp2) return;

        // initial states applied up-front (reverted automatically on cleanup)
        gsap.set([card1, card2], { x: () => window.innerWidth * 0.6, opacity: 0.3 });
        gsap.set([stamp1, stamp2], { scale: 1.6, rotation: -16, opacity: 0 });
        gsap.set(redacts, { opacity: 0.12 });
        if (planeRef.current) gsap.set(planeRef.current, { left: '0%' });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=180%',
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
          defaults: { ease: 'none' },
        });

        // plane advances along the dashed track across the whole scrub
        if (planeRef.current) {
          tl.to(planeRef.current, { left: '100%', duration: 1 }, 0);
        }

        // case 1: slide in, redactions flicker, stamp slams at midpoint
        tl.to(card1, { x: 0, opacity: 1, duration: 0.4 }, 0.02)
          .to(
            redacts.filter((el) => el.dataset.case === '0'),
            { opacity: 1, stagger: 0.04, duration: 0.08 },
            0.32,
          )
          .to(
            stamp1,
            { scale: 1, rotation: -8, opacity: 0.92, duration: 0.07, ease: 'back.out(2.2)' },
            0.42,
          )
          // case 2 repeats the pattern
          .to(card2, { x: 0, opacity: 1, duration: 0.4 }, 0.52)
          .to(
            redacts.filter((el) => el.dataset.case === '1'),
            { opacity: 1, stagger: 0.04, duration: 0.08 },
            0.8,
          )
          .to(
            stamp2,
            { scale: 1, rotation: -8, opacity: 0.92, duration: 0.07, ease: 'back.out(2.2)' },
            0.9,
          );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-tarmac-950">
      <div className="grain-night" aria-hidden />
      <div className="relative flex min-h-[100dvh] items-center py-24">
        <div className="mx-auto w-full max-w-[1180px] px-6">
          <p className="label text-glow-amber">EXHIBITS B &amp; C · PRECEDENT</p>
          <h2 className="h1 mt-4 text-fog-100">The case files.</h2>
          <p className="body mt-4 max-w-[54ch] text-fog-300">
            Two rulings every IAA prompter should know by tail number. Scroll to walk the
            evidence across the scope.
          </p>

          {/* dashed connector with advancing plane (desktop) */}
          <div ref={trackRef} className="relative mt-10 hidden h-6 lg:block" aria-hidden>
            <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-tarmac-700" />
            <div ref={planeRef} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Plane className="h-4 w-4 rotate-45 text-glow-amber" strokeWidth={1.5} />
            </div>
          </div>

          <div className="mt-6 grid gap-8 lg:mt-2 lg:grid-cols-2">
            {CASES.map((c, i) => (
              <div
                key={c.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="relative rounded-[6px] border border-tarmac-700 bg-tarmac-800 p-6 sm:p-8"
              >
                {/* mono case-number tab */}
                <p className="inline-block -translate-y-[41px] rounded-t-[2px] border border-b-0 border-tarmac-700 bg-tarmac-800 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-glow-red sm:-translate-y-[49px]">
                  {c.tab}
                </p>
                <h3 className="h3 -mt-6 text-fog-100">{c.title}</h3>
                <p className="small mt-4 leading-relaxed text-fog-300">{c.body}</p>
                {/* redacted-document bars */}
                <div className="mt-4 space-y-2" aria-hidden>
                  {c.redacted.map((bar, j) => (
                    <p
                      key={j}
                      data-case={i}
                      ref={(el) => {
                        redactRefs.current[i * 2 + j] = el;
                      }}
                      className="select-none font-mono text-[13px] tracking-widest text-fog-500/50"
                    >
                      {bar}
                    </p>
                  ))}
                </div>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-fog-500">
                  {c.source}
                </p>

                {/* verdict stamp — GSAP-driven on desktop, at rest otherwise */}
                <div
                  ref={(el) => {
                    stampRefs.current[i] = el;
                  }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-90"
                >
                  <div className="rounded-[4px] border-[3px] border-glow-red p-1.5 [transform:rotate(-8deg)]">
                    <span className="block rounded-[2px] border-2 border-glow-red px-5 py-2 font-mono text-xl font-semibold uppercase tracking-[0.14em] text-glow-red">
                      {c.stamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
