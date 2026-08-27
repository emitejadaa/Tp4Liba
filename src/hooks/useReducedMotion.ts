'use client';

import { useMediaQuery } from './useMediaQuery';

/**
 * Indica si la persona pidió reducir el movimiento en su sistema.
 *
 * Los componentes lo usan para saltear animaciones de Motion y bucles de
 * `requestAnimationFrame`, además del bloqueo que ya hace el CSS.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
