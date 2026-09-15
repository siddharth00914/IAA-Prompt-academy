import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { clearProgressMemory } from '@/lib/progress';
import { cn } from '@/lib/utils';

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
 */
export default function AuthControls({ variant = 'desktop', onNavigate }: AuthControlsProps) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const isMobile = variant === 'mobile';

  if (isPending) {
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

  if (!session?.user) {
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

  const identity = displayIdentity(session.user);

  const onSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
      clearProgressMemory();
      onNavigate?.();
      navigate('/login', { replace: true });
    } catch {
      setSigningOut(false);
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog-500">CREW ON DUTY</p>
        <p className="truncate font-mono text-[15px] font-semibold tracking-[0.04em] text-fog-100">
          {identity}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          aria-busy={signingOut}
          className="self-start rounded-[2px] border border-tarmac-700 px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-fog-100 transition-colors hover:border-glow-amber hover:text-glow-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span
        className="flex max-w-[160px] items-center gap-2 truncate rounded-full border border-line bg-paper-dim px-3 py-1.5"
        title={identity}
      >
        <User className="h-3.5 w-3.5 shrink-0 text-ink-500" strokeWidth={1.5} aria-hidden />
        <span className="truncate font-mono text-[12px] font-semibold tracking-wide text-ink-900">
          {identity}
        </span>
      </span>
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        aria-busy={signingOut}
        className="rounded-[2px] border border-line px-2.5 py-1.5 font-sans text-[12px] font-bold uppercase tracking-wide text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  );
}
