'use client';

import { useRef } from 'react';
import { animate, stagger, utils } from 'animejs';
import { BallArt } from '@/components/hero/BallArt';
import { DEFAULT_TILT } from '@/lib/ball-geometry';
import { EASE_ANIME } from '@/lib/anim/ease';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { reducedMotionNow, useReducedMotion } from '@/hooks/useReducedMotion';
import { useSeamLoop } from '@/hooks/useSeamLoop';

/**
 * La pelota del encabezado.
 *
 * Gira una vuelta cada cuarenta segundos —tan lento que no se la ve girar, se la
 * nota distinta cada vez que se vuelve a mirar— y flota tres centésimas de su
 * radio en un ciclo de seis segundos que no coincide con el del giro, para que
 * nunca se repita el mismo cuadro. Una sola cosa pasa rápido: la entrada, que
 * dura un segundo y no vuelve a pasar.

 */

/** Fuente del progreso de scroll, leída dentro del bucle y no por React. */
export type ScrollSource = { get: () => number };

/** Segundos que tarda en dar una vuelta entera. */
const TURN_SECONDS = 40;

/** Cuánto la hace rotar de más recorrer el encabezado, en radianes. */
const SCROLL_SWING = 0.55;

/** Flotación: cuánto sube y baja —en unidades de radio— y cada cuántos segundos. */
const FLOAT = 0.03;
const FLOAT_SECONDS = 6;

export function HeroBall({ scroll }: { scroll?: ScrollSource }) {
  const root = useRef<SVGSVGElement>(null);
  const prefersReduced = useReducedMotion();

  useSeamLoop(root, {
    enabled: !prefersReduced,
    tilt: DEFAULT_TILT,
    spinAt: (elapsed) =>
      (elapsed / TURN_SECONDS) * Math.PI * 2 + (scroll?.get() ?? 0) * SCROLL_SWING,
    onFrame: (elapsed) => {
      const svg = root.current;
      if (!svg) return;

      const float = Math.sin((elapsed / FLOAT_SECONDS) * Math.PI * 2) * FLOAT;
      const body = svg.querySelector<SVGGElement>('[data-ball="body"]');
      const shadow = svg.querySelector<SVGEllipseElement>('[data-ball="shadow"]');

      // La sombra se achica y se aclara cuando la pelota sube: es lo que hace
      // leer la altura, más que el movimiento de la pelota en sí.
      if (shadow) shadow.style.opacity = (0.5 - float * 5).toFixed(3);
      body?.style.setProperty('--float', `${(-float).toFixed(4)}`);
    },
  });

  useIsomorphicLayoutEffect(() => {
    const svg = root.current;
    if (!svg || prefersReduced || reducedMotionNow()) return;

    const body = svg.querySelector<SVGGElement>('[data-ball="body"]');
    const seams = [...svg.querySelectorAll<SVGPathElement>('[data-seam]')];
    const shadowIn = svg.querySelector<SVGGElement>('[data-ball="shadow-in"]');
    if (!body || !shadowIn) return;

    /*
     * La entrada. La pelota llega desde un poco más abajo y un poco más chica,
     * la sombra se abre debajo de ella y las costuras se encienden de a una.
     * Escalonar las costuras es lo que hace que se lea como una pelota que se
     * arma y no como una imagen que aparece.
     */
    utils.set(body, { opacity: 0, scale: 0.94, y: 12 });
    utils.set(shadowIn, { opacity: 0, scaleX: 0.7 });
    utils.set(seams, { opacity: 0 });

    const entrance = [
      animate(body, { opacity: 1, scale: 1, y: 0, duration: 900, ease: EASE_ANIME }),
      animate(shadowIn, { opacity: 1, scaleX: 1, duration: 900, delay: 120, ease: EASE_ANIME }),
      animate(seams, { opacity: 1, duration: 520, delay: stagger(110, { start: 260 }) }),
    ];

    return () => {
      for (const animation of entrance) animation.revert();
    };
  }, [prefersReduced]);

  return (
    <div className="relative aspect-square w-full" data-testid="hero-ball">
      <BallArt ref={root} grounded />
    </div>
  );
}
