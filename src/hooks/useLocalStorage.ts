'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';

/** Suscriptores de esta pestaña: `storage` sólo avisa a las demás. */
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/**
 * Estado persistido en `localStorage`.
 *
 * Está armado como store externo para no hacer `setState` dentro de un efecto y
 * para que el render del servidor devuelva siempre `initialValue`, evitando
 * diferencias de hidratación. Cada acceso al almacenamiento va envuelto en
 * `try/catch` porque en modo privado o con cookies bloqueadas tira excepción; en
 * ese caso el valor sobrevive en memoria y sólo se pierde la persistencia.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // El snapshot tiene que ser estable entre llamadas o React entra en bucle:
  // cacheamos el parseo y sólo lo rehacemos si cambió el string guardado.
  const cache = useRef<{ raw: string | null; value: T; detached: boolean }>({
    raw: null,
    value: initialValue,
    detached: false,
  });

  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    window.addEventListener('storage', onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener('storage', onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    // Con el almacenamiento roto nos quedamos con lo último que guardamos.
    if (cache.current.detached) return cache.current.value;

    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      cache.current.detached = true;
      return cache.current.value;
    }

    if (raw !== cache.current.raw) {
      cache.current.raw = raw;
      try {
        cache.current.value = raw === null ? initialValue : (JSON.parse(raw) as T);
      } catch {
        cache.current.value = initialValue;
      }
    }
    return cache.current.value;
  }, [key, initialValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initialValue);

  const persist = useCallback(
    (next: T) => {
      const serialized = JSON.stringify(next);
      try {
        window.localStorage.setItem(key, serialized);
        cache.current = { raw: serialized, value: next, detached: false };
      } catch {
        cache.current = { raw: serialized, value: next, detached: true };
      }
      notify();
    },
    [key],
  );

  return [value, persist] as const;
}
