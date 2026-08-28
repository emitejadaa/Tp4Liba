'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { STANDINGS } from '@/data/standings';
import type { SortDirection, SortKey } from '@/lib/standings';
import { nextSort, sortStandings } from '@/lib/standings';
import { useCountUp } from '@/hooks/useCountUp';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

const COLUMNS: ReadonlyArray<{ key: SortKey; short: string; long: string }> = [
  { key: 'played', short: 'PJ', long: 'Partidos jugados' },
  { key: 'won', short: 'G', long: 'Partidos ganados' },
  { key: 'points', short: 'PTS', long: 'Puntos' },
];

/** Los puntos suben desde cero cuando la tabla entra en pantalla. */
function PointsCell({ value, active }: { value: number; active: boolean }) {
  const shown = useCountUp(value, active, 800);
  return <span className="text-chalk text-[19px] font-bold tabular-nums">{shown}</span>;
}

/**
 * Tabla de posiciones.
 *
 * Se puede ordenar por partidos jugados, ganados o puntos; las filas se
 * reacomodan con una animación de layout para que se vea cuál se movió a dónde
 * en vez de que la tabla cambie de golpe.
 */
export function Standings() {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'points',
    direction: 'desc',
  });
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const prefersReduced = useReducedMotion();

  const rows = sortStandings(STANDINGS, sort.key, sort.direction);

  return (
    <Section id="tabla" aria-labelledby="tabla-titulo" depth>
      <SectionHeading id="tabla-titulo" aside="Datos de ejemplo · la temporada no arrancó">
        Tabla de posiciones
      </SectionHeading>

      {/*
        `relative` no es decorativo: adentro de la tabla hay textos `sr-only`,
        que son `position: absolute`. Sin un ancestro posicionado su bloque
        contenedor es el viewport, así que el `overflow-x` de acá no los recorta
        y estiran la página —en un teléfono se podía arrastrar la landing 130 px
        para el costado—. Posicionando el contenedor quedan adentro de su scroll.
      */}
      <div
        ref={ref}
        className="border-line-card bg-ink-raised relative overflow-x-auto rounded-xl border"
      >
        <table className="w-full min-w-[560px] border-collapse">
          <caption className="sr-only">
            Posiciones de la temporada 2026. Se puede ordenar por partidos jugados, ganados o
            puntos.
          </caption>
          <thead>
            <tr className="border-line-card border-b">
              <th
                scope="col"
                className="text-dim w-14 px-6 py-4 text-left text-xs font-semibold tracking-[0.14em] uppercase"
              >
                #
              </th>
              <th
                scope="col"
                className="text-dim px-2 py-4 text-left text-xs font-semibold tracking-[0.14em] uppercase"
              >
                Equipo
              </th>
              {COLUMNS.map((column) => {
                const isSorted = sort.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      isSorted ? (sort.direction === 'desc' ? 'descending' : 'ascending') : 'none'
                    }
                    className="w-20 px-2 py-4 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => setSort((current) => nextSort(current, column.key))}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold tracking-[0.14em] uppercase transition-colors',
                        isSorted ? 'text-orange' : 'text-dim hover:text-soft',
                      )}
                    >
                      <span aria-hidden="true">{column.short}</span>
                      <span className="sr-only">Ordenar por {column.long}</span>
                      <span aria-hidden="true" className="text-[9px]">
                        {isSorted ? (sort.direction === 'desc' ? '▼' : '▲') : '↕'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={row.team}
                layout={!prefersReduced}
                /*
                 * Cada fila cae desde su borde de arriba, como la solapa de un
                 * cartel de aeropuerto. El origen en el borde superior es lo que
                 * lo hace leer como una tapa que se acuesta y no como una fila
                 * que se achata.
                 */
                style={prefersReduced ? undefined : { transformOrigin: 'center top' }}
                initial={
                  prefersReduced ? undefined : { opacity: 0, rotateX: -74, transformPerspective: 700 }
                }
                whileInView={
                  prefersReduced ? undefined : { opacity: 1, rotateX: 0, transformPerspective: 700 }
                }
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: prefersReduced ? 0 : index * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="border-line hover:bg-orange/5 hover:border-l-orange border-b border-l-2 border-l-transparent transition-colors last:border-b-0 motion-safe:hover:[transform:translateX(4px)]"
              >
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'font-display text-lg font-bold',
                      index < 3 ? 'text-orange' : 'text-dim',
                    )}
                  >
                    {index + 1}
                  </span>
                </td>
                <th scope="row" className="text-soft px-2 py-4 text-left text-base font-medium">
                  {row.team}
                </th>
                <td className="text-muted px-2 py-4 text-center tabular-nums">{row.played}</td>
                <td className="text-muted px-2 py-4 text-center tabular-nums">{row.won}</td>
                <td className="px-2 py-4 text-center">
                  <PointsCell value={row.points} active={inView} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
