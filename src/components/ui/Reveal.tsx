'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type RevealProps = {
  children: ReactNode;
  /** Retardo en segundos, para escalonar una grilla de tarjetas. */
  delay?: number;
  /** Desplazamiento inicial en píxeles. */
  offsetY?: number;
  className?: string;
  as?: 'div' | 'li' | 'article';
};

/**
 * Aparece con un fade y un desplazamiento cuando entra en el viewport.
 *
 * Es el bloque con el que se arman todos los reveals de la landing. Con
 * `prefers-reduced-motion` renderiza el contenido sin animación ni wrapper de
 * Motion, para no montar observadores al pedo.
 */
export function Reveal({ children, delay = 0, offsetY = 24, className, as = 'div' }: RevealProps) {
  const prefersReduced = useReducedMotion();
  const Component = motion[as];

  if (prefersReduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: offsetY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
