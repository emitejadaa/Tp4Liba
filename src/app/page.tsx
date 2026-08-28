'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
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
import type { RegistrationKind } from '@/lib/validation';

/*
 * El formulario de inscripción sólo aparece al tocar un CTA, así que su código
 * —y el del diálogo, la validación y los campos— se baja recién la primera vez
 * que se abre, en lugar de viajar en la carga inicial de la página.
 */
const RegistrationModal = dynamic(() =>
  import('@/components/sections/RegistrationModal').then((m) => m.RegistrationModal),
);

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

      {/* Sin haber abierto nunca el diálogo no hace falta ni pedir su código. */}
      {modal.seq > 0 ? (
        <RegistrationModal
          key={modal.seq}
          open={modal.open}
          kind={modal.kind}
          tier={modal.tier}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
