'use client';

import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

type Tilt = { rotateX: number; rotateY: number; glareX: number; glareY: number };

const REST: Tilt = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };

/**
 * Inclinación 3D de una tarjeta según dónde está el puntero.
 *
 * Devuelve los manejadores para el elemento y los ángulos actuales. La medida
 * del elemento se toma una sola vez, al entrar el puntero, y no en cada
 * movimiento: `getBoundingClientRect` fuerza al navegador a recalcular layout, y
 * hacerlo sesenta veces por segundo es la forma más fácil de que un efecto
 * decorativo se coma el presupuesto de un cuadro.
 */
export function usePointerTilt(maxDegrees = 8) {
  const prefersReduced = useReducedMotion();
  const [tilt, setTilt] = useState<Tilt>(REST);
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
      if (prefersReduced || !bounds.current) return;

      const { left, top, width, height } = bounds.current;
      const x = (event.clientX - left) / width;
      const y = (event.clientY - top) / height;

      // Un solo cálculo por cuadro, aunque lleguen más eventos de puntero.
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setTilt({
          rotateX: (0.5 - y) * maxDegrees * 2,
          rotateY: (x - 0.5) * maxDegrees * 2,
          glareX: x * 100,
          glareY: y * 100,
        });
      });
    },
    [prefersReduced, maxDegrees],
  );

  const onPointerLeave = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    bounds.current = null;
    setTilt(REST);
  }, []);

  return {
    tilt,
    enabled: !prefersReduced,
    handlers: { onPointerEnter, onPointerMove, onPointerLeave },
  } as const;
}
