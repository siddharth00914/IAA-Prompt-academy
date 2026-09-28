import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { useToast } from '@/components/Toast';
import { NAV_HEIGHT } from '@/components/Navbar';
import { useAdminAccess } from '@/lib/admin';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const GENERIC_SIGN_IN_ERROR = 'Unable to sign in. Check your email and password, then try again.';
const GENERIC_SIGN_UP_ERROR = 'Unable to create that account. Check your details, then try again.';
const PASSWORD_MISMATCH = 'Passwords do not match.';
const INVALID_EMAIL = 'Enter a valid work email address.';
const REQUIRED_FIRST = 'First name is required.';
const REQUIRED_LAST = 'Last name is required.';
const REQUIRED_EMAIL = 'Work email is required.';
const REQUIRED_PASSWORD = 'Password is required.';
const WEAK_PASSWORD =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';
const MIN_PASSWORD_LENGTH = 8;
const LOGIN_BG = '/images/iaa-login-airport-bg.png';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = 'signin' | 'signup';

type LocationState = {
  from?: {
    pathname: string;
    search?: string;
    hash?: string;
  };
};

type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

function safeReturnPath(from: LocationState['from']): string {
  if (!from?.pathname) return '/journey';
  const path = `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
  if (!path.startsWith('/') || path.startsWith('//')) return '/journey';
  if (path === '/login' || path.startsWith('/login?')) return '/journey';
  return path;
}

function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function isPasswordStrong(checks: PasswordChecks): boolean {
  return checks.length && checks.upper && checks.lower && checks.number && checks.special;
}

function passwordStrengthMeta(checks: PasswordChecks): {
  score: number;
  label: string;
  barClass: string;
} {
  const score = [checks.length, checks.upper, checks.lower, checks.number, checks.special].filter(
    Boolean,
  ).length;
  if (score <= 2) return { score, label: 'Weak', barClass: 'bg-signal-500' };
  if (score <= 4) return { score, label: 'Fair', barClass: 'bg-amber-500' };
  return { score, label: 'Strong', barClass: 'bg-field-500' };
}

const inputClassName =
  'mt-1.5 w-full rounded-[4px] border border-line bg-paper-bright/90 px-3 py-2 font-sans text-[15px] text-ink-900 placeholder:text-ink-300 focus:border-amber-500 focus:outline-none focus:shadow-glow-ring disabled:opacity-60';

const passwordInputClassName = `${inputClassName} pr-11`;

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete: string;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label text-ink-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={passwordInputClassName}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => setVisible((open) => !open)}
          disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-[calc(0.375rem+1px)] inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-ink-500 transition-colors hover:text-ink-900 focus:outline-none focus:shadow-glow-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const meta = passwordStrengthMeta(checks);
  const requirements = [
    { ok: checks.length, label: '8+ characters' },
    { ok: checks.upper, label: 'Uppercase' },
    { ok: checks.lower, label: 'Lowercase' },
    { ok: checks.number, label: 'Number' },
    { ok: checks.special, label: 'Special character' },
  ] as const;

  return (
    <div id="password-strength" className="mt-2 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-1.5 flex-1 grid-cols-5 gap-1" aria-hidden>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={cn(
                'rounded-full',
                index < meta.score ? meta.barClass : 'bg-line',
              )}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {password ? meta.label : 'Strength'}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
        {requirements.map((item) => (
          <li
            key={item.label}
            className={cn(
              'font-mono text-[10px] font-semibold uppercase tracking-[0.08em]',
              item.ok ? 'text-field-600' : 'text-ink-400',
            )}
          >
            {item.ok ? '✓' : '○'} {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoginShell({ children }: { children: ReactNode }) {
  return (
    <section
      className="relative flex w-full items-center overflow-hidden"
      style={{ minHeight: `calc(100dvh - ${NAV_HEIGHT}px)` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${LOGIN_BG})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink-900/45 via-ink-900/20 to-transparent md:from-ink-900/25 md:via-paper/10 md:to-transparent"
      />
      <div aria-hidden className="absolute inset-0 bg-paper/35 md:bg-paper/10" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-center px-4 py-8 md:justify-start md:px-8 md:py-10 lg:px-10">
        {children}
      </div>
    </section>
  );
}

/**
 * Login — airport boarding desk. Email/password via Firebase Auth.
 * Learners can create their own account, then continue to /journey.
 * IT Admin accounts go to /admin.
 */
export default function Login() {
  const location = useLocation();
  const returnTo = safeReturnPath((location.state as LocationState | null)?.from);
  const { showToast } = useToast();
  const { data: session, isPending, isSigningOut } = authClient.useSession();
  const { status: adminStatus } = useAdminAccess();
  const [mode, setMode] = useState<Mode>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSigningOut || isPending || (session?.user && adminStatus === 'loading')) {
    return (
      <LoginShell>
        <div className="flex w-full max-w-md justify-center rounded-[12px] border border-line/60 bg-paper-bright/90 px-6 py-16 shadow-card backdrop-blur-sm">
          <TaxiwayLoader label="CHECKING MANIFEST" />
        </div>
      </LoginShell>
    );
  }

  if (session?.user) {
    if (adminStatus === 'authorized') {
      const dest = returnTo === '/admin' || returnTo.startsWith('/admin/') ? returnTo : '/admin';
      return <Navigate to={dest} replace />;
    }
    return <Navigate to={returnTo} replace />;
  }

  const switchMode = (next: Mode) => {
    if (next === mode || submitting) return;
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (mode === 'signup') {
      if (!trimmedFirst) {
        setError(REQUIRED_FIRST);
        return;
      }
      if (!trimmedLast) {
        setError(REQUIRED_LAST);
        return;
      }
      if (!trimmedEmail) {
        setError(REQUIRED_EMAIL);
        return;
      }
      if (!EMAIL_PATTERN.test(trimmedEmail)) {
        setError(INVALID_EMAIL);
        return;
      }
      if (!password) {
        setError(REQUIRED_PASSWORD);
        return;
      }
      if (!isPasswordStrong(getPasswordChecks(password))) {
        setError(WEAK_PASSWORD);
        return;
      }
      if (password !== confirmPassword) {
        setError(PASSWORD_MISMATCH);
        return;
      }
    } else if (!trimmedEmail || !password) {
      setError(GENERIC_SIGN_IN_ERROR);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await authClient.signUp.email({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: trimmedEmail,
          password,
        });
        if (signUpError) {
          setError(signUpError.message || GENERIC_SIGN_UP_ERROR);
          return;
        }
        showToast('TOWER:', 'Account created. Welcome aboard.');
        return;
      }

      const { error: signInError } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(GENERIC_SIGN_IN_ERROR);
      }
    } catch {
      setError(mode === 'signup' ? GENERIC_SIGN_UP_ERROR : GENERIC_SIGN_IN_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <LoginShell>
      <form
        onSubmit={onSubmit}
        noValidate
        className={cn(
          'login-card w-full max-w-[440px] rounded-[12px] border border-line/70 bg-paper-bright/92 shadow-card backdrop-blur-md',
          isSignup ? 'p-5 sm:p-6' : 'p-6 sm:p-7',
        )}
      >
        <p className="label text-amber-600">BOARDING DESK</p>
        <h1 className={cn('text-ink-900', isSignup ? 'h3 mt-2' : 'h2 mt-3')}>
          {isSignup ? 'Create your account' : 'Welcome back, traveler'}
        </h1>
        <p className={cn('body text-ink-700', isSignup ? 'mt-2 text-[15px]' : 'mt-3')}>
          {isSignup
            ? 'Set up your credentials to begin your learning journey.'
            : 'Sign in to continue your learning journey.'}
        </p>

        <div className={cn('grid grid-cols-2 gap-2', isSignup ? 'mt-4' : 'mt-6')}>
          <button
            type="button"
            onClick={() => switchMode('signin')}
            disabled={submitting}
            aria-pressed={!isSignup}
            className={cn(
              'rounded-[4px] px-3 py-2 font-sans text-[12px] font-bold uppercase tracking-wide transition-colors disabled:opacity-60',
              isSignup
                ? 'border border-line text-ink-600 hover:border-ink-900 hover:text-ink-900'
                : 'border border-amber-500/60 bg-amber-500/10 text-amber-800',
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            disabled={submitting}
            aria-pressed={isSignup}
            className={cn(
              'rounded-[4px] px-3 py-2 font-sans text-[12px] font-bold uppercase tracking-wide transition-colors disabled:opacity-60',
              isSignup
                ? 'border border-amber-500/60 bg-amber-500/10 text-amber-800'
                : 'border border-line text-ink-600 hover:border-ink-900 hover:text-ink-900',
            )}
          >
            Create account
          </button>
        </div>

        <div className={cn(isSignup ? 'mt-4 space-y-3.5' : 'mt-5 space-y-4')}>
          {isSignup ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-3">
              <div>
                <label htmlFor="login-first-name" className="label text-ink-500">
                  First name
                </label>
                <input
                  id="login-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                  placeholder="First"
                />
              </div>
              <div>
                <label htmlFor="login-last-name" className="label text-ink-500">
                  Last name
                </label>
                <input
                  id="login-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                  placeholder="Last"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="login-email" className="label text-ink-500">
              {isSignup ? 'Work email' : 'Email'}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <PasswordField
              key={`password-${mode}`}
              id="login-password"
              label="Password"
              value={password}
              onChange={setPassword}
              disabled={submitting}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              describedBy={isSignup ? 'password-strength' : undefined}
            />
            {isSignup ? <PasswordStrength password={password} /> : null}
          </div>

          {isSignup ? (
            <PasswordField
              key="confirm-password"
              id="login-confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={submitting}
              autoComplete="new-password"
            />
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-[4px] border border-signal-500/40 bg-signal-500/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-signal-600"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting
            ? isSignup
              ? 'Creating account…'
              : 'Signing in…'
            : isSignup
              ? 'Create account'
              : 'Sign in'}
        </button>

        {isSignup ? (
          <p className="mt-4 text-center font-sans text-[14px] text-ink-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signin')}
              disabled={submitting}
              className="font-bold text-amber-700 underline decoration-amber-500/40 underline-offset-2 transition-colors hover:text-amber-800 focus:outline-none focus:shadow-glow-ring disabled:opacity-60"
            >
              Sign in
            </button>
          </p>
        ) : null}

        <p className="mt-4 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          Your progress syncs securely across devices.
        </p>
      </form>

      <style>{`
        @keyframes login-card-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card {
          animation: login-card-in 420ms ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .login-card {
            animation: none;
          }
        }
      `}</style>
    </LoginShell>
  );
}
