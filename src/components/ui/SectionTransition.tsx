'use client';

import { useCallback, useRef } from 'react';
import { animate, utils } from 'animejs';
import { EASE_ANIME } from '@/lib/anim/ease';
import { DURATION } from '@/lib/anim/tokens';
import { runTransition, sectionTarget, type Transition } from '@/lib/anim/transition';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * El pase entre secciones: una solapa que baja, tapa, y se va para el otro lado.
 *
 * Saltar de «Inicio» a «Reglamento» con un scroll suave es recorrer media página
 * a toda velocidad; lo que se ve no es el viaje, es un borrón. La solapa tapa,
 * el salto pasa instantáneo por detrás y la solapa se va: se llega igual de
 * rápido y se entiende que se cambió de lugar.
 *
 * El gesto es el mismo que el de las filas de la tabla de posiciones, que caen
 * desde su borde de arriba como el cartel de un aeropuerto. Acá es la pantalla
 * entera la que gira, así que la página tiene un solo idioma para «esto cambió»
 * y no uno por componente.
 *
 * El ciclo de vida —tapar, cambiar, destapar— sale de `lib/anim/transition.ts`,
 * que explica por qué está modelado sobre Barba.js y por qué no **es** Barba.
 * La coreografía es de anime.js, que es la que sabe encadenar dos animaciones y
 * esperar a que la primera termine.
 */
export function SectionTransition() {
  const panel = useRef<HTMLDivElement>(null);
  const running = useRef(false);
  const prefersReduced = useReducedMotion();

  /** Deja la solapa levantada y fuera del camino. */
  const park = useCallback(() => {
    if (panel.current) utils.set(panel.current, { opacity: 0, rotateX: -92 });
  }, []);

  const transition = useCallback(
    (): Transition => ({
      name: 'solapa',
      once: async () => {
        const element = panel.current;
        if (!element) return;
        // Ya tapada por el efecto de montaje: sólo queda irse.
        await animate(element, {
          rotateX: [0, 92],
          transformOrigin: '50% 100%',
          duration: DURATION.curtain,
          ease: EASE_ANIME,
        });
        park();
      },
      leave: async () => {
        const element = panel.current;
        if (!element) return;
        utils.set(element, { opacity: 1, rotateX: -92, transformOrigin: '50% 0%' });
        await animate(element, {
          rotateX: 0,
          duration: DURATION.base,
          ease: EASE_ANIME,
        });
      },
      enter: async () => {
        const element = panel.current;
        if (!element) return;
        /*
         * El origen cambia de arriba a abajo con la solapa plana contra la
         * pantalla. Justo en ese instante el giro vale cero, así que mover el eje
         * no mueve ni un píxel: la solapa sigue de largo en vez de volver por
         * donde vino, que es lo que la hace leer como una solapa y no como una
         * cortina.
         */
        utils.set(element, { transformOrigin: '50% 100%' });
        await animate(element, {
          rotateX: 92,
          duration: DURATION.curtain,
          ease: EASE_ANIME,
        });
        park();
      },
    }),
    [park],
  );

  // Primera carga con un ancla en la URL: alguien llegó compartido directo a una
  // sección, así que la página se abre destapándose en vez de aparecer ya scrolleada.
  useIsomorphicLayoutEffect(() => {
    if (prefersReduced) return;
    const element = panel.current;
    const hash = window.location.hash.slice(1);
    if (!element || !hash || !document.getElementById(hash)) return;

    utils.set(element, { opacity: 1, rotateX: 0, transformOrigin: '50% 100%' });
    let cancelled = false;

    // Un respiro para que el navegador termine de saltar al ancla por su cuenta.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void runTransition(transition(), { from: null, to: hash }, () => {}).catch(park);
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [prefersReduced, transition, park]);

  useIsomorphicLayoutEffect(() => {
    if (prefersReduced) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;

      const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;

      const to = sectionTarget(
        {
          href: link.getAttribute('href') ?? '',
          target: link.target,
          hasDownload: link.hasAttribute('download'),
        },
        event,
      );
      const destination = to ? document.getElementById(to) : null;
      if (!to || !destination) return;

      // Con una transición en curso el click se ignora, pero el salto se hace
      // igual: quien tocó dos veces seguidas espera llegar, no que no pase nada.
      event.preventDefault();
      if (running.current) {
        jump(destination, to);
        return;
      }

      running.current = true;
      void runTransition(transition(), { from: currentSection(), to }, () =>
        jump(destination, to),
      ).finally(() => {
        running.current = false;
      });
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [prefersReduced, transition]);

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{ perspective: '1400px' }}
    >
      <div
        ref={panel}
        data-testid="section-flap"
        className="bg-ink absolute inset-0 opacity-0 [backface-visibility:hidden]"
        style={{ transform: 'rotateX(-92deg)', transformOrigin: '50% 0%' }}
      >
        {/* El canto de la solapa: la línea naranja es lo que da el filo del cartel. */}
        <span className="bg-orange absolute inset-x-0 bottom-0 block h-0.5" />
      </div>
    </div>
  );
}

/** Salta a la sección sin animar el scroll: el movimiento pasa tapado. */
function jump(destination: HTMLElement, id: string) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  // `scroll-behavior: smooth` vive en el CSS de la página; suspenderlo acá es lo
  // que convierte el salto en instantáneo sin tocar el resto de la navegación.
  root.style.scrollBehavior = 'auto';
  destination.scrollIntoView({ block: 'start' });
  root.style.scrollBehavior = previous;
  history.pushState(null, '', `#${id}`);
}

/** Id de la sección que ocupa el centro de la pantalla, para el contexto. */
function currentSection(): string | null {
  const middle = window.innerHeight / 2;
  for (const section of document.querySelectorAll<HTMLElement>('main > section, section[id]')) {
    const box = section.getBoundingClientRect();
    if (box.top <= middle && box.bottom >= middle) return section.id || null;
  }
  return null;
}
