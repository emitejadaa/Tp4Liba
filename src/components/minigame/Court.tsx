'use client';

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Ball, Hoop } from './Hoop';
import { Confetti } from './Confetti';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { aimFromDrag, launchVelocity, type Aim } from '@/lib/minigame/aim';
import { COURT_HEIGHT, COURT_WIDTH, LAUNCH, RIM, RIM_CENTER } from '@/lib/minigame/court';
import {
  STEP_SECONDS,
  advanceShot,
  launchShot,
  previewPath,
  simulateShot,
  type Body,
  type Shot,
  type ShotResult,
} from '@/lib/minigame/physics';
import { confettiCount, shotPoints } from '@/lib/minigame/shootout';

/**
 * La cancha: donde se apunta, se tira y se mira volar la pelota.
 *
 * Es una sola SVG con `viewBox="0 0 460 300"`, las mismas unidades en las que
 * piensa el simulador. Eso hace que no haya conversión en ningún lado: el
 * simulador dice que la pelota está en (322, 88) y eso se escribe tal cual. La
 * SVG se encarga de que en un teléfono todo mida la mitad, tiro incluido.
 *
 * ## Por qué la pelota no está en el estado de React
 *
 * Porque se mueve sesenta veces por segundo. Meterla en el estado sería pedirle
 * a React que vuelva a dibujar el juego entero —contadores, fuego de racha,
 * medidor— por cada cuadro de una pelota. El bucle escribe la transformación
 * directo en el nodo y React se entera una sola vez, cuando el tiro termina y
 * hay algo que contar.
 */

/** Cuántos puntos tiene la guía de puntería. */
const PREVIEW_POINTS = 9;

/** Y cuánto vuelo cubre. Corta antes del aro: es una ayuda, no la respuesta. */
const PREVIEW_SECONDS = 0.34;

/** Cuánto tarda la pelota en volver a su lugar después de un tiro. */
const RESET_MS = 420;

type CourtProps = {
  aim: Aim;
  wind: number;
  shotId: number;
  shooting: boolean;
  lastResult: ShotResult | null;
  reducedMotion: boolean;
  onAim: (aim: Aim) => void;
  onShoot: (aim?: Aim) => void;
  onResolve: (result: ShotResult) => void;
};

