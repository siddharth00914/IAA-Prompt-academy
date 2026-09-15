import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import TaxiwayLoader from '@/components/TaxiwayLoader';
import { authClient } from '@/lib/auth-client';

const GENERIC_ERROR = 'Unable to sign in. Check your email and password, then try again.';

type LocationState = {
  from?: {
    pathname: string;
    search?: string;
    hash?: string;
  };
};

function safeReturnPath(from: LocationState['from']): string {
  if (!from?.pathname) return '/journey';
  const path = `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
  if (!path.startsWith('/') || path.startsWith('//')) return '/journey';
  if (path === '/login' || path.startsWith('/login?')) return '/journey';
  return path;
}

/**
 * Learner login — Day Ops boarding desk. Email/password via Better Auth;
 * successful or already-authenticated sessions return to the requested page
 * (or /journey by default).
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeReturnPath((location.state as LocationState | null)?.from);
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <section className="bg-paper">
        <div className="mx-auto flex min-h-[60vh] max-w-[1180px] items-center justify-center px-6 py-24">
          <TaxiwayLoader label="CHECKING MANIFEST" />
        </div>
      </section>
    );
  }

  if (session?.user) {
    return <Navigate to={returnTo} replace />;
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(GENERIC_ERROR);
        return;
      }
      navigate(returnTo, { replace: true });
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-paper">
      <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-start justify-center px-6 py-24">
        <p className="label text-amber-600">BOARDING DESK</p>
        <h1 className="h1 mt-4 text-ink-900">Sign in to continue</h1>
        <p className="body mt-4 text-ink-700">
          Present your credentials to resume your journey through the Prompt Academy.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 w-full max-w-md rounded-[6px] border border-line bg-paper-bright p-6 shadow-card"
          noValidate
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label text-ink-500">
                Email
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
                className="mt-2 w-full rounded-[2px] border border-line bg-paper px-3 py-2.5 font-sans text-[16px] text-ink-900 placeholder:text-ink-300 focus:border-amber-500 focus:outline-none focus:shadow-glow-ring disabled:opacity-60"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label text-ink-500">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-[2px] border border-line bg-paper px-3 py-2.5 font-sans text-[16px] text-ink-900 placeholder:text-ink-300 focus:border-amber-500 focus:outline-none focus:shadow-glow-ring disabled:opacity-60"
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-[2px] border border-signal-500/40 bg-signal-500/10 px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-signal-600"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}
