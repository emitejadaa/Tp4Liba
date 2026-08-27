'use client';

import { motion } from 'motion/react';
import { Section } from '@/components/ui/Section';
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
    <Section id="torneo" aria-labelledby="torneo-titulo">
      <SectionHeading id="torneo-titulo" aside="Temporada 2026">
        El torneo
      </SectionHeading>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TOURNAMENT_FACTS.map(({ index, title, description, Icon }, position) => (
          <motion.li
            key={title}
            className="group bg-ink-raised border-line-card hover:border-orange relative flex flex-col rounded-xl border p-[29px] transition-colors duration-300"
            initial={prefersReduced ? undefined : { opacity: 0, y: 24 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: position * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={prefersReduced ? undefined : { y: -6 }}
          >
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
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}
