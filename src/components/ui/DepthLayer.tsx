'use client';

import { useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSectionDepth } from '@/hooks/useSectionDepth';

/**
 * Envuelve el contenido de una sección y lo mueve en profundidad con el scroll.
 *
 * Va **por dentro** de `<section>` a propósito: la caja de la sección es el
 * destino de los enlaces del nav, y si se la transformara el navegador
 * calcularía el salto contra una posición que cambia mientras se scrollea, así
 * que «Ver cronograma» aterrizaría unos píxeles corrido. Moviendo sólo el
 * contenido, el ancla queda quieta y el efecto se ve igual.
 */
export function DepthLayer({
  children,
  className,
  rotate,
  depth,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
  depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled, style } = useSectionDepth(ref, { rotate, depth });

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <motion.div ref={ref} className={className} style={style}>
      {children}
    </motion.div>
  );
}
