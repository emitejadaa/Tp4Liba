'use client';

import { useEffect, useState } from 'react';

/**
 * Progreso del scroll de la página, entre 0 y 1.
 *
 * Alimenta la barra de progreso del tope. Actualiza dentro de
 * `requestAnimationFrame` para no hacer un `setState` por cada evento de scroll.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}
