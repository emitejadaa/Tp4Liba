import { describe, expect, it } from 'vitest';
import type { GameState } from './shootout';
import {
  BASE_ZONE_HALF_WIDTH,
  INITIAL_STATE,
  MAX_SPEED,
  MIN_ZONE_HALF_WIDTH,
  aimSpeed,
  computeShot,
  feedbackFor,
  shootoutReducer,
  shotPoints,
  zoneHalfWidth,
} from './shootout';

/** Estado con la mira puesta a mano, para probar tiros concretos. */
const at = (aim: number, extra: Partial<GameState> = {}): GameState => ({
  ...INITIAL_STATE,
  aim,
  ...extra,
});

describe('zoneHalfWidth', () => {
  it('arranca en el ancho base', () => {
    expect(zoneHalfWidth(0)).toBe(BASE_ZONE_HALF_WIDTH);
  });

  it('se angosta a medida que crece la racha', () => {
    expect(zoneHalfWidth(3)).toBeLessThan(zoneHalfWidth(0));
  });

  it('nunca baja del mínimo, para que el juego siga siendo posible', () => {
    expect(zoneHalfWidth(1000)).toBe(MIN_ZONE_HALF_WIDTH);
  });
});

describe('aimSpeed', () => {
  it('acelera con la racha', () => {
    expect(aimSpeed(5)).toBeGreaterThan(aimSpeed(0));
  });

  it('tiene tope', () => {
    expect(aimSpeed(1000)).toBe(MAX_SPEED);
  });
});

describe('computeShot', () => {
  it('es perfecto en el centro exacto', () => {
    expect(computeShot(0.5, 0)).toBe('perfect');
  });

  it('entra dentro de la zona pero fuera del centro', () => {
    expect(computeShot(0.5 + BASE_ZONE_HALF_WIDTH * 0.8, 0)).toBe('in');
  });

  it('falla fuera de la zona', () => {
    expect(computeShot(0.5 + BASE_ZONE_HALF_WIDTH * 1.5, 0)).toBe('miss');
  });

  it('trata igual los dos lados de la barra', () => {
    const offset = BASE_ZONE_HALF_WIDTH * 0.8;
    expect(computeShot(0.5 - offset, 0)).toBe(computeShot(0.5 + offset, 0));
  });

  it('un tiro que entraba con racha 0 puede fallar con la zona angostada', () => {
    const aim = 0.5 + BASE_ZONE_HALF_WIDTH * 0.95;
    expect(computeShot(aim, 0)).toBe('in');
    expect(computeShot(aim, 6)).toBe('miss');
  });
});

describe('shotPoints', () => {
  it('da 3 al perfecto, 2 al que entra y 0 al fallo', () => {
    expect(shotPoints('perfect')).toBe(3);
    expect(shotPoints('in')).toBe(2);
    expect(shotPoints('miss')).toBe(0);
  });
});

describe('shootoutReducer · TICK', () => {
  it('mueve la mira en la dirección actual', () => {
    const next = shootoutReducer(at(0.5), { type: 'TICK', deltaSeconds: 0.1 });
    expect(next.aim).toBeGreaterThan(0.5);
  });

  it('rebota al llegar al borde derecho', () => {
    const next = shootoutReducer(at(0.98), { type: 'TICK', deltaSeconds: 0.2 });
    expect(next.direction).toBe(-1);
    expect(next.aim).toBeLessThanOrEqual(1);
  });

  it('rebota al llegar al borde izquierdo', () => {
    const next = shootoutReducer(at(0.02, { direction: -1 }), {
      type: 'TICK',
      deltaSeconds: 0.2,
    });
    expect(next.direction).toBe(1);
    expect(next.aim).toBeGreaterThanOrEqual(0);
  });

  it('se mantiene dentro de la barra aunque el frame llegue muy tarde', () => {
    // Una pestaña en segundo plano puede acumular varios segundos en un frame.
    const next = shootoutReducer(at(0.5), { type: 'TICK', deltaSeconds: 12 });
    expect(next.aim).toBeGreaterThanOrEqual(0);
    expect(next.aim).toBeLessThanOrEqual(1);
  });
});

describe('shootoutReducer · SHOOT', () => {
  it('cuenta el tiro y la encestada', () => {
    const next = shootoutReducer(at(0.5), { type: 'SHOOT' });
    expect(next.attempts).toBe(1);
    expect(next.made).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.lastResult).toBe('perfect');
  });

  it('cuenta el tiro pero no la encestada al fallar', () => {
    const next = shootoutReducer(at(0.95), { type: 'SHOOT' });
    expect(next.attempts).toBe(1);
    expect(next.made).toBe(0);
    expect(next.lastResult).toBe('miss');
  });

  it('corta la racha al fallar', () => {
    const next = shootoutReducer(at(0.95, { streak: 4 }), { type: 'SHOOT' });
    expect(next.streak).toBe(0);
  });

  it('guarda la mejor racha aunque después se corte', () => {
    const scored = shootoutReducer(at(0.5, { streak: 4, best: 4 }), { type: 'SHOOT' });
    expect(scored.best).toBe(5);

    const missed = shootoutReducer({ ...scored, aim: 0.95 }, { type: 'SHOOT' });
    expect(missed.streak).toBe(0);
    expect(missed.best).toBe(5);
  });

  it('avanza el identificador de tiro para poder reiniciar la animación', () => {
    const next = shootoutReducer(at(0.5), { type: 'SHOOT' });
    expect(next.shotId).toBe(INITIAL_STATE.shotId + 1);
  });
});

describe('shootoutReducer · RESET', () => {
  it('vuelve a cero pero conserva el récord', () => {
    const next = shootoutReducer(at(0.9, { made: 3, attempts: 7, streak: 2, best: 6 }), {
      type: 'RESET',
    });
    expect(next).toEqual({ ...INITIAL_STATE, best: 6 });
  });
});

describe('feedbackFor', () => {
  it('usa los mensajes del diseño', () => {
    expect(feedbackFor(null)).toBe('Esperá la zona naranja');
    expect(feedbackFor('in')).toBe('¡Adentro! +2');
    expect(feedbackFor('perfect')).toBe('¡Triple! +3');
    expect(feedbackFor('miss')).toBe('Afuera. Probá de nuevo');
  });
});
