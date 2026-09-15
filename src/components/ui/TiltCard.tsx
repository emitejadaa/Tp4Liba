'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { usePointerTilt } from '@/hooks/usePointerTilt';
import { POINTER_SPRING } from '@/lib/anim/tokens';
import { cn } from '@/lib/cn';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Ángulo máximo de inclinación. */
  maxDegrees?: number;
  as?: 'div' | 'li';
};

/**
 * Tarjeta que se inclina hacia el puntero.
 *
 * El movimiento son sólo `rotateX`/`rotateY`, así que el navegador lo resuelve
 * sin recalcular layout. Con `prefers-reduced-motion` se renderiza como una
 * tarjeta común, sin manejadores de puntero.
 *
 * La luz que sigue al puntero ya no vive acá. Antes cada tarjeta dibujaba su
 * propio degradé, lo que significaba una luz por tarjeta encendiéndose de a una:
 * más parecido a un tablero de botones que a una cancha iluminada. Ahora es una
 * sola luz por sección —el `data-sc-spotlight` del motor de scroll-craft, que
 * mide un elemento por movimiento en vez de siete— y las tarjetas la cruzan.
 */
export function TiltCard({ children, className, maxDegrees = 7, as = 'div' }: TiltCardProps) {
  const { tilt, enabled, handlers } = usePointerTilt(maxDegrees);
  const Component = motion[as];

  if (!enabled) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      {...handlers}
      className={cn('relative [transform-style:preserve-3d]', className)}
      style={{ perspective: 900 }}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      transition={POINTER_SPRING}
    >
      {children}
    </Component>
  );
}
