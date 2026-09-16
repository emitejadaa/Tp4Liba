'use client';

import type { CSSProperties } from 'react';
import { Section } from '@/components/ui/Section';
import { TiltCard } from '@/components/ui/TiltCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TOURNAMENT_FACTS } from '@/data/tournament';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * «El torneo»: las cuatro tarjetas con las reglas básicas de la liga.
 *
 * Es el acto clavado de la página. La sección se queda quieta en pantalla
 * mientras se scrollea, y lo que avanza adentro es el mazo: las cuatro tarjetas
 * arrancan apiladas en profundidad, una atrás de la otra y giradas hacia afuera,
 * y se acomodan en su grilla de a una.
 *
 * Toda la cuenta vive en CSS —la utilidad `.deck-card` de `globals.css` lee el
 * avance que el motor de scroll-craft publica en el `<section>`— así que son
 * cuatro tarjetas moviéndose en 3D sin una línea de JavaScript por cuadro.
 *
 * En desktop van en una grilla de cuatro columnas como en el diseño; al angostar
 * la pantalla el diseño las resuelve como una lista numerada 01–04, y el número
 * de orden aparece recién en ese punto.
 */

/** Estilo con las variables que lee `.deck-card`. */
type DeckStyle = CSSProperties & {
  '--i': number;
  '--deck-x': string;
  '--deck-turn': string;
};

export function TournamentInfo() {
  const prefersReduced = useReducedMotion();

  return (
    <Section
      id="torneo"
      aria-labelledby="torneo-titulo"
      act="pin"
      span={2}
      mark="circle"
      drift="#081420"
      spotlight
    >
      <SectionHeading id="torneo-titulo" aside="Temporada 2026">
        El torneo
      </SectionHeading>

      {/* La perspectiva es de la grilla: compartida, las cuatro tarjetas giran
          contra un mismo punto de fuga y el mazo se lee como un objeto. */}
      <ul
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
      >
        {TOURNAMENT_FACTS.map(({ index, title, description, Icon }, position) => (
          <li
            key={title}
            className="deck-card group"
            style={
              {
                '--i': position,
                // Salen desde el costado hacia el que están, así el mazo se abre
                // en abanico en vez de desplegarse siempre para el mismo lado.
                '--deck-x': `${(position - 1.5) * 34}px`,
                '--deck-turn': `${position < 2 ? 20 : -20}deg`,
              } as DeckStyle
            }
          >
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
          </li>
        ))}
      </ul>
    </Section>
  );
}
