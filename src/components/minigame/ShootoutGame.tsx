'use client';

import { useCallback, useEffect, useReducer, type KeyboardEvent } from 'react';
import { AimMeter } from './AimMeter';
import { Court } from './Court';
import { ScoreStats } from './ScoreStats';
import { StreakFire } from './StreakFire';
import { Button } from '@/components/ui/Button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { clampAim, describeAim, type Aim } from '@/lib/minigame/aim';
import {
  INITIAL_STATE,
  describeWind,
  feedbackFor,
  shootoutReducer,
  type ShotResult,
} from '@/lib/minigame/shootout';
import { shotsToNextTier, streakTier } from '@/lib/minigame/streak';
import { cn } from '@/lib/cn';

const BEST_STREAK_KEY = 'liba:mejor-racha';

/** Cuánto mueve cada flecha del teclado. */
const ANGLE_STEP = 2;
const POWER_STEP = 0.03;

/**
 * Minijuego «Tirá al aro».
 *
 * Se apunta arrastrando, con el dedo o con el mouse. La puntería se mide desde
 * la pelota hasta el dedo: para dónde queda el dedo es el ángulo y qué tan lejos
 * está es la fuerza, así que no hay dos controles sino un gesto, y no hay dos
 * tiros iguales.
 *
 * Lo que pasa después no está escrito en ningún lado: la pelota la mueve el
 * simulador de `lib/minigame/physics.ts`, que integra gravedad y viento y
 * resuelve los choques contra el frente del aro, el fondo y la tabla. Un tiro
 * que pega en el aro puede entrar igual, y eso no es una animación elegida sino
 * el resultado de la cuenta.
 *
 * Entra limpia vale 3 y entra rebotando vale 2. La racha —y su fuego— quedan
 * como estaban: son lo que hace que un tiro importe más que el anterior.
 */
export function ShootoutGame() {
  const [state, dispatch] = useReducer(shootoutReducer, INITIAL_STATE);
  const prefersReduced = useReducedMotion();
  const [storedBest, setStoredBest] = useLocalStorage(BEST_STREAK_KEY, 0);

  // El récord guardado se actualiza sólo cuando la partida lo supera.
  useEffect(() => {
    if (state.best > storedBest) setStoredBest(state.best);
  }, [state.best, storedBest, setStoredBest]);

  const onAim = useCallback((aim: Aim) => dispatch({ type: 'AIM', aim }), []);
  const onShoot = useCallback((aim?: Aim) => dispatch({ type: 'SHOOT', aim }), []);
  const onResolve = useCallback((result: ShotResult) => dispatch({ type: 'RESOLVE', result }), []);

  /*
   * Con el teclado no hay arrastre, así que las flechas mueven los dos números
   * por separado: arriba y abajo el ángulo, izquierda y derecha la fuerza. Sin
   * esto el juego sería sólo para quien puede arrastrar, y el botón «Tirar»
   * repetiría siempre el mismo tiro.
   */
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const { aim } = state;
      const moved: Record<string, Aim> = {
        ArrowUp: { ...aim, angle: aim.angle + ANGLE_STEP },
        ArrowDown: { ...aim, angle: aim.angle - ANGLE_STEP },
        ArrowRight: { ...aim, power: aim.power + POWER_STEP },
        ArrowLeft: { ...aim, power: aim.power - POWER_STEP },
      };

      const next = moved[event.key];
      if (next) {
        // Con la cancha enfocada las flechas apuntan; dejarlas pasar además
        // scrollearía la página debajo del juego en cada corrección.
        event.preventDefault();
        dispatch({ type: 'AIM', aim: clampAim(next) });
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        dispatch({ type: 'SHOOT' });
      }
    },
    [state],
  );

  const bestStreak = Math.max(state.best, storedBest);
  const tier = streakTier(state.streak);
  const faltan = shotsToNextTier(state.streak);
  const scored = state.lastResult === 'in' || state.lastResult === 'perfect';

  return (
    <div className="bg-ink-raised border-line-card flex flex-col gap-12 rounded-2xl border p-8 lg:flex-row lg:items-center lg:p-[45px_49px]">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[9px]">
        <p className="text-orange text-[13px] font-bold tracking-[0.14em] uppercase">Minijuego</p>
        <h3 className="text-[40px] leading-none font-bold">Tirá al aro</h3>
        <p className="text-muted max-w-[460px] text-[17px] leading-[1.6]">
          Arrastrá desde la pelota hacia donde querés que vaya:{' '}
          <strong className="text-soft font-bold">para dónde</strong> es el ángulo y{' '}
          <strong className="text-soft font-bold">qué tan lejos</strong> es la fuerza. Entra limpia
          y son tres.
        </p>

        <div className="mt-3 w-full">
          <AimMeter aim={state.aim} wind={state.wind} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-[22px]">
          <Button
            onClick={() => onShoot()}
            disabled={state.shooting}
            className="px-[34px] py-[15px] uppercase"
          >
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
            {feedbackFor(state.lastResult, state.shooting)}
          </p>
        </div>

        <div className="mt-5">
          <ScoreStats
            stats={[
              { label: 'Encestadas', value: state.made },
              { label: 'Tiros', value: state.attempts },
              {
                label: 'Racha',
                value: state.streak,
                accent: true,
                adornment: (
                  <StreakFire
                    streak={state.streak}
                    reducedMotion={prefersReduced}
                    className="ml-1"
                  />
                ),
              },
            ]}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {bestStreak > 0 ? (
            <p className="text-dim">
              Mejor racha: <span className="text-soft font-semibold">{bestStreak}</span>
            </p>
          ) : null}
          {tier.level > 0 ? (
            <p className="text-orange font-semibold">
              Racha {tier.label}
              {faltan !== null ? (
                <span className="text-dim font-normal"> · {faltan} para el próximo nivel</span>
              ) : (
                <span className="text-dim font-normal"> · nivel máximo</span>
              )}
            </p>
          ) : null}
        </div>
      </div>

      {/*
        La cancha es una zona de juego y no un control suelto, así que se la
        anuncia entera: qué es, cómo está apuntada ahora y con qué teclas se la
        mueve. Sin eso, quien juega con el teclado estaría moviendo a ciegas dos
        números que no se leen en ningún lado.
      */}
      <div
        role="application"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={`Cancha. ${describeAim(state.aim)}. ${describeWind(state.wind)}. Flechas arriba y abajo para el ángulo, izquierda y derecha para la fuerza, Enter para tirar.`}
        className="focus-visible:outline-orange w-full max-w-[460px] shrink-0 self-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <Court
          aim={state.aim}
          wind={state.wind}
          shotId={state.shotId}
          shooting={state.shooting}
          lastResult={state.lastResult}
          reducedMotion={prefersReduced}
          onAim={onAim}
          onShoot={onShoot}
          onResolve={onResolve}
        />
      </div>
    </div>
  );
}
