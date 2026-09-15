'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` en el navegador y `useEffect` en el servidor.
 *
 * Las coreografías de anime.js tienen que fijar su estado inicial **antes** de
 * que el navegador pinte: con `useEffect`, que corre después de la primera
 * pintura, se ve un cuadro con el texto ya puesto y recién ahí desaparece para
 * entrar animado. Pero `useLayoutEffect` no existe en el prerender y React avisa
 * por consola, así que en el servidor se cae al otro.
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
