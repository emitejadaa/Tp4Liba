'use client';

import { useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SCHEDULE } from '@/data/schedule';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Cronograma de la fecha 1, como riel lateral.
 *
 * Es el único lugar de la página donde el scroll vertical mueve el contenido de
 * costado. No es un capricho: una fecha es un **recorrido** —cuatro cruces, uno
 * después del otro, y un cierre—, y el movimiento lateral se lee como recorrido
 * donde el vertical se lee como argumento. En una tabla de posiciones sería un
 * error, porque el primero de un riel no se lee como el más importante; en una
 * lista de partidos que no compiten entre sí, es exactamente la forma.
 *
 * El título abre el riel y el cierre lo termina. Los dos ganan algo con estar
 * adentro: el título deja de pelear con el nav, el cierre le da una resolución al
 * riel en vez de un final, y entre los dos aportan el ancho que el recorrido
 * necesita para no quedarse corto.
 *
 * Cada cruce puede desplegar su boxscore. Como la temporada no arrancó todavía,
 * lo que se muestra es el detalle de cancha y horario más el aviso de que no hay
 * estadísticas cargadas: preferimos decirlo antes que inventar números.
 */

/** Estilo con la variable de orden que lee `.rail-item`. */
type RailStyle = CSSProperties & { '--i': number };

export function Schedule() {
  const [openId, setOpenId] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  return (
    <Section
      id="cronograma"
      aria-labelledby="cronograma-titulo"
      act="pan"
      span={3.2}
      mark="key"
      drift="#07111f"
    >
      {/*
        `w-max` es lo que hace que el riel mida lo que miden sus ítems en vez de
        lo que mide la ventana. Sin eso no sobresale nada, el motor calcula un
        recorrido de cero y el acto se convierte en una pantalla quieta durante
        tres pantallas de scroll.
      */}
      <ul
        aria-label={`Partidos de la ${SCHEDULE.round}`}
        data-sc-pan="0.05"
        className="flex w-max items-stretch gap-5 px-6 md:px-10 xl:px-20"
      >
        <li className="w-[min(72vw,320px)] shrink-0 self-center">
          <SectionHeading id="cronograma-titulo" eyebrow={SCHEDULE.when} className="mb-0">
            Cronograma · {SCHEDULE.round}
          </SectionHeading>
        </li>

        {SCHEDULE.matches.map((match, index) => {
          const isOpen = openId === match.id;
          const panelId = `boxscore-${match.id}`;

          return (
            <li
              key={match.id}
              className={
                index === 0
                  ? 'w-[min(78vw,400px)] shrink-0'
                  : 'rail-item w-[min(78vw,400px)] shrink-0'
              }
              style={{ '--i': index } as RailStyle}
            >
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
                  className="text-orange mt-2 inline-flex min-h-11 items-center gap-1.5 py-3 text-sm font-semibold transition-colors hover:text-white"
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
            </li>
          );
        })}

        <li
          className="rail-item w-[min(72vw,300px)] shrink-0 self-center"
          style={{ '--i': SCHEDULE.matches.length + 1 } as RailStyle}
        >
          <p className="border-line text-muted flex flex-col gap-2 rounded-xl border border-dashed px-6 py-5 text-sm">
            <span className="font-display text-chalk text-xl font-bold">
              {SCHEDULE.closing.time}
            </span>
            {SCHEDULE.closing.note}
          </p>
        </li>
      </ul>
    </Section>
  );
}
