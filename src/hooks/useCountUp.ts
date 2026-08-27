'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Anima un número desde 0 hasta `target` cuando `active` pasa a `true`.
 *
 * Se usa en los puntos de la tabla de posiciones. Con `prefers-reduced-motion`
 * —o con duración cero— devuelve el valor final durante el render, sin animar.
 */
export function useCountUp(target: number, active: boolean, durationMs = 900): number {
  const prefersReduced = useReducedMotion();
  const skipAnimation = prefersReduced || durationMs <= 0;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (!active || skipAnimation) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutCubic: arranca rápido y frena, que es como se lee mejor un contador.
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs, skipAnimation]);

  if (!active) return 0;
  return skipAnimation ? target : animated;
}
