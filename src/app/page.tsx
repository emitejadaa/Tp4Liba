'use client';

import { Hero } from '@/components/sections/Hero';
import { SiteNav } from '@/components/layout/SiteNav';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main>
        <Hero />
      </main>
    </>
  );
}
