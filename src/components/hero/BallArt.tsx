'use client';

import { useId, useMemo, type Ref } from 'react';
import { DEFAULT_TILT, SEAMS, ballPaths } from '@/lib/ball-geometry';
import { cn } from '@/lib/cn';

/**
 * El dibujo de la pelota: el disco, las costuras y —si se le pide— la sombra.
 *
 * Es sólo el dibujo. Quién la mueve, y con qué, lo deciden los dos componentes
 * que la usan: la del encabezado gira con el reloj y flota, y la que cruza la
 * página gira con el scroll. Que las dos salgan de acá es lo que hace que se
 * lean como el mismo objeto y no como dos pelotas parecidas.
 */

/**
 * Puntos por costura del primer dibujo, el que sale del servidor. El bucle
 * después lo redibuja con el mismo número.
 */
const STEPS = 96;

type BallArtProps = {
  ref?: Ref<SVGSVGElement>;
  className?: string;
  /** Dibuja la sombra que la apoya en la página. */
  grounded?: boolean;
  /**
   * Cómo está pintada.
   *
   * `solid` es la pelota de verdad: disco naranja, costuras de tinta. `ghost` es
   * la misma pelota vaciada —el cuerpo casi transparente y todo el dibujo en
   * naranja— y existe por una razón concreta: la que cruza la página pasa por
   * encima del contenido, y un disco lleno le lava el texto por abajo. Vaciada,
   * lo que cruza son cuatro líneas finas y un velo, que no tapan nada.
   */
  tone?: 'solid' | 'ghost';
};

export function BallArt({ ref, className, grounded = false, tone = 'solid' }: BallArtProps) {
  const ghost = tone === 'ghost';
  /*
   * El primer dibujo se calcula al renderizar, no en un efecto: el HTML del
   * servidor ya sale con la pelota entera. Sin JavaScript, o antes de que
   * hidrate, se ve igual —quieta— en vez de aparecer un hueco.
   */
  const initial = useMemo(() => ballPaths(0, DEFAULT_TILT, STEPS), []);
  // Dos pelotas en la misma página son dos recortes: sin id propio, el segundo
  // apuntaría al primero.
  const clipId = `${useId()}-ball-clip`;

  return (
    <svg
      ref={ref}
      // Con sombra hace falta aire abajo, que vive fuera del radio de la pelota.
      viewBox={grounded ? '-1.08 -1.08 2.16 2.42' : '-1.06 -1.06 2.12 2.12'}
      className={cn('size-full overflow-visible', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {grounded ? (
          <radialGradient id={`${clipId}-shadow`}>
            <stop offset="0%" stopColor="#020a14" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#020a14" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#020a14" stopOpacity="0" />
          </radialGradient>
        ) : null}

        {/*
          Las costuras se recortan contra el cuerpo. El trazo tiene ancho, así
          que cerca de la silueta la mitad de ese ancho cae fuera del disco: sin
          recorte se ven unas pestañas de tinta asomando por el borde, y la
          pelota deja de tener un contorno limpio.
        */}
        <clipPath id={clipId}>
          <circle r="1" />
        </clipPath>
      </defs>

      {grounded ? (
        /*
         * Dos capas para la sombra, y no es de más: la entrada anima la opacidad
         * del grupo y el bucle escribe la de la elipse. Sobre la misma propiedad,
         * la entrada le pisaría el latido al bucle durante su primer segundo.
         */
        <g data-ball="shadow-in" style={{ transformOrigin: '0 1.16px' }}>
          <ellipse
            data-ball="shadow"
            cx="0"
            cy="1.16"
            rx="0.82"
            ry="0.1"
            fill={`url(#${clipId}-shadow)`}
            style={{ opacity: 0.5 }}
          />
        </g>
      ) : null}

      {/*
        El cuerpo y las costuras van en el mismo grupo: lo que mueva a la pelota
        entera los mueve juntos. `--float` lo escribe el bucle del encabezado sin
        tocar la escala ni la posición que dejó la animación de entrada.
      */}
      <g
        data-ball="body"
        style={{ translate: '0 calc(var(--float, 0) * 1px)', transformOrigin: '0 0' }}
      >
        <circle
          r="1"
          fill="var(--color-orange)"
          fillOpacity={ghost ? 0.09 : 1}
          stroke={ghost ? 'var(--color-orange)' : 'none'}
          strokeWidth="2"
          // Sólo cuando hay trazo que fijar: el disco lleno no tiene contorno.
          vectorEffect={ghost ? 'non-scaling-stroke' : undefined}
        />

        {/*
          Las costuras son gruesas a propósito: en una pelota de básquet son
          surcos anchos, y finas el disco se leería como un punto de color.
          `non-scaling-stroke` fija el grosor en píxeles de pantalla, así la
          pelota se ve igual midiendo 380 px o 130.
        */}
        <g
          clipPath={`url(#${clipId})`}
          stroke={ghost ? 'var(--color-orange)' : 'var(--color-ink)'}
          strokeWidth={ghost ? 2 : 4}
          strokeLinecap="butt"
          fill="none"
        >
          {SEAMS.map((_, index) => (
            <path
              key={index}
              data-seam=""
              d={initial[index] ?? ''}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
