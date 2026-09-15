import type { ReactNode } from 'react';
import { Link } from 'react-router';
import TaxiwayLoader from '@/components/TaxiwayLoader';

/**
 * Minimal placeholder used by route stubs until the owning page agent ships
 * the real page. Kept deliberately simple — page agents replace the whole file.
 */
export default function Stub({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-paper">
      <div className="mx-auto flex min-h-[60vh] max-w-[1180px] flex-col items-start justify-center px-6 py-24">
        <p className="label text-amber-600">{label}</p>
        <h1 className="h1 mt-4 text-ink-900">{title}</h1>
        <div className="body mt-4 text-ink-700">{children}</div>
        <TaxiwayLoader label="HOLD SHORT — THIS PAGE IS ON FINAL APPROACH" className="mt-8" />
        <Link to="/" className="btn-ghost mt-10">
          ← Back to the terminal
        </Link>
      </div>
    </section>
  );
}
