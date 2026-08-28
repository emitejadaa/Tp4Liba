'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Reveal } from '@/components/ui/Reveal';
import { Reveal3D } from '@/components/ui/Reveal3D';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SCHEDULE } from '@/data/schedule';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Cronograma de la fecha 1.
 *
 * Cada cruce puede desplegar su boxscore. Como la temporada no arrancó todavía,
 * lo que se muestra es el detalle de cancha y horario más el aviso de que no hay
 * estadísticas cargadas: preferimos decirlo antes que inventar números.
 */
export function Schedule() {
  const [openId, setOpenId] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  return (
    <Section id="cronograma" aria-labelledby="cronograma-titulo" depth>
      <SectionHeading id="cronograma-titulo" aside={SCHEDULE.when}>
        Cronograma · {SCHEDULE.round}
      </SectionHeading>

      <ul className="grid gap-5 lg:grid-cols-2">
        {SCHEDULE.matches.map((match, index) => {
          const isOpen = openId === match.id;
          const panelId = `boxscore-${match.id}`;

          return (
            <Reveal3D as="li" key={match.id} delay={index * 0.07}>
              <div className="group bg-ink-raised border-line-card hover:border-orange h-full rounded-xl border p-6 transition-[color,border-color,transform,box-shadow] duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_18px_40px_-28px_#f97316]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg">
                  <span className="text-chalk font-semibold">{match.home}</span>
                  <span className="text-dim text-sm font-bold tracking-[0.1em] uppercase">vs</span>
                  <span className="text-chalk font-semibold">{match.away}</span>
                </div>
                <p className="text-muted mt-2 text-sm">
                  {match.court} · {match.time} hs
                </p>

                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : match.id)}
                  className="text-orange mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-white"
                >
                  Ver boxscore
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                      animate={prefersReduced ? undefined : { height: 'auto', opacity: 1 }}
                      exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <dl className="border-line mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                        <div>
                          <dt className="text-dim text-xs tracking-[0.12em] uppercase">Cancha</dt>
                          <dd className="text-soft mt-1">{match.court}</dd>
                        </div>
                        <div>
                          <dt className="text-dim text-xs tracking-[0.12em] uppercase">Horario</dt>
                          <dd className="text-soft mt-1">{match.time} hs</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-dim text-xs tracking-[0.12em] uppercase">
                            Estadísticas
                          </dt>
                          <dd className="text-muted mt-1">
                            Se cargan al terminar el partido. La temporada todavía no arrancó.
                          </dd>
                        </div>
                      </dl>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </Reveal3D>
          );
        })}
      </ul>

      <Reveal delay={0.3}>
        <p className="border-line text-muted mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-6 py-4 text-sm">
          <span className="font-display text-chalk text-xl font-bold">{SCHEDULE.closing.time}</span>
          {SCHEDULE.closing.note}
        </p>
      </Reveal>
    </Section>
  );
}
