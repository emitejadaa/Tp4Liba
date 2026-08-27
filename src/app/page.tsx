'use client';

import { SiteNav } from '@/components/layout/SiteNav';
import { Hero } from '@/components/sections/Hero';
import { Sponsors } from '@/components/sections/Sponsors';
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
      </main>
    </>
  );
}
