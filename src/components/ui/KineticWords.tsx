'use client';

import { useRef } from 'react';
import { animate, stagger, utils } from 'animejs';
import { EASE_ANIME } from '@/lib/anim/ease';
import { DURATION } from '@/lib/anim/tokens';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

type KineticWordsProps = {
  /** El texto que se arma palabra por palabra. */
  children: string;
  /** Última palabra, en naranja, que cierra la frase. */
  accent?: string;
  /** Segundos de espera antes de arrancar. */
  delay?: number;
  className?: string;
  accentClassName?: string;
};

/**
 * Titular que se arma palabra por palabra, girando desde el piso.
 *
 * Cada palabra entra acostada hacia atrás y desde el fondo de la escena, y se
 * endereza en cascada. Es la única entrada de la página que no está atada al
 * scroll —pasa una sola vez, al cargar—, y por eso la maneja anime.js: es una
 * línea de tiempo con retardos, exactamente lo que hace bien, y no obliga a
 * React a re-renderizar una vez por palabra.
 *
 * Las palabras las dibuja React, no el separador de texto de anime.js: así el
 * HTML del título sale completo del servidor —los buscadores y los lectores de
 * pantalla leen «Bienvenidos a LIBA», no una pila de spans— y la librería sólo
 * se ocupa de moverlo.
 */
export function KineticWords({
  children,
  accent,
  delay = 0,
  className,
  accentClassName,
}: KineticWordsProps) {
  const root = useRef<HTMLSpanElement>(null);
  const prefersReduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const element = root.current;
    if (!element || prefersReduced) return;

    const words = Array.from(element.querySelectorAll<HTMLElement>('[data-word]'));
    if (words.length === 0) return;

    /*
     * El estado inicial se fija acá y no en el HTML a propósito: si el
     * JavaScript no llega —o falla— el título tiene que estar a la vista igual.
     * Al correr antes de la primera pintura, no se ve el salto.
     */
    utils.set(words, { opacity: 0, y: '0.55em', rotateX: -78, z: -160 });

    const animation = animate(words, {
      opacity: 1,
      y: '0em',
      rotateX: 0,
      z: 0,
      duration: DURATION.entrance,
      delay: stagger(90, { start: delay * 1000 }),
      ease: EASE_ANIME,
    });

    return () => {
      animation.revert();
    };
  }, [prefersReduced, delay]);

  const words = children.trim().split(/\s+/);

  return (
    <span
      ref={root}
      className={cn('inline', className)}
      /*
       * La perspectiva va acá y no en cada palabra: compartiéndola, las palabras
       * giran contra un mismo punto de fuga y la línea se lee como un objeto. Con
       * una perspectiva por palabra, cada una gira contra su propio centro y el
       * conjunto se aplana.
       */
      style={prefersReduced ? undefined : { perspective: '900px' }}
    >
      {words.map((word, index) => (
        // El espacio va como nodo de texto entre spans para que el título siga
        // leyéndose «Bienvenidos a LIBA» y no todo pegado.
        <span key={`${word}-${index}`}>
          <span data-word className="inline-block origin-bottom [transform-style:preserve-3d]">
            {word}
          </span>{' '}
        </span>
      ))}
      {accent ? (
        <span
          data-word
          className={cn(
            'inline-block origin-bottom [transform-style:preserve-3d]',
            accentClassName,
          )}
        >
          {accent}
        </span>
      ) : null}
    </span>
  );
}
