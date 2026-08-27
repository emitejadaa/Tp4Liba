'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Porción del elemento que tiene que verse para considerarlo visible. */
  threshold?: number;
  /** Margen extra alrededor del viewport, útil para adelantar la animación. */
  rootMargin?: string;
  /** Si es `true` deja de observar apenas entra: la animación no se repite. */
  once?: boolean;
};

/**
 * Devuelve una ref y si el elemento está dentro del viewport.
 *
 * Se usa para disparar los reveals al scrollear y para pausar el minijuego
 * cuando su sección deja de estar a la vista.
 */
export function useInView<T extends Element = HTMLDivElement>({
  threshold = 0.2,
  rootMargin = '0px 0px -10% 0px',
  once = true,
}: Options = {}) {
  const ref = useRef<T>(null);
  // Si el navegador no tiene IntersectionObserver damos el contenido por
  // visible: preferimos mostrarlo sin animar antes que esconderlo para siempre.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView } as const;
}
