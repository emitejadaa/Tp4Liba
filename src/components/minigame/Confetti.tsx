'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';

type ConfettiProps = {
  /** Cambia en cada tiro: se usa como semilla y para remontar el efecto. */
  shotId: number;
  count: number;
  /** Segundos a esperar antes de largarlo, para que salga al cruzar el aro. */
  delaySeconds: number;
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
 * Las partículas se calculan una sola vez por tiro y quedan fijas mientras dure
 * la animación.
 */
export function Confetti({ shotId, count, delaySeconds }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + noise(shotId, index) * 0.6;
        const distance = 42 + noise(shotId, index + 100) * 58;
        return {
          id: index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.75 + 28,
          rotate: noise(shotId, index + 200) * 540 - 270,
          color: COLORS[index % COLORS.length]!,
          size: 4 + Math.round(noise(shotId, index + 300) * 4),
          duration: 0.75 + noise(shotId, index + 400) * 0.45,
        };
      }),
    [shotId, count],
  );

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute rounded-[1px]"
          style={{
            // Centro del aro dentro de la cancha del minijuego.
            left: 322,
            top: 88,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
          }}
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
            delay: delaySeconds,
            ease: [0.2, 0.7, 0.4, 1],
            times: [0, 0.15, 0.7, 1],
          }}
        />
      ))}
    </span>
  );
}
