'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/anim/tokens';
import { cn } from '@/lib/cn';

type SectionHeadingProps = {
  id: string;
  children: ReactNode;
  /** Texto chico que acompaña al título (a la derecha en desktop). */
  aside?: ReactNode;
  /** Etiqueta en naranja por encima del título. */
  eyebrow?: string;
  className?: string;
};

/**
 * Título de sección con su etiqueta y su nota al costado.
 *
 * Entra girando desde el fondo al llegar al viewport, con la etiqueta
 * adelantándose al título y la nota cerrando: el escalonado hace que la sección
 * se lea en el mismo orden en que se escribió.
 *
 * Las tres piezas comparten la misma perspectiva y el mismo eje de giro, así que
 * se leen como una sola tapa que se endereza y no como tres cosas girando cada
 * una por su cuenta. Es el mismo gesto con el que se va el encabezado y con el
 * que entran las tarjetas: una sola idea de cámara para toda la página.
 */
export function SectionHeading({ id, children, aside, eyebrow, className }: SectionHeadingProps) {
  const prefersReduced = useReducedMotion();

  const entrada = (delay: number) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 22, rotateX: 26, z: -90, transformPerspective: 1000 },
          whileInView: { opacity: 1, y: 0, rotateX: 0, z: 0, transformPerspective: 1000 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 0.58, delay, ease: EASE },
        };

  return (
    <div className={cn('mb-10 [transform-style:preserve-3d]', className)}>
      {eyebrow ? (
        <motion.p
          className="text-orange mb-3 text-xs font-bold tracking-[0.18em] uppercase"
          {...entrada(0)}
        >
          {eyebrow}
        </motion.p>
      ) : null}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
        <motion.h2
          id={id}
          className="text-4xl leading-[1.05] font-bold md:text-[2.75rem]"
          {...entrada(0.06)}
        >
          {children}
        </motion.h2>
        {aside ? (
          <motion.p className="text-muted shrink-0 text-sm md:pb-1" {...entrada(0.14)}>
            {aside}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
