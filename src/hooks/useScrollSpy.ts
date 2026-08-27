'use client';

import { useEffect, useState } from 'react';

/**
 * Devuelve el id de la sección que se está viendo, para marcarla en el nav.
 *
 * En vez de quedarse con la primera sección que intersecta, elige la que más
 * área tiene visible: así el link activo no salta cuando dos secciones se
 * solapan en pantallas altas.
 */
export function useScrollSpy(sectionIds: readonly string[], offsetPx = 96): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const visibility = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best) setActiveId(best);
      },
      {
        rootMargin: `-${offsetPx}px 0px -40% 0px`,
        threshold: [0, 0.15, 0.3, 0.5, 0.75, 1],
      },
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sectionIds, offsetPx]);

  return activeId;
}
