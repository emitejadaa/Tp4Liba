import { INITIAL_AIM, type Aim } from './aim';
import type { ShotResult } from './physics';

export type { ShotResult } from './physics';
export { shotPoints } from './physics';

/**
 * Estado del minijuego «Tirá al aro».
 *
 * Vive acá, sin React ni DOM, por dos motivos: se puede probar sin montar nada,
 * y la vista queda reducida a dibujar un estado. El vuelo de la pelota no está
 * acá: eso lo resuelve el simulador de `physics.ts` cuadro a cuadro y fuera de
 * React, porque meter una posición que cambia sesenta veces por segundo en el
 * estado sería pedirle a React que vuelva a dibujar la página entera por cada
 * cuadro de una pelota.
 *
 * Lo que sí está acá es lo que pasa de a saltos: cuántos tiros van, qué racha
 * hay, y qué viento va a tener el próximo tiro.
 */

/** Racha a partir de la cual empieza a haber viento. */
export const WIND_FROM_STREAK = 2;

/** Viento máximo, en unidades de cancha por segundo al cuadrado. */
export const MAX_WIND = 230;

/**
 * Racha a partir de la cual el aro se pone a subir y bajar.
 *
 * Es el segundo nivel de fuego, así que la dificultad sube donde ya subía algo:
 * el aro empieza a moverse en el mismo tiro en que el fuego cambia de nivel, y
 * las dos cosas se leen como una sola.
 *
 * Llega bastante después del viento a propósito. Son dos problemas distintos: el
 * viento se corrige antes de tirar, mirando el indicador, y el aro móvil se
 * corrige **eligiendo cuándo** soltar. Encimados desde el principio no se
 * aprende ninguno de los dos.
 */
export const HOOP_MOVES_FROM_STREAK = 6;

/** Cuánto sube y baja el aro como mucho, desde su altura de siempre. */
export const MAX_HOOP_AMPLITUDE = 38;

/** Y el ciclo más rápido al que llega, en segundos. */
export const MIN_HOOP_PERIOD = 1.9;

/** El más lento, que es con el que arranca. */
export const MAX_HOOP_PERIOD = 4.4;

export type GameState = {
  /** Con qué ángulo y fuerza va a salir el próximo tiro. */
  aim: Aim;
  /** Viento del próximo tiro. Positivo empuja hacia el aro. */
  wind: number;
  /** Hay una pelota en el aire. */
  shooting: boolean;
  made: number;
  attempts: number;
  streak: number;
  best: number;
  lastResult: ShotResult | null;
  /** Sube en cada tiro; la vista lo usa para remontar el vuelo y el confeti. */
  shotId: number;
};

export const INITIAL_STATE: GameState = {
  aim: INITIAL_AIM,
  wind: 0,
  shooting: false,
  made: 0,
  attempts: 0,
  streak: 0,
  best: 0,
  lastResult: null,
  shotId: 0,
};

export type Action =
  | { type: 'AIM'; aim: Aim }
  /**
   * `aim` es la puntería exacta con la que se soltó el arrastre.
   *
   * Viene con el tiro y no se lee del estado porque el estado puede ir un
   * render atrás: `AIM` se despacha en cada `pointermove` y soltar es el evento
   * siguiente, así que en una máquina cargada el tiro salía con la puntería de
   * un movimiento anterior —más floja que la que se soltó— y el tiro no era el
   * que se apuntó. El botón y el teclado no lo mandan: ahí la puntería del
   * estado es la única que hay.
   */
  | { type: 'SHOOT'; aim?: Aim }
  | { type: 'RESOLVE'; result: ShotResult }
  | { type: 'RESET' };

/**
 * El viento del próximo tiro.
 *
 * Es lo que hace que una racha larga cueste. Sin él, el juego se termina en el
 * momento en que alguien encuentra el arrastre que entra: repetirlo es gratis y
 * la racha deja de significar nada. Con viento, cada tiro es un tiro distinto y
 * hay que corregir, que es lo que hace divertido apuntar.
 *
 * Aparece recién a la tercera encestada seguida —los primeros tiros son para
 * agarrarle la mano— y crece de a poco hasta el tope.
 *
 * Sale de `shotId` y no de `Math.random`, como salían las trayectorias viejas:
 * dos partidas con la misma secuencia de tiros se ven igual, y los tests no
 * dependen del azar. Alterna de lado y cambia de intensidad, así que aprenderse
 * la secuencia no sirve de mucho; lo que sirve es mirar el indicador.
 */