export function Court({
  aim,
  wind,
  shotId,
  shooting,
  lastResult,
  reducedMotion,
  onAim,
  onShoot,
  onResolve,
}: CourtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  /*
   * Las devoluciones y la puntería viven en una ref porque las lee el bucle, que
   * arranca una vez por tiro y tiene que ver los valores de ahora sin volver a
   * montarse. Se escriben en un efecto de layout y no durante el render: escribir
   * una ref mientras se renderiza rompe con el render concurrente, y la regla
   * `react-hooks/refs` lo marca.
   */
  const live = useRef({ aim, wind, onResolve });
  useIsomorphicLayoutEffect(() => {
    live.current = { aim, wind, onResolve };
  });

  /** Escribe una posición del simulador en el nodo de la pelota. */
  const place = useCallback((body: Pick<Body, 'x' | 'y' | 'spin'>) => {
    const node = ballRef.current;
    if (!node) return;
    node.style.transform = `translate(${body.x}px, ${body.y}px) rotate(${body.spin}deg)`;
  }, []);

  /*
   * El vuelo.
   *
   * Arranca cuando cambia `shotId` con un tiro en curso y se termina solo. El
   * tiempo se acumula y se gasta en pasos fijos de 1/240 s: el sobrante queda
   * para el próximo cuadro, así una pantalla de 60 Hz y una de 120 simulan
   * exactamente el mismo tiro y sólo se diferencian en cuántas veces lo dibujan.
   */
  useIsomorphicLayoutEffect(() => {
    // Depende del número de tiro y **no** de `shooting`: el resultado se avisa
    // al cruzar el aro, o sea con la pelota todavía en el aire, así que
    // `shooting` se apaga a mitad de vuelo. Con él en las dependencias, el
    // efecto se limpiaría justo ahí y la pelota volvería de un salto a su lugar
    // en el mismo momento en que entra, sin llegar a cruzar la red.
    if (shotId === 0) return;

    const velocity = launchVelocity(live.current.aim);
    const env = { wind: live.current.wind };

    if (reducedMotion) {
      /*
       * Sin movimiento se juega igual: se simula el tiro entero de una y se
       * avisa el resultado. Es la misma simulación, así que el mismo tiro da lo
       * mismo animado que no; lo único que cambia es que no hay nada moviéndose
       * en pantalla.
       *
       * La pelota no se mueve **para nada**, ni siquiera al lugar donde cayó:
       * quedaría tirada en un rincón distinto después de cada tiro, y el
       * siguiente saldría de un dibujo que no es de donde sale. Lo que pasó se
       * cuenta con el marcador y el aviso, que es lo que se pidió.
       */
      live.current.onResolve(simulateShot(velocity, env).result ?? 'miss');
      return;
    }

    let shot: Shot = launchShot(velocity);
    let previous = performance.now();
    let pending = 0;
    let resolved = false;
    let frame = 0;
    let resetTimer = 0;

    const loop = (now: number) => {
      pending = Math.min(pending + (now - previous) / 1000, 0.25);
      previous = now;

      const steps = Math.floor(pending / STEP_SECONDS);
      shot = advanceShot(shot, env, pending);
      pending -= steps * STEP_SECONDS;
      place(shot.body);

      // El resultado se avisa apenas se sabe —al cruzar el aro, no al final—
      // para que el confeti y la red salgan cuando la pelota pasa y no después.
      if (!resolved && shot.result !== null) {
        resolved = true;
        live.current.onResolve(shot.result);
      }

      if (!shot.settled) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const node = ballRef.current;
      if (!node) return;
      node.style.transition = `transform ${RESET_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      place({ x: LAUNCH.x, y: LAUNCH.y, spin: 0 });
      resetTimer = window.setTimeout(() => {
        node.style.transition = '';
      }, RESET_MS + 40);
    };

    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resetTimer);
      const node = ballRef.current;
      if (node) {
        node.style.transition = '';
        place({ x: LAUNCH.x, y: LAUNCH.y, spin: 0 });
      }
    };
  }, [shotId, reducedMotion, place]);

  /** Deja la pelota en su lugar en el primer dibujo. */
  useIsomorphicLayoutEffect(() => {
    place({ x: LAUNCH.x, y: LAUNCH.y, spin: 0 });
  }, [place]);

  /**
   * De píxeles de pantalla a unidades de cancha.
   *
   * La conversión sale de la matriz de la propia SVG y no de su rectángulo en
   * pantalla. El rectángulo alcanzaría si la cancha estuviera derecha, pero la
   * sección entera vive dentro de la cámara de profundidad: se inclina y se
   * aleja con el scroll, y ahí el rectángulo que reporta el navegador es el de
   * la figura ya deformada. Dividir por su ancho da una escala que no es la que
   * se está viendo, y el tiro sale distinto del que se apuntó según en qué parte
   * del scroll esté la sección. La matriz sabe de la deformación; el rectángulo
   * sólo la sufre.
   */
  const toCourt = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const screen = svg?.getScreenCTM();
    if (!svg || !screen) return { x: 0, y: 0 };

    const point = new DOMPoint(clientX, clientY).matrixTransform(screen.inverse());
    return { x: point.x, y: point.y };
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (shooting) return;
      // La captura es lo que hace que el arrastre siga funcionando cuando el
      // dedo se va de la cancha, que en un teléfono pasa todo el tiempo.
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = toCourt(event.clientX, event.clientY);
      setDragging(true);
    },
    [shooting, toCourt],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const start = dragStart.current;
      if (!start) return;

      const now = toCourt(event.clientX, event.clientY);
      const next = aimFromDrag(now.x - start.x, now.y - start.y);
      if (next) onAim(next);
    },
    [onAim, toCourt],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const start = dragStart.current;
      dragStart.current = null;
      setDragging(false);
      if (!start) return;

      const now = toCourt(event.clientX, event.clientY);
      const released = aimFromDrag(now.x - start.x, now.y - start.y);

      // La puntería viaja con el tiro. Leerla del estado sería leer la del
      // `pointermove` anterior si React todavía no procesó el último, y en una
      // máquina cargada eso sale como un tiro más flojo del que se apuntó.
      // Un arrastre demasiado corto no es un tiro: apoyar el dedo y levantarlo
      // sin mover cancela, que es como se sale de un tiro del que uno se
      // arrepintió.
      if (released) onShoot(released);
    },
    [onShoot, toCourt],
  );

  const velocity = launchVelocity(aim);
  const guide = previewPath(velocity, { wind }, PREVIEW_SECONDS, PREVIEW_POINTS);
  const scored = lastResult === 'in' || lastResult === 'perfect';
  const confetti = lastResult ? confettiCount(lastResult) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
      fill="none"
      data-testid="court"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      // Sin esto, arrastrar en un teléfono scrollea la página en vez de apuntar:
      // el navegador se queda con el gesto antes de que llegue el primer
      // `pointermove` y el tiro nunca sale.
      className="h-auto w-full max-w-[460px] touch-none select-none"
      style={{ cursor: shooting ? 'default' : 'grab' }}
    >
      <Hoop swish={scored} shotId={shotId} reducedMotion={reducedMotion} />

      {/*
        La guía de puntería: los primeros cuadros del vuelo, sin choques. Se ve
        siempre que no haya un tiro en el aire, no sólo mientras se arrastra,
        porque con el teclado no hay arrastre y la guía es la única manera de
        saber para dónde apunta.
      */}
      {!shooting ? (
        <g aria-hidden="true" data-testid="guia">
          {guide.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={2.6 - index * 0.15}
              fill="#F97316"
              opacity={(dragging ? 0.85 : 0.5) * (1 - index / (PREVIEW_POINTS + 2))}
            />
          ))}
        </g>
      ) : null}

      <g ref={ballRef} data-testid="ball" style={{ willChange: 'transform' }}>
        {/*
          El flote en reposo va en un grupo aparte y lo mueve CSS. Si estuviera en
          el mismo nodo que la posición, el bucle le pisaría la transformación en
          cada cuadro y no se vería nunca.
        */}
        <g className={shooting || reducedMotion ? undefined : 'ball-idle'}>
          <Ball />
        </g>
      </g>

      {!reducedMotion && scored && confetti > 0 ? (
        <Confetti key={shotId} shotId={shotId} count={confetti} />
      ) : null}

      <AnimatePresence>
        {scored ? (
          <motion.text
            key={shotId}
            // A la izquierda del aro y no a la derecha: a la derecha se monta
            // sobre el tablero y el poste, que es la única parte llena del
            // fondo. De este lado sube sobre cancha vacía.
            x={RIM.front - 14}
            y={RIM_CENTER.y}
            textAnchor="end"
            aria-hidden="true"
            fill="#F97316"
            fontSize={26}
            fontWeight={700}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            +{shotPoints(lastResult!)}
          </motion.text>
        ) : null}
      </AnimatePresence>
    </svg>
  );
}
