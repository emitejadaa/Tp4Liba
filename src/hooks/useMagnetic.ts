'use client';

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Atracción magnética hacia el puntero.
 *
 * El elemento se corre un poco en dirección al cursor mientras está encima, lo
 * que hace que los botones se sientan «vivos» sin moverlos tanto como para que
 * cueste acertarles: el desplazamiento está acotado por `strength`.
 *
 * Igual que la inclinación de las tarjetas, mide el elemento una sola vez al
 * entrar el puntero y calcula como mucho una posición por cuadro.
 */
export function useMagnetic(strength = 0.28, maxPixels = 10) {
  const prefersReduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const bounds = useRef<DOMRect | null>(null);
  const frame = useRef<number | null>(null);

  const onPointerEnter = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (prefersReduced) return;
      bounds.current = event.currentTarget.getBoundingClientRect();
    },
    [prefersReduced],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (prefersReduced || !bounds.current || frame.current !== null) return;

      const { left, top, width, height } = bounds.current;
      const dx = event.clientX - (left + width / 2);
      const dy = event.clientY - (top + height / 2);

      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setOffset({
          x: Math.max(-maxPixels, Math.min(maxPixels, dx * strength)),
          y: Math.max(-maxPixels, Math.min(maxPixels, dy * strength)),
        });
      });
    },
    [prefersReduced, strength, maxPixels],
  );

  const onPointerLeave = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    bounds.current = null;
    setOffset({ x: 0, y: 0 });
  }, []);

  return {
    offset,
    enabled: !prefersReduced,
    handlers: { onPointerEnter, onPointerMove, onPointerLeave },
  } as const;
}
