import { useEffect } from 'react';
import NotCleared from '@/components/extras/arrival/NotCleared';
import S1ArrivalHero from '@/components/extras/arrival/S1ArrivalHero';
import S2Certificate from '@/components/extras/arrival/S2Certificate';
import S3FlightLog from '@/components/extras/arrival/S3FlightLog';
import S4KeepFlying from '@/components/extras/arrival/S4KeepFlying';
import { canCertify, certify, isCertified, useProgress } from '@/lib/progress';

/**
 * Certificate — Arrival (certificate.md). The full certificate is gated
 * behind canCertify(); everyone else gets the elegant holding pattern with
 * exactly what's missing. Touching down with the requirements met finalizes
 * certification (certify() is idempotent and stamps the completion time
 * that the deterministic cert ID derives from).
 */
export default function Arrival() {
  useProgress(); // subscribe so certify()/progress changes re-render
  const allowed = canCertify();

  useEffect(() => {
    if (allowed && !isCertified()) certify();
  }, [allowed]);

  if (!allowed) return <NotCleared />;

  return (
    <div className="bg-paper">
      <S1ArrivalHero />
      <S2Certificate />
      <S3FlightLog />
      <S4KeepFlying />
    </div>
  );
}