export function windFor(streak: number, shotId: number): number {
  if (streak < WIND_FROM_STREAK) return 0;

  const strength = Math.min(MAX_WIND, 60 + (streak - WIND_FROM_STREAK) * 26);
  const side = shotId % 2 === 0 ? 1 : -1;
  // Cuatro intensidades que se van turnando, para que no sean todos iguales.
  const share = 0.55 + ((shotId * 7) % 4) * 0.15;

  return Math.round(side * strength * share);
}

/**
 * El vaivén del aro para una racha.
 *
 * Crece en las dos cosas a la vez —más recorrido y más rápido— porque son dos
 * dificultades distintas: el recorrido agranda el error de apuntar a donde el
 * aro **va a estar**, y la velocidad achica la ventana para soltar. Una sola de
 * las dos se aprende en unos tiros; las dos juntas obligan a seguir mirando.
 *
 * El desfasaje no sale de acá: lo pone la vista con el reloj en el momento de
 * soltar, porque de eso se trata. Con el aro moviéndose, cuándo se suelta es
 * parte del tiro, y si el desfasaje fuera una cuenta fija se podría aprender de
 * memoria en vez de mirar.
 */
export function hoopMotionFor(streak: number): { amplitude: number; period: number } {
  if (streak < HOOP_MOVES_FROM_STREAK) return { amplitude: 0, period: MAX_HOOP_PERIOD };

  const over = streak - HOOP_MOVES_FROM_STREAK;

  return {
    amplitude: Math.min(MAX_HOOP_AMPLITUDE, 15 + over * 3),
    period: Math.max(MIN_HOOP_PERIOD, MAX_HOOP_PERIOD - over * 0.22),
  };
}

/** Cómo se lee el aro: si se mueve, cuánto y qué tan rápido. */
export function describeHoop({ amplitude, period }: { amplitude: number; period: number }): string {
  if (amplitude === 0) return 'Aro fijo';
  const speed = period <= 2.4 ? 'rápido' : period <= 3.4 ? 'a ritmo medio' : 'despacio';
  return `Aro móvil, sube y baja ${speed}`;
}

export function shootoutReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'AIM':
      // Apuntar con la pelota en el aire no hace nada: el tiro ya salió.
      return state.shooting ? state : { ...state, aim: action.aim };

    case 'SHOOT': {
      if (state.shooting) return state;

      return {
        ...state,
        aim: action.aim ?? state.aim,
        shooting: true,
        attempts: state.attempts + 1,
        lastResult: null,
        shotId: state.shotId + 1,
      };
    }

    case 'RESOLVE': {
      if (!state.shooting) return state;

      const scored = action.result !== 'miss';
      const streak = scored ? state.streak + 1 : 0;

      return {
        ...state,
        shooting: false,
        made: scored ? state.made + 1 : state.made,
        streak,
        best: Math.max(state.best, streak),
        lastResult: action.result,
        // El viento se sortea recién ahora, con la racha ya actualizada, así se
        // puede ver antes de tirar y corregir el arrastre.
        wind: windFor(streak, state.shotId + 1),
      };
    }

    case 'RESET':
      // El récord sobrevive al reinicio: es lo único que se acumula entre
      // partidas. La puntería también, que si no habría que rearmarla de cero.
      return { ...INITIAL_STATE, best: state.best, aim: state.aim };

    default:
      return state;
  }
}

/** Texto de feedback debajo del botón. */
export function feedbackFor(result: ShotResult | null, shooting: boolean): string {
  if (shooting) return 'Ahí va…';

  switch (result) {
    case 'perfect':
      return '¡Limpia! +3';
    case 'in':
      return '¡Adentro! +2';
    case 'miss':
      return 'Afuera. Probá de nuevo';
    default:
      return 'Arrastrá para apuntar';
  }
}

/** Cuántas partículas de confeti larga una encestada. */
export function confettiCount(result: ShotResult): number {
  if (result === 'perfect') return 18;
  if (result === 'in') return 12;
  return 0;
}

/** Cómo se lee el viento: de qué lado sopla y con cuánta fuerza. */
export function describeWind(wind: number): string {
  if (wind === 0) return 'Sin viento';
  const share = Math.round((Math.abs(wind) / MAX_WIND) * 100);
  return `Viento ${wind > 0 ? 'a favor' : 'en contra'}, ${share}%`;
}
