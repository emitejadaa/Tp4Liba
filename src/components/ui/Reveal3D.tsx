'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Reveal3DProps = {
  children: ReactNode;
  /** Retardo en segundos, para escalonar una grilla. */
  delay?: number;
  /** Grados desde los que entra girando. */
  rotate?: number;
  /** Píxeles de profundidad desde los que llega. */
  depth?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'tr';
};

/**
 * Entrada en 3D: la pieza llega desde el fondo girando sobre su eje horizontal,
 * como una ficha que cae de plano y se endereza.
 *
 * Es el hermano en profundidad de `Reveal`, que sólo desliza y desvanece. Se usa
 * donde hay varias piezas iguales —tarjetas, filas— porque escalonarlas es lo
 * que arma la sensación de volumen; para un bloque de texto suelto alcanza con
 * `Reveal`.
 */
export function Reveal3D({
  children,
  delay = 0,
  rotate = 14,
  depth = 90,
  className,
  as = 'div',
}: Reveal3DProps) {
  const prefersReduced = useReducedMotion();
  const Component = motion[as];

  if (prefersReduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={className}
      // La perspectiva viaja en la propia transformación: sin ella `rotateX`
      // sería una simple compresión vertical, sin nada de profundidad.
      initial={{ opacity: 0, rotateX: rotate, z: -depth, transformPerspective: 900 }}
      whileInView={{ opacity: 1, rotateX: 0, z: 0, transformPerspective: 900 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
