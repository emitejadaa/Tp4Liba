'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Escucha un media query y devuelve si matchea.
 *
 * `useSyncExternalStore` es el primitivo indicado para suscribirse a estado que
 * vive fuera de React: evita el `setState` dentro de un efecto y devuelve el
 * snapshot del servidor (`false`) durante el render inicial, así la hidratación
 * no se rompe.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
