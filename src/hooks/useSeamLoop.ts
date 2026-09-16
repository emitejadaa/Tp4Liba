'use client';

import { useRef, type RefObject } from 'react';
import { ballPaths } from '@/lib/ball-geometry';
import { reducedMotionNow } from './useReducedMotion';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * El bucle que redibuja las costuras de una pelota, cuadro a cuadro.
 *
 * Lo comparten la pelota del encabezado y la que cruza la página: las dos son el
 * mismo dibujo girando, y lo único que cambia es de dónde sale el ángulo —del
 * reloj en una, del scroll en la otra—. Con la cuenta acá, agregar una segunda
 * pelota no duplicó ni el bucle, ni el observador, ni el cuidado de apagarlo.
 *
 * Nada de esto pasa por React: se escriben atributos sobre el DOM. Un `setState`
 * por cuadro para mover una pelota es la forma más cara posible de moverla.
 */

/**
 * Puntos por costura. Con 96 la curva ya es lisa en una pelota de 380 px; subir
 * no cambia un píxel y multiplica las cuentas por cuadro.
 */
const STEPS = 96;

/** Debajo de este giro no se reescribe el DOM: no se vería la diferencia. */
const MIN_STEP = 0.0015;

type SeamLoopOptions = {
  /** Giro en radianes, para los segundos transcurridos desde que arrancó. */
  spinAt: (elapsedSeconds: number) => number;
  /** Inclinación del eje, en radianes. */
  tilt: number;
  /** Lo que haya que mover además del giro, una vez por cuadro. */
  onFrame?: (elapsedSeconds: number) => void;
  /** En `false` no monta nada: ni bucle, ni observador, ni listeners. */
  enabled: boolean;
};

export function useSeamLoop(
  target: RefObject<SVGSVGElement | null>,
  { spinAt, tilt, onFrame, enabled }: SeamLoopOptions,
): void {
  /*
   * Las funciones se guardan en una ref y no en las dependencias del efecto: son
   * nuevas en cada render, y listándolas el bucle se desmontaría y volvería a
   * montarse cada vez, perdiendo el reloj y pegando un salto de giro.
   */
  const callbacks = useRef({ spinAt, onFrame });
  // Se actualiza en un efecto sin dependencias —o sea, después de cada render— y
  // no durante el render: escribir una ref mientras se renderiza se rompe apenas
  // React decide renderizar dos veces, que es algo que puede hacer cuando quiera.
  useIsomorphicLayoutEffect(() => {
    callbacks.current = { spinAt, onFrame };
  });

  useIsomorphicLayoutEffect(() => {
    const svg = target.current;
    // El chequeo directo, además del `enabled`, va acá y no en quien llama: es el
    // único lugar donde arranca movimiento, así que es el único que necesita
    // saberlo, y así ninguna pelota puede olvidarse de preguntarlo.
    if (!svg || !enabled || reducedMotionNow()) return;

    const seams = [...svg.querySelectorAll<SVGPathElement>('[data-seam]')];
    if (seams.length === 0) return;

    let frame: number | null = null;
    let onScreen = true;
    let start = performance.now();
    let elapsed = 0;
    let lastSpin = Number.NaN;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      elapsed = (now - start) / 1000;
      callbacks.current.onFrame?.(elapsed);

      const spin = callbacks.current.spinAt(elapsed);
      if (Math.abs(spin - lastSpin) < MIN_STEP) return;
      lastSpin = spin;

      const paths = ballPaths(spin, tilt, STEPS);
      for (let i = 0; i < paths.length; i++) seams[i]?.setAttribute('d', paths[i]!);
    };

    /*
     * Fuera de pantalla o con la pestaña escondida no se dibuja. Son dos
     * condiciones distintas: la pelota puede estar a la vista con la pestaña
     * oculta, o la pestaña activa con la pelota ya scrolleada.
     */
    const sync = () => {
      const shouldRun = onScreen && !document.hidden;
      if (shouldRun && frame === null) {
        // Se recalcula el origen del reloj para que no pegue un salto de giro
        // proporcional al rato que estuvo parada.
        start = performance.now() - elapsed * 1000;
        frame = requestAnimationFrame(draw);
      } else if (!shouldRun && frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              onScreen = entries[0]?.isIntersecting ?? true;
              sync();
            },
            { threshold: 0.05 },
          );
    observer?.observe(svg);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [target, tilt, enabled]);
}
