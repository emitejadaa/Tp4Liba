'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { usePointerTilt } from '@/hooks/usePointerTilt';
import { cn } from '@/lib/cn';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Ángulo máximo de inclinación. */
  maxDegrees?: number;
  /** Brillo que sigue al puntero. */
  glare?: boolean;
  as?: 'div' | 'li';
};

/**
 * Tarjeta que se inclina hacia el puntero, con un brillo que lo sigue.
 *
 * El movimiento son sólo `rotateX`/`rotateY` y un degradado, así que el
 * navegador lo resuelve sin recalcular layout. Con `prefers-reduced-motion` se
 * renderiza como una tarjeta común, sin manejadores de puntero.
 */
export function TiltCard({
  children,
  className,
  maxDegrees = 7,
  glare = true,
  as = 'div',
}: TiltCardProps) {
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
      transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.5 }}
    >
      {glare ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [.group\\/tilt:hover_&]:opacity-100"
          style={{
            background: `radial-gradient(340px circle at ${tilt.glareX}% ${tilt.glareY}%, rgb(249 115 22 / 0.14), transparent 60%)`,
          }}
        />
      ) : null}
      {children}
    </Component>
  );
}
