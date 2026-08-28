'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AimBar } from './AimBar';
import { GameBall, Hoop } from './Hoop';
import { ScoreStats } from './ScoreStats';
import { Button } from '@/components/ui/Button';
import { useInView } from '@/hooks/useInView';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { INITIAL_STATE, feedbackFor, shootoutReducer, shotPoints } from '@/lib/minigame/shootout';
import { cn } from '@/lib/cn';

const BEST_STREAK_KEY = 'liba:mejor-racha';

/** Pasos discretos que da la mira con `prefers-reduced-motion`. */
const REDUCED_MOTION_STEP_MS = 320;

/**
 * Minijuego «Tirá al aro».
 *
 * La mira recorre la barra sola y hay que tirar cuando pasa por la zona naranja.
 * Todo el estado lo maneja el reducer de `lib/minigame/shootout`; acá sólo se lo
 * dibuja y se lo hace avanzar.
 */
export function ShootoutGame() {
  const [state, dispatch] = useReducer(shootoutReducer, INITIAL_STATE);
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25, once: false });
  const prefersReduced = useReducedMotion();
  const [storedBest, setStoredBest] = useLocalStorage(BEST_STREAK_KEY, 0);

  // El récord guardado se actualiza sólo cuando la partida lo supera.
  useEffect(() => {
    if (state.best > storedBest) setStoredBest(state.best);
  }, [state.best, storedBest, setStoredBest]);

  /*
   * El bucle de animación corre únicamente cuando la sección está a la vista y
   * la pestaña está activa: no tiene sentido gastar frames —ni batería— moviendo
   * una mira que nadie ve. `deltaSeconds` se toma del reloj real y no de un
   * valor fijo, así la velocidad no depende de los Hz de la pantalla.
   */
  useEffect(() => {
    if (!inView || prefersReduced) return;

    let frame = 0;
    let previous = performance.now();
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      const deltaSeconds = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      dispatch({ type: 'TICK', deltaSeconds });
      frame = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        previous = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    frame = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [inView, prefersReduced]);

  /*
   * Con `prefers-reduced-motion` la mira salta en pasos discretos con un
   * intervalo en vez de deslizarse: el juego se sigue pudiendo jugar, pero sin
   * movimiento continuo en pantalla.
   */
  useEffect(() => {
    if (!inView || !prefersReduced) return;

    const timer = window.setInterval(
      () => dispatch({ type: 'TICK', deltaSeconds: REDUCED_MOTION_STEP_MS / 1000 }),
      REDUCED_MOTION_STEP_MS,
    );
    return () => window.clearInterval(timer);
  }, [inView, prefersReduced]);

  // El botón ya responde a Espacio y Enter de forma nativa, así que no hace
  // falta ningún atajo extra: capturar Espacio a nivel de página además le
  // sacaría al teclado el scroll, que es su comportamiento esperado.
  const shoot = useCallback(() => dispatch({ type: 'SHOOT' }), []);

  const scored = state.lastResult === 'in' || state.lastResult === 'perfect';
  const bestStreak = Math.max(state.best, storedBest);

  return (
    <div className="bg-ink-raised border-line-card flex flex-col gap-12 rounded-2xl border p-8 lg:flex-row lg:items-center lg:p-[45px_49px]">
      <div ref={ref} className="flex min-w-0 flex-1 flex-col items-start gap-[9px]">
        <p className="text-orange text-[13px] font-bold tracking-[0.14em] uppercase">Minijuego</p>
        <h3 className="text-[40px] leading-none font-bold">Tirá al aro</h3>
        <p className="text-muted max-w-[460px] text-[17px] leading-[1.6]">
          La mira se mueve sola. Tocá <strong className="text-soft font-bold">Tirar</strong> cuando
          pase por la zona naranja y metela desde afuera del arco.
        </p>

        <div className="mt-3 w-full">
          <AimBar aim={state.aim} streak={state.streak} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-[22px]">
          <Button onClick={shoot} className="px-[34px] py-[15px] uppercase">
            Tirar
          </Button>
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'text-[17px] font-semibold transition-colors',
              scored ? 'text-orange' : 'text-dim',
            )}
          >
            {feedbackFor(state.lastResult)}
          </p>
        </div>

        <div className="mt-5">
          <ScoreStats
            stats={[
              { label: 'Encestadas', value: state.made },
              { label: 'Tiros', value: state.attempts },
              { label: 'Racha', value: state.streak, accent: true },
            ]}
          />
        </div>

        {bestStreak > 0 ? (
          <p className="text-dim mt-2 text-sm">
            Mejor racha: <span className="text-soft font-semibold">{bestStreak}</span>
          </p>
        ) : null}
      </div>

      {/* Cancha del juego: el aro arriba a la derecha y la pelota abajo a la izquierda. */}
      <div className="relative h-[300px] w-full max-w-[460px] shrink-0 self-center">
        <div className="absolute top-0 right-10 w-[220px]">
          <Hoop swish={scored} shotId={state.shotId} reducedMotion={prefersReduced} />
        </div>

        <div className="absolute bottom-[10px] left-10">
          {prefersReduced ? (
            <GameBall />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={state.shotId}
                initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
                animate={
                  state.shotId === 0
                    ? // El rebote de espera sólo corre con la sección a la
                      // vista: una animación infinita fuera de pantalla gasta
                      // frames y deja la página sin un solo cuadro estable.
                      inView
                      ? { y: [0, -12, 0] }
                      : { y: 0 }
                    : {
                        // Trayectoria hacia el aro: sube, cruza y cae. Si falla,
                        // pica en el tablero y se va para el costado.
                        x: scored ? [0, 130, 232] : [0, 120, 190],
                        y: scored ? [0, -190, -108] : [0, -186, 40],
                        scale: scored ? [1, 0.72, 0.5] : [1, 0.72, 0.6],
                        rotate: scored ? [0, 180, 320] : [0, 200, 420],
                      }
                }
                transition={
                  state.shotId === 0
                    ? { duration: 2.2, repeat: inView ? Infinity : 0, ease: 'easeInOut' }
                    : { duration: 0.75, ease: [0.3, 0, 0.5, 1], times: [0, 0.55, 1] }
                }
              >
                <GameBall />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <AnimatePresence>
          {scored ? (
            <motion.span
              key={state.shotId}
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -32, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              aria-hidden="true"
              className="font-display text-orange absolute top-[110px] right-[70px] text-3xl font-bold"
            >
              +{shotPoints(state.lastResult!)}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
