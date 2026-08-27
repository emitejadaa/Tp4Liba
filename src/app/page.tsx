'use client';

import { Footer } from '@/components/layout/Footer';
import { SiteNav } from '@/components/layout/SiteNav';
import { ContactCta } from '@/components/sections/ContactCta';
import { Hero } from '@/components/sections/Hero';
import { Minigame } from '@/components/sections/Minigame';
import { Rules } from '@/components/sections/Rules';
import { Schedule } from '@/components/sections/Schedule';
import { Sponsors } from '@/components/sections/Sponsors';
import { Standings } from '@/components/sections/Standings';
import { TournamentInfo } from '@/components/sections/TournamentInfo';
import { Venue } from '@/components/sections/Venue';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main>
        <Hero />
        <TournamentInfo />
        <Minigame />
        <Sponsors />
        <Standings />
        <Schedule />
        <Rules />
        <Venue />
        <ContactCta />
      </main>
      <Footer />
    </>
  );
}
