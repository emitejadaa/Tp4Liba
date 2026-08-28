'use client';

import { motion } from 'motion/react';
import { streakTier } from '@/lib/minigame/streak';
import { cn } from '@/lib/cn';

type StreakFireProps = {
  streak: number;
  reducedMotion: boolean;
  className?: string;
};

/**
 * El fuego que acompaña al número de racha.
 *
 * Sube de nivel cada tres encestadas: crece, cambia de paleta y titila más
 * rápido, hasta llegar al fuego azul a las quince. Todo el movimiento son
 * transformaciones y opacidad —nunca ancho, alto ni filtros— así que el
 * navegador lo resuelve en la capa de composición sin recalcular layout.
 */
export function StreakFire({ streak, reducedMotion, className }: StreakFireProps) {
  const tier = streakTier(streak);

  if (tier.level === 0) return null;

  const [base, mid, tip] = tier.colors;
  const width = Math.round(tier.height * 0.62);

  return (
    <span
      className={cn('pointer-events-none relative inline-flex items-end', className)}
      style={{ width, height: tier.height }}
      // El fuego es decorativo: el nivel se anuncia junto al número de racha.
      aria-hidden="true"
    >
      <motion.span
        className="absolute inset-x-0 bottom-0 origin-bottom"
        style={{ height: tier.height }}
        animate={
          reducedMotion
            ? undefined
            : { scaleY: [1, 1.18, 0.94, 1.1, 1], scaleX: [1, 0.9, 1.08, 0.95, 1] }
        }
        transition={{ duration: tier.flicker, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 40 64" className="size-full" preserveAspectRatio="none">
          {/* Cuerpo de la llama. */}
          <path
            d="M20 64C31 64 38 56 38 45C38 30 26 24 24 8C24 8 18 16 14 24C10 32 2 34 2 45C2 56 9 64 20 64Z"
            fill={base}
          />
          {/* Corazón, un poco más claro. */}
          <path
            d="M20 64C27 64 31 58 31 50C31 40 23 35 22 24C22 24 17 31 15 37C13 43 9 44 9 50C9 58 13 64 20 64Z"
            fill={mid}
          />
          {/* Punta caliente. */}
          <path
            d="M20 64C24 64 26 60 26 55C26 48 21 45 20 38C20 38 14 46 14 55C14 60 16 64 20 64Z"
            fill={tip}
          />
        </svg>
      </motion.span>

      {/* Chispas que suben: más y más rápidas a medida que sube el nivel. */}
      {reducedMotion
        ? null
        : Array.from({ length: tier.sparks }, (_, index) => {
            const offset = (index / Math.max(tier.sparks - 1, 1)) * 2 - 1;
            return (
              <motion.span
                key={index}
                className="absolute bottom-1 left-1/2 size-[3px] rounded-full"
                style={{ backgroundColor: index % 2 === 0 ? tip : mid }}
                animate={{
                  y: [0, -tier.height * 1.4],
                  x: [0, offset * width * 0.7],
                  opacity: [0, 1, 0],
                  scale: [0.6, 1, 0.3],
                }}
                transition={{
                  duration: tier.flicker * 1.8,
                  repeat: Infinity,
                  delay: index * (tier.flicker / tier.sparks),
                  ease: 'easeOut',
                }}
              />
            );
          })}
    </span>
  );
}
