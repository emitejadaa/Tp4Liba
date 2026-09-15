'use client';

import { useRef } from 'react';
import { animate, createDrawable, stagger } from 'animejs';
import { CourtLines } from '@/components/icons';
import { EASE_ANIME } from '@/lib/anim/ease';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

/**
 * Las líneas de la cancha, dibujándose como si alguien las marcara con tiza.
 *
 * Es `createDrawable` de anime.js: envuelve cada trazo del SVG y anima cuánto de
 * su largo está pintado, así que la línea aparece por donde arranca y avanza,
 * en vez de encenderse entera. Con `stroke-dasharray` a mano habría que medir
 * cada camino y recalcularlo cuando cambia el tamaño; la librería lo hace y de
 * paso arregla el caso feo, que es el trazo con punta redonda.
 *
 * Es lo primero que pasa en la página y dura menos de dos segundos: después
 * queda quieto, de fondo, y lo único que lo mueve es el parallax del scroll.
 */
export function ChalkLines({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const element = root.current;
    if (!element || prefersReduced) return;

    const strokes = createDrawable(element.querySelectorAll('path'));
    const animation = animate(strokes, {
      draw: ['0 0', '0 1'],
      duration: 1700,
      delay: stagger(260),
      ease: EASE_ANIME,
    });

    return () => {
      animation.revert();
    };
  }, [prefersReduced]);

  return (
    <div ref={root} className={cn('w-full', className)}>
      <CourtLines className="h-auto w-full" />
    </div>
  );
}
