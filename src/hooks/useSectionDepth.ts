'use client';

import type { RefObject } from 'react';
import { useScroll, useSpring, useTransform } from 'motion/react';
import { DEFAULT_DEPTH, pushAt, tiltAt } from '@/lib/depth';
import { useReducedMotion } from './useReducedMotion';

/**
 * Profundidad 3D de una sección según el scroll.
 *
 * Devuelve un objeto de estilo listo para `motion.div`: la sección llega desde
 * el fondo, se planta de frente mientras se la lee y se va al fondo al salir.
 *
 * Son transformaciones puras —`rotateX` y `translateZ`—, así que el navegador
 * las compone en la placa de video sin recalcular layout ni repintar. Es lo que
 * permite ponerle esto a toda la página sin pagar nada por cuadro.
 *
 * La perspectiva va en el propio elemento, con `transformPerspective`, en vez de
 * en un contenedor con `perspective`: así cada sección se calcula respecto de su
 * propio centro y no hay que envolver medio árbol en divs auxiliares.
 */
export function useSectionDepth(
  target: RefObject<HTMLElement | null>,
  { rotate = DEFAULT_DEPTH.rotate, depth = DEFAULT_DEPTH.depth, perspective = 1400 } = {},
) {
  const prefersReduced = useReducedMotion();

  // Todo el recorrido: de asomarse por abajo a terminar de salir por arriba.
  const { scrollYProgress } = useScroll({
    target,
    offset: ['start end', 'end start'],
  });

  // El resorte saca el escalón del scroll, que en rueda llega de a saltos.
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.4 });

  const rotateX = useTransform(smooth, (value) => tiltAt(value, rotate));
  const z = useTransform(smooth, (value) => pushAt(value, depth));

  return {
    enabled: !prefersReduced,
    style: prefersReduced ? undefined : { transformPerspective: perspective, rotateX, z },
  } as const;
}
