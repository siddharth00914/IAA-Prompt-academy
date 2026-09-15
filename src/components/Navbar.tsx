import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lock, Menu, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgress, isGateUnlocked } from '@/lib/progress';
import SplitFlap from '@/components/SplitFlap';

export const NAV_HEIGHT = 64; // px — Layout owns the matching top offset

export const GATES_NAV = [
  { id: 'g0', number: 'G0', title: 'Welcome Aboard' },
  { id: 'g1', number: 'G1', title: 'Clearance for Takeoff' },
  { id: 'g2', number: 'G2', title: 'Flight Crew Roles' },
  { id: 'g3', number: 'G3', title: 'Navigation by Examples' },
  { id: 'g4', number: 'G4', title: 'On the Job at IND' },
  { id: 'g5', number: 'G5', title: 'Safety & Security of AI' },
] as const;

const CENTER_LINKS = [
  { to: '/journey', label: 'Journey' },
  { to: '/lab', label: 'Prompt Lab' },
  { to: '/safety', label: 'Safety' },
  { to: '/manual', label: 'Flight Manual' },
] as const;

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative px-1 py-2 font-sans text-[14px] font-bold uppercase tracking-wide transition-colors',
    isActive
      ? 'text-amber-600 after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-amber-500'
      : 'text-ink-700 hover:text-ink-900',
  );
}

/**
 * Navbar (design.md §6): fixed top, paper/92% blur, 1px bottom line.
 * Layout owns the content offset (pt-16) — pages must not add their own.
 */
export default function Navbar() {
  const progress = useProgress();
  const location = useLocation();
  const [gatesOpen, setGatesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // close dropdown on outside click / escape
  useEffect(() => {
    if (!gatesOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGatesOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGatesOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [gatesOpen]);

  // close overlays on route change (state adjusted during render, per React docs)
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
    setGatesOpen(false);
  }

  // lock body scroll while mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // mobile menu a11y: focus trap + Escape-to-close + focus restore
  useEffect(() => {
    if (!mobileOpen) return;
    const menu = mobileMenuRef.current;
    if (!menu) return;
    const restoreTo = menuButtonRef.current ?? (document.activeElement as HTMLElement | null);

    const focusables = () =>
      Array.from(
        menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.getClientRects().length > 0);

    // move focus into the dialog on open
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setMobileOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !menu.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !menu.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      restoreTo?.focus();
    };
  }, [mobileOpen]);

  const gatesActive = location.pathname.startsWith('/gates');

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between gap-4 px-6">
          {/* brand */}
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="IAA Prompt Academy — home">
            <img src="/logo-iaa-academy.svg" alt="" className="h-8 w-8 shrink-0" />
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="truncate font-sans text-[15px] font-extrabold leading-none tracking-tight text-ink-900">
                IAA PROMPT ACADEMY
              </span>
              <span className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                Presented by Winthrop-Tech
              </span>
            </span>
          </Link>

          {/* center links */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            <NavLink to="/journey" className={navLinkClass}>
              Journey
            </NavLink>

            {/* Gates dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setGatesOpen((o) => !o)}
                aria-expanded={gatesOpen}
                aria-haspopup="true"
                className={cn(
                  'relative flex items-center gap-1 px-1 py-2 font-sans text-[14px] font-bold uppercase tracking-wide transition-colors',
                  gatesActive ? 'text-amber-600' : 'text-ink-700 hover:text-ink-900',
                )}
              >
                Gates
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', gatesOpen && 'rotate-180')}
                  strokeWidth={1.5}
                  aria-hidden
                />
                {gatesActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] bg-amber-500" aria-hidden />
                ) : null}
              </button>
              <AnimatePresence>
                {gatesOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full z-50 mt-2 w-[300px] -translate-x-1/2 overflow-hidden rounded-[6px] border border-line bg-paper-bright shadow-modal"
                  >
                    {GATES_NAV.map((g, i) => {
                      const unlocked = isGateUnlocked(i);
                      return (
                        <Link
                          key={g.id}
                          to={`/gates/${g.id}`}
                          className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 transition-colors last:border-0 hover:bg-amber-100"
                        >
                          <span className="font-mono text-[13px] font-semibold text-amber-600">{g.number}</span>
                          <span className="min-w-0 flex-1 truncate font-sans text-[14px] font-semibold text-ink-900">
                            {g.title}
                          </span>
                          {!unlocked ? (
                            <Lock className="h-3.5 w-3.5 shrink-0 text-ink-500" strokeWidth={1.5} aria-label="Locked" />
                          ) : null}
                        </Link>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {CENTER_LINKS.slice(1).map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* right cluster */}
          <div className="flex items-center gap-3">
            <Link
              to="/journey"
              className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5"
              aria-label={`${progress.miles} miles — open your journey`}
            >
              <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500 animate-taxiway-blink motion-reduce:animate-none" />
              <span className="font-mono text-[13px] font-semibold tracking-wide text-ink-900">
                {progress.miles} MILES
              </span>
            </Link>
            <span
              className="hidden h-8 w-8 items-center justify-center rounded-full border border-line bg-paper-dim sm:flex"
              aria-label="IAA staff member"
              title="IAA staff member"
            >
              <User className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
            </span>
            <button
              ref={menuButtonRef}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-line text-ink-900 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* mobile full-screen departures-board menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex flex-col bg-tarmac-950 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="grain-night" aria-hidden />
            <div className="relative flex h-16 items-center justify-between border-b border-tarmac-700 px-6">
              <div className="flex items-center gap-3">
                <img src="/logo-iaa-academy.svg" alt="" className="h-8 w-8" />
                <span className="font-sans text-[15px] font-extrabold text-fog-100">DEPARTURES</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-tarmac-700 text-fog-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="relative flex-1 overflow-y-auto px-6 py-6" aria-label="Mobile">
              {[
                { to: '/', label: 'HOME' },
                { to: '/journey', label: 'JOURNEY' },
                { to: '/lab', label: 'PROMPT LAB' },
                { to: '/safety', label: 'SAFETY' },
                { to: '/manual', label: 'FLIGHT MANUAL' },
              ].map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-baseline gap-4 border-b border-tarmac-800 py-4"
                >
                  <span className="font-mono text-[12px] text-fog-500">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-2xl font-semibold tracking-[0.08em] text-fog-100">
                    <SplitFlap text={l.label} startDelay={150 + i * 90} stagger={35} />
                  </span>
                  <span className="ml-auto font-mono text-glow-amber">→</span>
                </Link>
              ))}
              <p className="label mt-8 text-fog-500">GATES</p>
              {GATES_NAV.map((g, i) => (
                <Link
                  key={g.id}
                  to={`/gates/${g.id}`}
                  className="flex items-baseline gap-4 border-b border-tarmac-800 py-3"
                >
                  <span className="font-mono text-[13px] font-semibold text-glow-amber">{g.number}</span>
                  <span className="font-mono text-[15px] uppercase tracking-[0.08em] text-fog-300">
                    <SplitFlap text={g.title.toUpperCase()} startDelay={600 + i * 80} stagger={20} />
                  </span>
                  {!isGateUnlocked(i) ? (
                    <Lock className="ml-auto h-3.5 w-3.5 text-fog-500" strokeWidth={1.5} aria-label="Locked" />
                  ) : null}
                </Link>
              ))}
            </nav>
            <div className="relative border-t border-tarmac-700 px-6 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">
                {progress.miles} MILES · PRESENTED BY WINTHROP-TECH
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
