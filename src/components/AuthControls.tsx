import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GraduationCap, ShieldCheck, User } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useAdminAccess } from '@/lib/admin';
import { useAdminViewSwitcher } from '@/lib/admin-view';
import { clearProgressMemory } from '@/lib/progress';
import { cn } from '@/lib/utils';

const SIGNOUT_ERROR = 'Unable to sign out. Check your connection, then try again.';

type AuthControlsProps = {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

function displayIdentity(user: { name?: string | null; email?: string | null }): string {
  const name = user.name?.trim();
  if (name) return name;
  return user.email?.trim() || 'Signed in';
}

/**
 * Navbar auth cluster — Sign In when signed out; identity + Sign Out when signed in.
 * IT Admins get Academy ↔ Admin Dashboard switch controls.
 */
export default function AuthControls({ variant = 'desktop', onNavigate }: AuthControlsProps) {
  const navigate = useNavigate();
  const { data: session, isPending, isSigningOut } = authClient.useSession();
  const { status: adminStatus } = useAdminAccess();
  const { isAuthorizedAdmin, isLearnerView, goLearnerAcademy, goAdminDashboard } =
    useAdminViewSwitcher();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const isMobile = variant === 'mobile';
  const signOutInFlight = signingOut || isSigningOut;

  const onSignOut = async () => {
    if (inFlightRef.current || signOutInFlight) return;
    inFlightRef.current = true;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await authClient.signOut();
      clearProgressMemory();
      onNavigate?.();
      navigate('/login', { replace: true });
    } catch {
      setSignOutError(SIGNOUT_ERROR);
    } finally {
      inFlightRef.current = false;
      setSigningOut(false);
    }
  };

  if (isPending && !signOutInFlight) {
    return (
      <span
        className={cn(
          isMobile
            ? 'font-mono text-[12px] uppercase tracking-[0.14em] text-fog-500'
            : 'hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500 sm:inline',
        )}
        aria-hidden
      >
        …
      </span>
    );
  }

  if (!session?.user && !signOutInFlight) {
    return (
      <Link
        to="/login"
        onClick={onNavigate}
        className={cn(
          isMobile
            ? 'inline-flex items-center font-mono text-[15px] font-semibold uppercase tracking-[0.08em] text-glow-amber transition-colors hover:text-fog-100'
            : 'inline-flex items-center px-1 py-2 font-sans text-[14px] font-bold uppercase tracking-wide text-ink-700 transition-colors hover:text-ink-900',
        )}
      >
        Sign In
      </Link>
    );
  }

  const identity = session?.user ? displayIdentity(session.user) : 'Signed in';
  const isItAdmin = adminStatus === 'authorized';
  const clearancePending = adminStatus === 'loading';

  const onAcademy = () => {
    goLearnerAcademy();
    onNavigate?.();
  };

  const onAdmin = () => {
    goAdminDashboard();
    onNavigate?.();
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {isItAdmin ? (
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Admin view switcher">
            <button
              type="button"
              role="radio"
              onClick={onAcademy}
              aria-checked={isLearnerView}
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-[2px] border px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors',
                isLearnerView
                  ? 'border-glow-amber bg-glow-amber/10 text-glow-amber'
                  : 'border-tarmac-700 text-fog-100 hover:border-glow-amber hover:text-glow-amber',
              )}
            >
              <GraduationCap className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Academy
            </button>
            <button
              type="button"
              role="radio"
              onClick={onAdmin}
              aria-checked={!isLearnerView}
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-[2px] border px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors',
                !isLearnerView
                  ? 'border-glow-amber bg-glow-amber/10 text-glow-amber'
                  : 'border-tarmac-700 text-fog-100 hover:border-glow-amber hover:text-glow-amber',
              )}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Admin
            </button>
          </div>
        ) : clearancePending || signOutInFlight ? null : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">CREW ON DUTY</p>
            <p className="truncate font-mono text-[15px] font-semibold tracking-[0.04em] text-fog-100">
              {identity}
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() => void onSignOut()}
          disabled={signOutInFlight}
          aria-busy={signOutInFlight}
          className="self-start rounded-[2px] border border-tarmac-700 px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-fog-100 transition-colors hover:border-glow-amber hover:text-glow-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {signOutInFlight ? 'Signing out…' : 'Sign Out'}
        </button>
        {signOutError ? (
          <p
            role="alert"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-signal-500"
          >
            {signOutError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      {isAuthorizedAdmin ? (
        <div
          className="inline-flex items-center rounded-[2px] border border-line p-0.5"
          role="radiogroup"
          aria-label="Switch between Academy and Admin Dashboard"
        >
          <button
            type="button"
            role="radio"
            onClick={onAcademy}
            aria-checked={isLearnerView}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 font-sans text-[12px] font-bold uppercase tracking-wide transition-colors',
              isLearnerView
                ? 'bg-amber-100 text-amber-800'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Academy
          </button>
          <button
            type="button"
            role="radio"
            onClick={onAdmin}
            aria-checked={!isLearnerView}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 font-sans text-[12px] font-bold uppercase tracking-wide transition-colors',
              !isLearnerView
                ? 'bg-amber-100 text-amber-800'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Admin
          </button>
        </div>
      ) : clearancePending || signOutInFlight ? null : (
        <span
          className="flex max-w-[160px] items-center gap-2 truncate rounded-full border border-line bg-paper-dim px-3 py-1.5"
          title={identity}
        >
          <User className="h-3.5 w-3.5 shrink-0 text-ink-500" strokeWidth={1.5} aria-hidden />
          <span className="truncate font-mono text-[12px] font-semibold tracking-wide text-ink-900">
            {identity}
          </span>
        </span>
      )}
      <button
        type="button"
        onClick={() => void onSignOut()}
        disabled={signOutInFlight}
        aria-busy={signOutInFlight}
        className="rounded-[2px] border border-line px-2.5 py-1.5 font-sans text-[12px] font-bold uppercase tracking-wide text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {signOutInFlight ? 'Signing out…' : 'Sign Out'}
      </button>
      {signOutError ? (
        <p
          role="alert"
          className="max-w-[14rem] font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-signal-600"
        >
          {signOutError}
        </p>
      ) : null}
    </div>
  );
}
