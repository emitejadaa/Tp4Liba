'use client';

import type { CSSProperties } from 'react';
import { PLANE_RATE } from '@/lib/anim/tokens';
import { cn } from '@/lib/cn';

/**
 * Los planos de profundidad que hay detrás de cada sección.
 *
 * Son marcas de cancha —el círculo central, la zona, la línea de tres— dibujadas
 * con trazo fino y casi transparentes. No se ven como un dibujo: se ven como que
 * el fondo tiene fondo.
 *
 * Tres capas y ni una más. Cada una se mueve a distinta velocidad con el scroll
 * (`data-sc-parallax`, que maneja el motor de scroll-craft) y además se inclina
 * sobre su eje horizontal según el avance de la sección, leyendo el `--sc-p` que
 * el mismo motor publica en el `<section>`. La velocidad distinta da la
 * distancia; la inclinación da el volumen. Con una sola capa no hay perspectiva,
 * y con cinco deja de leerse como profundidad y empieza a leerse como ruido.
 *
 * Todo es decorativo: `aria-hidden`, sin eventos de puntero y recortado por un
 * contenedor propio, para que nunca empuje el ancho de la página.
 */

type PlaneMark = 'circle' | 'key' | 'arc';

/** Estilo con las variables que lee la utilidad `.depth-plate`. */
type PlateStyle = CSSProperties & {
  '--plate-tilt'?: string;
  '--plate-scale'?: string;
};

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 } as const;

/** Círculo central y línea de medio campo. */
function CircleMark() {
  return (
    <svg viewBox="0 0 600 600" className="size-full" aria-hidden="true">
      <circle cx="300" cy="300" r="176" {...STROKE} />
      <circle cx="300" cy="300" r="58" {...STROKE} />
      <path d="M0 300H600" {...STROKE} />
    </svg>
  );
}

/** La zona pintada, vista desde la línea de fondo. */
function KeyMark() {
  return (
    <svg viewBox="0 0 600 600" className="size-full" aria-hidden="true">
      <path d="M180 0H420V330H180Z" {...STROKE} />
      <circle cx="300" cy="330" r="96" {...STROKE} />
      <path d="M0 0H600" {...STROKE} />
    </svg>
  );
}

/** La línea de tres con sus dos rectas. */
function ArcMark() {
  return (
    <svg viewBox="0 0 600 600" className="size-full" aria-hidden="true">
      <path d="M96 0V150C96 262 187 353 300 353C413 353 504 262 504 150V0" {...STROKE} />
      <path d="M0 0H600" {...STROKE} />
    </svg>
  );
}

const MARKS: Record<PlaneMark, () => React.JSX.Element> = {
  circle: CircleMark,
  key: KeyMark,
  arc: ArcMark,
};

/**
 * Dónde se planta cada marca. Cambiar de una sección a la siguiente es lo que
 * evita que el fondo se lea como un patrón repetido.
 */
const PLACEMENT: Record<PlaneMark, string> = {
  circle: '-left-[18%] top-[-12%] w-[78vw] max-w-[860px]',
  key: 'right-[-14%] top-[4%] w-[62vw] max-w-[700px]',
  arc: 'left-[24%] bottom-[-22%] w-[70vw] max-w-[780px]',
};

export function DepthPlanes({
  mark = 'circle',
  className,
}: {
  mark?: PlaneMark;
  className?: string;
}) {
  const Mark = MARKS[mark];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden select-none',
        className,
      )}
    >
      {/* Fondo: la marca grande, la que menos se mueve y más se inclina. */}
      <div
        data-sc-parallax={PLANE_RATE.back}
        className={cn('absolute aspect-square', PLACEMENT[mark])}
      >
        <div
          className="depth-plate text-soft size-full opacity-[0.07]"
          style={{ '--plate-tilt': '16deg', '--plate-scale': '1.04' } as PlateStyle}
        >
          <Mark />
        </div>
      </div>

      {/* Plano medio: dos rayas de cancha, que son las que delatan el movimiento. */}
      <div data-sc-parallax={PLANE_RATE.mid} className="absolute inset-x-0 top-[38%]">
        <div
          className="depth-plate"
          style={{ '--plate-tilt': '26deg', '--plate-scale': '1' } as PlateStyle}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgb(148_163_184/0.2)] to-transparent" />
          <div className="mt-[14vh] h-px w-full bg-gradient-to-r from-transparent via-[rgb(148_163_184/0.12)] to-transparent" />
        </div>
      </div>

      {/* Adelante: un resplandor naranja que acompaña al scroll en vez de resistirlo. */}
      <div
        data-sc-parallax={PLANE_RATE.front}
        className="absolute -right-[10%] bottom-[-10%] size-[46vw] max-w-[620px]"
      >
        <div
          className="depth-plate size-full"
          style={{ '--plate-tilt': '8deg', '--plate-scale': '1' } as PlateStyle}
        >
          <div className="size-full rounded-full bg-[radial-gradient(circle,rgb(249_115_22/0.12),transparent_68%)] blur-[2px]" />
        </div>
      </div>
    </div>
  );
}
