'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

type HoopProps = {
  /** Sacude la red cuando entra la pelota. */
  swish: boolean;
  /** Cambia en cada tiro, para reiniciar la animación de la red. */
  shotId: number;
  reducedMotion: boolean;
};

/**
 * Aro y tablero del minijuego, con la geometría del nodo 4:121 del diseño
 * (220×200, tablero con trazo de 3 y red al 65% de opacidad).
 *
 * La red es un grupo aparte para poder sacudirla sola cuando entra la pelota.
 */
export function Hoop({ swish, shotId, reducedMotion }: HoopProps) {
  return (
    <svg
      width={220}
      height={200}
      viewBox="0 0 220 200"
      fill="none"
      aria-hidden="true"
      className="h-auto w-full max-w-[220px]"
    >
      <path
        d="M177 10H63C61.3431 10 60 11.3431 60 13V87C60 88.6569 61.3431 90 63 90H177C178.657 90 180 88.6569 180 87V13C180 11.3431 178.657 10 177 10Z"
        fill="#0A1524"
        stroke="#CBD5E1"
        strokeWidth={3}
      />
      <path d="M142 42H100V76H142V42Z" stroke="#F97316" strokeWidth={3} />
      <path d="M96 88H148" stroke="#F97316" strokeWidth={5} strokeLinecap="round" />
      <motion.g
        key={shotId}
        opacity={0.65}
        style={{ transformOrigin: '122px 90px' }}
        animate={
          swish && !reducedMotion
            ? { scaleY: [1, 1.35, 0.9, 1.12, 1], scaleX: [1, 0.88, 1.05, 0.97, 1] }
            : undefined
        }
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <path
          d="M99 90L105 116H139L145 90M108 90L111 116M121 90V116M134 90L131 116M101 103H143"
          stroke="#CBD5E1"
          strokeWidth={1.6}
        />
      </motion.g>
      <path d="M180 20V190" stroke="#334155" strokeWidth={6} />
    </svg>
  );
}

/** Pelota del minijuego, con la geometría del nodo 4:127 (66×66). */
export function GameBall({ className }: { className?: string }) {
  return (
    <svg
      width={66}
      height={66}
      viewBox="0 0 66 66"
      fill="none"
      aria-hidden="true"
      className={cn('size-[66px]', className)}
    >
      <circle cx={33} cy={33} r={31.35} fill="#E9741D" />
      <g stroke="#431504" strokeWidth={2.97} fill="none">
        <circle cx={33} cy={33} r={31.35} />
        <path d="M1.65 33H64.35M33 1.65V64.35M11.55 9.9C21.45 23.1 21.45 42.9 11.55 56.1M54.45 9.9C44.55 23.1 44.55 42.9 54.45 56.1" />
      </g>
    </svg>
  );
}
