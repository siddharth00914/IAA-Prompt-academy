import S1RadarHero from '@/components/extras/safety/S1RadarHero';
import S2ConfidentlyWrong from '@/components/extras/safety/S2ConfidentlyWrong';
import S3CaseFiles from '@/components/extras/safety/S3CaseFiles';
import S4NeverTransmit from '@/components/extras/safety/S4NeverTransmit';
import S5HouseRules from '@/components/extras/safety/S5HouseRules';
import S6Pledge from '@/components/extras/safety/S6Pledge';
import S7FooterBridge from '@/components/extras/safety/S7FooterBridge';

/**
 * Safety — Responsible AI at a Public Airport (safety.md). The only fully
 * Night Ops page: the radar room. Open to everyone regardless of progress.
 */
export default function Safety() {
  return (
    <div className="bg-tarmac-950">
      <S1RadarHero />
      <S2ConfidentlyWrong />
      <S3CaseFiles />
      <S4NeverTransmit />
      <S5HouseRules />
      <S6Pledge />
      <S7FooterBridge />
    </div>
  );
}
