'use client';

import { useCallback, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { SiteNav } from '@/components/layout/SiteNav';
import { ContactCta } from '@/components/sections/ContactCta';
import { Hero } from '@/components/sections/Hero';
import { Minigame } from '@/components/sections/Minigame';
import { RegistrationModal } from '@/components/sections/RegistrationModal';
import { Rules } from '@/components/sections/Rules';
import { Schedule } from '@/components/sections/Schedule';
import { Sponsors } from '@/components/sections/Sponsors';
import { Standings } from '@/components/sections/Standings';
import { TournamentInfo } from '@/components/sections/TournamentInfo';
import { Venue } from '@/components/sections/Venue';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import type { RegistrationKind } from '@/lib/validation';

type ModalState = { open: boolean; kind: RegistrationKind; tier?: string; seq: number };

export default function Home() {
  const [modal, setModal] = useState<ModalState>({ open: false, kind: 'equipo', seq: 0 });

  // `seq` sube en cada apertura y se usa como `key` del diálogo, para que el
  // formulario se monte limpio sin resetear estado desde un efecto.
  const openTeam = useCallback(
    () => setModal((current) => ({ open: true, kind: 'equipo', seq: current.seq + 1 })),
    [],
  );
  const openSponsor = useCallback(
    (tier: string) =>
      setModal((current) => ({ open: true, kind: 'sponsor', tier, seq: current.seq + 1 })),
    [],
  );
  const closeModal = useCallback(() => setModal((current) => ({ ...current, open: false })), []);

  return (
    <>
      <ScrollProgress />
      <SiteNav onRegister={openTeam} />
      <main>
        <Hero onRegister={openTeam} />
        <TournamentInfo />
        <Minigame />
        <Sponsors onSponsor={openSponsor} />
        <Standings />
        <Schedule />
        <Rules />
        <Venue />
        <ContactCta />
      </main>
      <Footer />

      <RegistrationModal
        key={modal.seq}
        open={modal.open}
        kind={modal.kind}
        tier={modal.tier}
        onClose={closeModal}
      />
    </>
  );
}
