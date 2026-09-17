'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { RIM_CENTER } from '@/lib/minigame/court';

type ConfettiProps = {
  /** Cambia en cada tiro: se usa como semilla y para remontar el efecto. */
  shotId: number;
  count: number;
};

const COLORS = ['#f97316', '#fbbf24', '#ffffff', '#38bdf8', '#fb923c'];

/**
 * Ruido pseudoaleatorio a partir de dos enteros.
 *
 * Es una función pura: la misma semilla da siempre el mismo valor. Se usa en
 * lugar de `Math.random` para que las partículas no salten de lugar en cada
 * re-render y para que el efecto sea reproducible entre corridas.
 */
function noise(seed: number, index: number): number {
  const value = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Confeti que sale del aro cuando la pelota entra.
 *
 * Va adentro de la SVG de la cancha y en sus mismas unidades, no en una capa de
 * HTML por encima: así se achica junto con la cancha en un teléfono en vez de
 * salir a tamaño de escritorio sobre una cancha de la mitad.
 *
 * Las partículas se calculan una sola vez por tiro y quedan fijas mientras dure
 * la animación.
 */
export function Confetti({ shotId, count }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + noise(shotId, index) * 0.6;
        const distance = 34 + noise(shotId, index + 100) * 46;
        return {
          id: index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.75 + 24,
          rotate: noise(shotId, index + 200) * 540 - 270,
          color: COLORS[index % COLORS.length]!,
          size: 3 + Math.round(noise(shotId, index + 300) * 3),
          duration: 0.75 + noise(shotId, index + 400) * 0.45,
        };
      }),
    [shotId, count],
  );

  return (
    <g aria-hidden="true" data-testid="confetti">
      {pieces.map((piece) => (
        <motion.rect
          key={piece.id}
          x={RIM_CENTER.x - piece.size / 2}
          y={RIM_CENTER.y - piece.size * 0.3}
          width={piece.size}
          height={piece.size * 0.6}
          fill={piece.color}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.6 }}
          animate={{
            x: piece.x,
            y: piece.y,
            opacity: [0, 1, 1, 0],
            rotate: piece.rotate,
            scale: [0.6, 1, 0.9],
          }}
          transition={{
            duration: piece.duration,
            ease: [0.2, 0.7, 0.4, 1],
            times: [0, 0.15, 0.7, 1],
          }}
        />
      ))}
    </g>
  );
}
