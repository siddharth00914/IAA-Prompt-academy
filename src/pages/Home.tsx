import S1Hero from '@/sections/home/S1Hero';
import S2FlightPlan from '@/sections/home/S2FlightPlan';
import S3Why from '@/sections/home/S3Why';
import S4HowItWorks from '@/sections/home/S4HowItWorks';
import S5Demo from '@/sections/home/S5Demo';
import S6SafetyStrip from '@/sections/home/S6SafetyStrip';
import S7Voices from '@/sections/home/S7Voices';
import S8BoardingCta from '@/sections/home/S8BoardingCta';

/** Landing page (home.md): Day Ops with one Night Ops safety strip (S6). */
export default function Home() {
  return (
    <>
      <S1Hero />
      <S2FlightPlan />
      <S3Why />
      <S4HowItWorks />
      <S5Demo />
      <S6SafetyStrip />
      <S7Voices />
      <S8BoardingCta />
    </>
  );
}
