'use client';

import { useMediaQuery } from './useMediaQuery';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Indica si la persona pidió reducir el movimiento en su sistema.
 *
 * Los componentes lo usan para saltear animaciones de Motion y bucles de
 * `requestAnimationFrame`, además del bloqueo que ya hace el CSS.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION);
}

/**
 * Lo mismo, pero preguntado al navegador en el momento.
 *
 * `useReducedMotion` se apoya en `useSyncExternalStore`, que durante la
 * hidratación devuelve el snapshot del servidor —`false`, porque en el servidor
 * no hay media queries— y recién en el render siguiente entrega el valor real.
 * Ese render de más alcanza para que un bucle de animación arranque delante de
 * alguien que pidió justamente que no se moviera nada.
 *
 * Va sólo adentro de efectos. **No** sirve para decidir qué se renderiza: ahí el
 * servidor y el cliente darían HTML distinto y la hidratación se rompe. Para eso
 * está el hook, que devuelve lo mismo en los dos lados y corrige después.
 */
export function reducedMotionNow(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION).matches;
}
