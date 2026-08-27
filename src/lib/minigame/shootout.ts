/**
 * Lógica del minijuego «Tirá al aro».
 *
 * Vive acá, sin React ni DOM, por dos motivos: se puede probar sin montar nada,
 * y la vista queda reducida a dibujar un estado. La mira se mueve sola sobre una
 * barra de 0 a 1; cuando alguien tira, se mira dónde estaba la mira respecto de
 * la zona naranja.
 */

/** Mitad del ancho de la zona naranja, sobre una barra de 0 a 1. */
export const BASE_ZONE_HALF_WIDTH = 0.09;

/** La zona nunca se achica más que esto, o el juego se vuelve imposible. */
export const MIN_ZONE_HALF_WIDTH = 0.035;

/** Porción central de la zona que cuenta como tiro perfecto. */
export const PERFECT_RATIO = 0.28;

/** Recorridos por segundo de la mira al empezar. */
export const BASE_SPEED = 0.55;

/** Tope de velocidad, para que siga siendo jugable. */
export const MAX_SPEED = 1.5;

export type ShotResult = 'perfect' | 'in' | 'miss';

export type GameState = {
  /** Posición de la mira, de 0 a 1. */
  aim: number;
  /** Dirección del movimiento: 1 hacia la derecha, -1 hacia la izquierda. */
  direction: 1 | -1;
  made: number;
  attempts: number;
  streak: number;
  best: number;
  lastResult: ShotResult | null;
  /** Sube en cada tiro; la vista lo usa para reiniciar la animación del balón. */
  shotId: number;
};

export const INITIAL_STATE: GameState = {
  aim: 0.5,
  direction: 1,
  made: 0,
  attempts: 0,
  streak: 0,
  best: 0,
  lastResult: null,
  shotId: 0,
};

export type Action =
  /** Avanza la mira `deltaSeconds` segundos. */
  { type: 'TICK'; deltaSeconds: number } | { type: 'SHOOT' } | { type: 'RESET' };

/**
 * La zona naranja se angosta a medida que crece la racha, pero nunca por debajo
 * de `MIN_ZONE_HALF_WIDTH`: si no, a partir de cierta racha sería imposible
 * acertar y el juego dejaría de premiar la puntería para castigarla.
 */
export function zoneHalfWidth(streak: number): number {
  return Math.max(MIN_ZONE_HALF_WIDTH, BASE_ZONE_HALF_WIDTH - streak * 0.008);
}

/** La mira acelera con la racha, con tope para que siga siendo jugable. */
export function aimSpeed(streak: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + streak * 0.09);
}

/** Clasifica un tiro según dónde estaba la mira. */
export function computeShot(aim: number, streak: number): ShotResult {
  const half = zoneHalfWidth(streak);
  const distance = Math.abs(aim - 0.5);

  if (distance <= half * PERFECT_RATIO) return 'perfect';
  if (distance <= half) return 'in';
  return 'miss';
}

/** Puntos que suma cada resultado: 2 desde afuera del arco, 3 si es perfecto. */
export function shotPoints(result: ShotResult): number {
  if (result === 'perfect') return 3;
  if (result === 'in') return 2;
  return 0;
}

/**
 * Mueve la mira rebotando en los extremos.
 *
 * Reflejar la posición en vez de recortarla evita que la mira se quede pegada a
 * un borde cuando un frame llega tarde y el paso es mayor que lo que falta.
 */
function advanceAim(
  aim: number,
  direction: 1 | -1,
  distance: number,
): Pick<GameState, 'aim' | 'direction'> {
  let next = aim + direction * distance;
  let nextDirection = direction;

  // Con pestañas en segundo plano un solo frame puede cubrir varios rebotes.
  while (next < 0 || next > 1) {
    next = next < 0 ? -next : 2 - next;
    nextDirection = nextDirection === 1 ? -1 : 1;
  }

  return { aim: next, direction: nextDirection };
}

export function shootoutReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'TICK': {
      const distance = aimSpeed(state.streak) * action.deltaSeconds;
      return { ...state, ...advanceAim(state.aim, state.direction, distance) };
    }

    case 'SHOOT': {
      const result = computeShot(state.aim, state.streak);
      const scored = result !== 'miss';
      const streak = scored ? state.streak + 1 : 0;

      return {
        ...state,
        attempts: state.attempts + 1,
        made: scored ? state.made + 1 : state.made,
        streak,
        best: Math.max(state.best, streak),
        lastResult: result,
        shotId: state.shotId + 1,
      };
    }

    case 'RESET':
      // El récord sobrevive al reinicio: es lo único que se acumula entre partidas.
      return { ...INITIAL_STATE, best: state.best };

    default:
      return state;
  }
}

/** Texto de feedback, con los mismos mensajes que muestra el diseño. */
export function feedbackFor(result: ShotResult | null): string {
  switch (result) {
    case 'perfect':
      return '¡Triple! +3';
    case 'in':
      return '¡Adentro! +2';
    case 'miss':
      return 'Afuera. Probá de nuevo';
    default:
      return 'Esperá la zona naranja';
  }
}
