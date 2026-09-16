'use client';

import { useMemo, useRef } from 'react';
import { SEAMS, ballPaths } from '@/lib/ball-wireframe';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * La pelota del encabezado: dibujada, no renderizada.
 *
 * Es una esfera de verdad —las costuras se calculan en 3D y se proyectan cuadro
 * a cuadro, en `lib/ball-wireframe.ts`— pero llega a pantalla como trazos de SVG.
 * Eso le da tres cosas que la versión con WebGL no tenía: se ve nítida en
 * cualquier pantalla, pesa lo que pesan cuatro `<path>`, y habla el mismo idioma
 * que los íconos y las marcas de cancha del resto de la página en vez de ser el
 * único objeto fotográfico de la landing.
 *
 * Se mece despacio sola y el scroll la rota un poco más. Nada más: no se la
 * arrastra, no pica y no cambia de tamaño. Lo que hacía que molestara era
 * justamente eso, que se agrandaba al scrollear hasta que la sección la cortaba
 * por la mitad y se le metía abajo del nav.
 */

/**
 * Fuente del progreso de scroll. Se pasa como objeto con `get()` en vez de como
 * número para que el bucle de dibujo lo lea por su cuenta: un número obligaría a
 * re-renderizar React en cada cuadro de scroll.
 */
export type ScrollSource = { get: () => number };

/**
 * Inclinación del eje, en radianes.
 *
 * Poca a propósito: una pelota se reconoce por la costura vertical con el ecuador
 * cruzándola, y pasados los quince grados esa lectura se pierde y el dibujo
 * empieza a parecer un giroscopio.
 */
const TILT = -0.16;

/**
 * La pelota se mece, no gira entera. Amplitud en radianes y período en segundos.
 *
 * No es una limitación técnica sino cómo se lee una pelota de básquet. De frente
 * se la reconoce por la costura vertical, el ecuador cruzándola y los dos arcos
 * abrazándola por los costados. A noventa grados de giro el eje de esos arcos
 * apunta a la cámara: los dos arcos se convierten en anillos concéntricos, la
 * costura vertical se superpone al contorno, y lo que queda parece un
 * giroscopio. Meciéndose dentro de los cincuenta grados nunca pasa por ahí, y
 * además es un movimiento mucho más tranquilo para algo que vive arriba de todo
 * en la página.
 */
const SWING = 0.35;
const SWING_SECONDS = 15;

/** Cuánto la hace rotar recorrer el encabezado entero, en radianes. */
const SCROLL_SWING = 0.5;

/**
 * Puntos por costura. Con 96 la curva ya es lisa en una pelota de 440 px; subir
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
     * para que el bucle arranque y la pelota se mueva unos grados ante alguien
     * que pidió justamente que no se moviera nada.
     */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fronts = [...svg.querySelectorAll<SVGPathElement>('[data-seam="front"]')];
    const backs = [...svg.querySelectorAll<SVGPathElement>('[data-seam="back"]')];

    let frame: number | null = null;
    let onScreen = true;
    let start = performance.now();
    let elapsed = 0;
    let lastSpin = Number.NaN;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      elapsed = (now - start) / 1000;

      const swing = Math.sin((elapsed / SWING_SECONDS) * Math.PI * 2) * SWING;
      const spin = swing + (scroll?.get() ?? 0) * SCROLL_SWING;
      if (Math.abs(spin - lastSpin) < MIN_STEP) return;
      lastSpin = spin;

      const paths = ballPaths(spin, TILT, STEPS);
      for (let i = 0; i < paths.length; i++) {
        fronts[i]?.setAttribute('d', paths[i]!.front);
        backs[i]?.setAttribute('d', paths[i]!.back);
      }
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
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [prefersReduced, scroll]);

  return (
    <div className="relative aspect-square w-full" data-testid="hero-ball">
      <svg
        ref={root}
        /*
         * El `viewBox` deja un margen respecto del radio 1 para que el trazo del
         * contorno no quede cortado al ras por el borde del SVG.
         */
        viewBox="-1.06 -1.06 2.12 2.12"
        className="text-orange size-full"
        aria-hidden="true"
        focusable="false"
      >
        {/*
          `non-scaling-stroke` fija el grosor en píxeles de pantalla: la pelota
          mide 280 px en un teléfono y 440 en escritorio, y con el trazo atado al
          `viewBox` sería un dibujo fino en un lado y grueso en el otro.
        */}
        {/*
          El cuerpo va relleno con el mismo tono de las tarjetas. Vacía, la
          pelota se leía como un globo de alambre: se veían las cuatro costuras
          enteras a la vez y, peor, se le transparentaban las marcas de cancha del
          fondo, que la cruzaban de lado a lado.
        */}
        <circle
          r="1"
          fill="var(--color-ink-raised)"
          stroke="currentColor"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />

        {/* El otro lado, apenas insinuado: es lo que le da volumen sin abrirla. */}
        <g stroke="currentColor" strokeWidth="1" opacity="0.14" fill="none">
          {SEAMS.map((_, index) => (
            <path
              key={`back-${index}`}
              data-seam="back"
              d={initial[index]?.back ?? ''}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
          suppressHydrationWarning
        >
          {SEAMS.map((_, index) => (
            <path
              key={`front-${index}`}
              data-seam="front"
              d={initial[index]?.front ?? ''}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
