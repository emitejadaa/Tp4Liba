'use client';

import { Reveal3D } from '@/components/ui/Reveal3D';
import { Section } from '@/components/ui/Section';
import { TiltCard } from '@/components/ui/TiltCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TOURNAMENT_FACTS } from '@/data/tournament';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * «El torneo»: las cuatro tarjetas con las reglas básicas de la liga.
 *
 * En desktop van en una grilla de cuatro columnas como en el diseño; al angostar
 * la pantalla el diseño las resuelve como una lista numerada 01–04, y el número
 * de orden aparece recién en ese punto.
 */
export function TournamentInfo() {
  const prefersReduced = useReducedMotion();

  return (
    <Section id="torneo" aria-labelledby="torneo-titulo" depth>
      <SectionHeading id="torneo-titulo" aside="Temporada 2026">
        El torneo
      </SectionHeading>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TOURNAMENT_FACTS.map(({ index, title, description, Icon }, position) => (
          <Reveal3D as="li" key={title} className="group/tilt group" delay={position * 0.09}>
            <TiltCard className="bg-ink-raised border-line-card group-hover:border-orange relative flex h-full flex-col overflow-hidden rounded-xl border p-[29px] transition-colors duration-300">
              <span
                aria-hidden="true"
                className="font-display text-dim group-hover:text-orange absolute top-6 right-7 text-2xl font-bold transition-colors xl:hidden"
              >
                {index}
              </span>
              <Icon
                className={
                  'text-orange size-[30px] transition-transform duration-500 ' +
                  (prefersReduced ? '' : 'group-hover:scale-110 group-hover:rotate-12')
                }
              />
              <h3 className="mt-[14px] text-[26px] leading-none font-bold">{title}</h3>
              <p className="text-muted mt-[7px] text-base leading-[1.55]">{description}</p>
            </TiltCard>
          </Reveal3D>
        ))}
      </ul>
    </Section>
  );
}
