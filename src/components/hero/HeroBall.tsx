'use client';

import { useMemo, useRef } from 'react';
import { animate, stagger, utils } from 'animejs';
import { SEAMS, ballPaths } from '@/lib/ball-geometry';
import { EASE_ANIME } from '@/lib/anim/ease';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * La pelota del encabezado.
 *
 * Es un disco naranja con las costuras encima, plano como el resto de la página.
 * Lo único que no es plano es el movimiento: las costuras se calculan como curvas
 * sobre una esfera y se proyectan cuadro a cuadro (`lib/ball-geometry.ts`), así
 * que barren la curvatura y desaparecen por el borde en vez de deslizarse sobre
 * un círculo. Es la diferencia entre un dibujo que gira y una pelota girando, y
 * es lo único que hay que hacer bien para que se sienta de calidad.
 *
 * Todo lo demás es contención. Gira una vuelta cada cuarenta segundos —tan lento
 * que no se la ve girar, se la nota distinta cada vez que se vuelve a mirar—, y
 * flota un punto y medio de su radio en un ciclo de seis segundos que no coincide
 * con el del giro, para que nunca se repita el mismo cuadro. Una sola cosa pasa
 * rápido: la entrada, que dura un segundo y no vuelve a pasar.
 */

/**
 * Fuente del progreso de scroll. Se pasa como objeto con `get()` en vez de como
 * número para que el bucle de dibujo lo lea por su cuenta: un número obligaría a
 * re-renderizar React en cada cuadro de scroll.
 */
export type ScrollSource = { get: () => number };

/** Inclinación del eje, en radianes: la pelota se ve un poco desde arriba. */
const TILT = -0.16;

/** Segundos que tarda en dar una vuelta entera. */
const TURN_SECONDS = 40;

/** Cuánto la hace rotar de más recorrer el encabezado, en radianes. */
const SCROLL_SWING = 0.55;

/** Flotación: cuánto sube y baja —en unidades de radio— y cada cuántos segundos. */
const FLOAT = 0.03;
const FLOAT_SECONDS = 6;

/**
 * Puntos por costura. Con 96 la curva ya es lisa en una pelota de 380 px; subir
 * no cambia un píxel y multiplica las cuentas por cuadro.
 */
const STEPS = 96;

/** Debajo de este giro no se reescribe el DOM: no se vería la diferencia. */
const MIN_STEP = 0.0015;

