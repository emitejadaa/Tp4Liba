'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { BallArt } from '@/components/hero/BallArt';
import { FLIGHT_TURNS, flightAt } from '@/lib/ball-flight';
import { DEFAULT_TILT } from '@/lib/ball-geometry';
import { reducedMotionNow, useReducedMotion } from '@/hooks/useReducedMotion';
import { useSeamLoop } from '@/hooks/useSeamLoop';

/**
 * La pelota que cruza la página mientras se scrollea.
 *
 * Es el hilo que cose la landing. Sale del encabezado, pasa de un costado al
 * otro a medida que se baja y queda abajo de todo al final, así que en cualquier
 * punto del recorrido hay un objeto que se acuerda de dónde venía y la página
 * deja de leerse como una pila de bloques independientes.
 *
 * Va **fija respecto de la pantalla**, y eso es todo el efecto: no se scrollea
 * con el documento, se mueve sobre él. Es lo que da la sensación de que las cosas
 * se mueven delante de quien mira en vez de que quien mira baje por encima de
 * cosas quietas.
 *
 * Es decorativa de punta a punta: `aria-hidden`, sin eventos de puntero, por
 * detrás en el apilado y bastante transparente. Con `prefers-reduced-motion` no
 * se monta.
 */

/** Estilo con las variables que posicionan y dimensionan la pelota. */
type ShellStyle = CSSProperties & {
  '--ball-x': string;
  '--ball-y': string;
  '--ball-size': string;
};

/** Sensibilidad del resorte que suaviza el scroll de rueda, que llega a saltos. */
const SMOOTHING = 0.12;

export function BallFlight() {
  const root = useRef<SVGSVGElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  /*
   * El avance suavizado vive en una ref y no en estado: lo escriben y lo leen el
   * mismo bucle de dibujo, y pasarlo por React sería un render por cuadro.
   */
  const eased = useRef(0);

  /*
   * Cuánto se puede scrollear, medido aparte del bucle. `scrollHeight` obliga al
   * navegador a recalcular el layout para contestarlo, y preguntárselo sesenta
   * veces por segundo es la forma más fácil de que un adorno se coma el
   * presupuesto de un cuadro. `scrollY`, en cambio, es gratis.
   */
  const scrollable = useRef(1);

  useEffect(() => {
    if (prefersReduced || reducedMotionNow()) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      scrollable.current = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    };
    // En el cuadro siguiente y no en el mismo: el observador se dispara durante
    // el layout, y medir ahí obliga a recalcularlo entero en el medio.
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('resize', schedule, { passive: true });
    // El acordeón del reglamento y los boxscores cambian el alto sin que la
    // ventana cambie.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(document.body);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [prefersReduced]);

  useSeamLoop(root, {
    enabled: !prefersReduced,
    tilt: DEFAULT_TILT,
    // El giro sale del recorrido, no del reloj: la pelota gira porque se scrollea.
    spinAt: () => eased.current * FLIGHT_TURNS * Math.PI * 2,
    onFrame: () => {
      const box = shell.current;
      if (!box) return;

      const target = Math.min(window.scrollY / scrollable.current, 1);

      /*
       * El avance se persigue con un resorte en vez de usarse tal cual. La rueda
       * del mouse llega a saltos, y atada 1:1 la pelota se mueve a tirones justo
       * cuando lo que tiene que transmitir es peso.
       */
      eased.current += (target - eased.current) * SMOOTHING;

      const { x, y, size, opacity } = flightAt(eased.current);
      box.style.setProperty('--ball-x', `${x.toFixed(2)}vw`);
      box.style.setProperty('--ball-y', `${y.toFixed(2)}vh`);
      box.style.setProperty('--ball-size', `${size.toFixed(2)}vmin`);
      box.style.opacity = opacity.toFixed(3);
    },
  });

  /*
   * El render depende sólo del hook, que devuelve lo mismo en el servidor y en
   * el cliente. Decidirlo con un `matchMedia` directo hacía que el servidor
   * dibujara la capa y el cliente no: una diferencia de hidratación, y React se
   * quedaba con el HTML del servidor, o sea con la capa puesta justo para quien
   * había pedido que no se moviera nada.
   */
  if (prefersReduced) return null;

  const { x, y, size, opacity } = flightAt(0);

  return (
    <div
      aria-hidden="true"
      data-testid="ball-flight"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        ref={shell}
        className="absolute size-[var(--ball-size)] -translate-x-1/2 -translate-y-1/2"
        style={
          {
            '--ball-x': `${x}vw`,
            '--ball-y': `${y}vh`,
            '--ball-size': `${size}vmin`,
            left: 'var(--ball-x)',
            top: 'var(--ball-y)',
            opacity,
          } as ShellStyle
        }
      >
        <BallArt ref={root} tone="ghost" />
      </div>
    </div>
  );
}
