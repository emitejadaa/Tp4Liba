'use client';

import { SiteNav } from '@/components/layout/SiteNav';
import { Hero } from '@/components/sections/Hero';
import { Schedule } from '@/components/sections/Schedule';
import { Sponsors } from '@/components/sections/Sponsors';
import { Standings } from '@/components/sections/Standings';
import { TournamentInfo } from '@/components/sections/TournamentInfo';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main>
        <Hero />
        <TournamentInfo />
        <Sponsors />
        <Standings />
        <Schedule />
      </main>
    </>
  );
}