export function HeroBall({ scroll }: { scroll?: ScrollSource }) {
  const root = useRef<SVGSVGElement>(null);
  const prefersReduced = useReducedMotion();

  /*
   * El primer dibujo se calcula al renderizar, no en un efecto: el HTML del
   * servidor ya sale con la pelota entera. Sin JavaScript, o antes de que
   * hidrate, se ve igual —quieta— en vez de aparecer un hueco.
   */
  const initial = useMemo(() => ballPaths(0, TILT, STEPS), []);

  useIsomorphicLayoutEffect(() => {
    const svg = root.current;
    if (!svg || prefersReduced) return;

    /*
     * Y se vuelve a preguntar, directo al navegador. `useReducedMotion` se apoya
     * en `useSyncExternalStore`, que durante la hidratación devuelve el snapshot
     * del servidor —`false`, porque en el servidor no hay media queries— y recién
     * en el render siguiente entrega el valor real. Ese render de más alcanza
     * para que el bucle arranque y la pelota se mueva ante alguien que pidió
     * justamente que no se moviera nada.
     */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const body = svg.querySelector<SVGGElement>('[data-ball="body"]');
    const seams = [...svg.querySelectorAll<SVGPathElement>('[data-seam]')];
    const shadow = svg.querySelector<SVGEllipseElement>('[data-ball="shadow"]');
    const shadowIn = svg.querySelector<SVGGElement>('[data-ball="shadow-in"]');
    if (!body || !shadow || !shadowIn) return;

    /*
     * La entrada. La pelota llega desde un poco más abajo y un poco más chica,
     * la sombra se abre debajo de ella y las costuras se encienden de a una.
     * Escalonar las costuras es lo que hace que se lea como una pelota que se
     * arma y no como una imagen que aparece.
     */
    utils.set(body, { opacity: 0, scale: 0.94, y: 12 });
    utils.set(shadowIn, { opacity: 0, scaleX: 0.7 });
    utils.set(seams, { opacity: 0 });

    const entrance = [
      animate(body, { opacity: 1, scale: 1, y: 0, duration: 900, ease: EASE_ANIME }),
      animate(shadowIn, { opacity: 1, scaleX: 1, duration: 900, delay: 120, ease: EASE_ANIME }),
      animate(seams, { opacity: 1, duration: 520, delay: stagger(110, { start: 260 }) }),
    ];

    let frame: number | null = null;
    let onScreen = true;
    let start = performance.now();
    let elapsed = 0;
    let lastSpin = Number.NaN;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      elapsed = (now - start) / 1000;

      // La flotación se escribe siempre: es lenta, y saltearla por umbral la
      // convertiría en un movimiento a saltos en vez de un deslizamiento.
      const float = Math.sin((elapsed / FLOAT_SECONDS) * Math.PI * 2) * FLOAT;
      // La sombra se achica y se aclara cuando la pelota sube: es lo que hace
      // leer la altura, más que el movimiento de la pelota en sí.
      shadow.style.opacity = (0.5 - float * 5).toFixed(3);
      body.style.setProperty('--float', `${(-float).toFixed(4)}`);

      const spin = (elapsed / TURN_SECONDS) * Math.PI * 2 + (scroll?.get() ?? 0) * SCROLL_SWING;
      if (Math.abs(spin - lastSpin) < MIN_STEP) return;
      lastSpin = spin;

      const paths = ballPaths(spin, TILT, STEPS);
      for (let i = 0; i < paths.length; i++) seams[i]?.setAttribute('d', paths[i]!);
    };

    /*
     * Fuera de pantalla o con la pestaña escondida no se dibuja. Son dos
     * condiciones distintas: la pelota puede estar a la vista con la pestaña
     * oculta, o la pestaña activa con la pelota ya scrolleada.
     */
    const sync = () => {
      const shouldRun = onScreen && !document.hidden;
      if (shouldRun && frame === null) {
        // Se recalcula el origen del reloj para que no pegue un salto de giro
        // proporcional al rato que estuvo parada.
        start = performance.now() - elapsed * 1000;
        frame = requestAnimationFrame(draw);
      } else if (!shouldRun && frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              onScreen = entries[0]?.isIntersecting ?? true;
              sync();
            },
            { threshold: 0.05 },
          );
    observer?.observe(svg);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      for (const animation of entrance) animation.revert();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [prefersReduced, scroll]);

  return (
    <div className="relative aspect-square w-full" data-testid="hero-ball">
      <svg
        ref={root}
        // Deja aire abajo para la sombra, que vive fuera del radio de la pelota.
        viewBox="-1.08 -1.08 2.16 2.42"
        className="size-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        {/*
          La sombra es lo que apoya la pelota en la página. Es un degradé y no una
          elipse plana porque un borde duro acá se lee como una mancha pegada
          debajo; difusa, se lee como aire entre la pelota y el piso.
        */}
        <defs>
          <radialGradient id="liba-ball-shadow">
            <stop offset="0%" stopColor="#020a14" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#020a14" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#020a14" stopOpacity="0" />
          </radialGradient>

          {/*
            Las costuras se recortan contra el cuerpo. El trazo tiene ancho, así
            que cerca de la silueta la mitad de ese ancho cae fuera del disco: sin
            recorte se ven unas pestañas de tinta asomando por el borde, y la
            pelota deja de tener un contorno limpio.
          */}
          <clipPath id="liba-ball-clip">
            <circle r="1" />
          </clipPath>
        </defs>

        {/*
          Dos capas para la sombra, y no es de más: la entrada anima la opacidad
          del grupo y el bucle escribe la de la elipse. Sobre la misma propiedad,
          la entrada le pisaría el latido al bucle durante su primer segundo.
        */}
        <g data-ball="shadow-in" style={{ transformOrigin: '0 1.16px' }}>
          <ellipse
            data-ball="shadow"
            cx="0"
            cy="1.16"
            rx="0.82"
            ry="0.1"
            fill="url(#liba-ball-shadow)"
            style={{ opacity: 0.5 }}
          />
        </g>

        {/*
          El cuerpo y las costuras van en el mismo grupo: la flotación los mueve a
          los dos juntos, y `--float` la escribe el bucle sin tocar la escala ni
          la posición que dejó la animación de entrada.
        */}
        <g
          data-ball="body"
          style={{ translate: '0 calc(var(--float, 0) * 1px)', transformOrigin: '0 0' }}
        >
          <circle r="1" fill="var(--color-orange)" />

          {/*
            Las costuras son gruesas a propósito: en una pelota de básquet son
            surcos anchos, y finas el disco se leería como un punto de color.
            `non-scaling-stroke` fija el grosor en píxeles de pantalla, así la
            pelota se ve igual midiendo 280 px en un teléfono o 380 en escritorio.
          */}
          <g
            clipPath="url(#liba-ball-clip)"
            stroke="var(--color-ink)"
            strokeWidth="4"
            strokeLinecap="butt"
            fill="none"
          >
            {SEAMS.map((_, index) => (
              <path
                key={index}
                data-seam=""
                d={initial[index] ?? ''}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
