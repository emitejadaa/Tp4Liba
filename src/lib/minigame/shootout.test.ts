import { describe, expect, it } from 'vitest';
import type { GameState } from './shootout';
import {
  HOOP_MOVES_FROM_STREAK,
  INITIAL_STATE,
  MAX_HOOP_AMPLITUDE,
  MAX_WIND,
  MIN_HOOP_PERIOD,
  WIND_FROM_STREAK,
  confettiCount,
  describeHoop,
  describeWind,
  feedbackFor,
  hoopMotionFor,
  shootoutReducer,
  shotPoints,
  windFor,
} from './shootout';

/** Estado con algunos campos puestos a mano, para probar jugadas concretas. */
const at = (extra: Partial<GameState> = {}): GameState => ({ ...INITIAL_STATE, ...extra });

/** Un tiro entero: sale y se resuelve. */
const play = (state: GameState, result: 'perfect' | 'in' | 'miss') =>
  shootoutReducer(shootoutReducer(state, { type: 'SHOOT' }), { type: 'RESOLVE', result });

describe('shootoutReducer · AIM', () => {
  it('guarda la puntería', () => {
    const next = shootoutReducer(INITIAL_STATE, { type: 'AIM', aim: { angle: 40, power: 0.3 } });
    expect(next.aim).toEqual({ angle: 40, power: 0.3 });
  });

  it('no deja apuntar con la pelota en el aire', () => {
    // El tiro ya salió: corregir el ángulo a mitad de vuelo cambiaría el
    // resultado de un tiro que ya está decidido.
    const volando = at({ shooting: true });
    expect(shootoutReducer(volando, { type: 'AIM', aim: { angle: 10, power: 1 } })).toBe(volando);
  });
});

describe('shootoutReducer · SHOOT', () => {
  it('cuenta el tiro apenas sale', () => {
    // El contador sube cuando la pelota sale de la mano, no cuando cae: si
    // esperara al final, tirar y ver «Tiros 0» durante un segundo se leería
    // como que el juego no registró el tiro.
    const next = shootoutReducer(INITIAL_STATE, { type: 'SHOOT' });
    expect(next.attempts).toBe(1);
    expect(next.shooting).toBe(true);
    expect(next.shotId).toBe(INITIAL_STATE.shotId + 1);
  });

  it('limpia el resultado anterior', () => {
    const next = shootoutReducer(at({ lastResult: 'perfect' }), { type: 'SHOOT' });
    expect(next.lastResult).toBeNull();
  });

  it('no se puede tirar dos veces a la vez', () => {
    const volando = shootoutReducer(INITIAL_STATE, { type: 'SHOOT' });
    expect(shootoutReducer(volando, { type: 'SHOOT' })).toBe(volando);
  });
});

describe('shootoutReducer · RESOLVE', () => {
  it('suma la encestada y la racha', () => {
    const next = play(INITIAL_STATE, 'perfect');
    expect(next.made).toBe(1);
    expect(next.attempts).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.lastResult).toBe('perfect');
    expect(next.shooting).toBe(false);
  });

  it('un tiro que entró rebotando también suma', () => {
    expect(play(INITIAL_STATE, 'in').made).toBe(1);
  });

  it('el fallo cuenta el tiro pero no la encestada', () => {
    const next = play(INITIAL_STATE, 'miss');
    expect(next.attempts).toBe(1);
    expect(next.made).toBe(0);
    expect(next.streak).toBe(0);
  });

  it('corta la racha al fallar', () => {
    expect(play(at({ streak: 6 }), 'miss').streak).toBe(0);
  });

  it('guarda la mejor racha aunque después se corte', () => {
    const buena = play(at({ streak: 4, best: 4 }), 'in');
    expect(buena.best).toBe(5);
    expect(play(buena, 'miss').best).toBe(5);
  });

  it('no resuelve un tiro que no salió', () => {
    expect(shootoutReducer(INITIAL_STATE, { type: 'RESOLVE', result: 'perfect' })).toBe(
      INITIAL_STATE,
    );
  });
});

describe('windFor', () => {
  it('los primeros tiros no tienen viento', () => {
    // Son para agarrarle la mano al arrastre; con viento desde el primero, no
    // se llega a saber qué hizo fallar el tiro.
    for (let streak = 0; streak < WIND_FROM_STREAK; streak += 1) {
      expect(windFor(streak, 1)).toBe(0);
    }
  });

  it('aparece con la racha', () => {
    expect(windFor(WIND_FROM_STREAK, 1)).not.toBe(0);
  });

  it('crece con la racha', () => {
    expect(Math.abs(windFor(10, 2))).toBeGreaterThan(Math.abs(windFor(3, 2)));
  });

  it('tiene tope, para que el juego siga siendo posible', () => {
    for (let streak = 0; streak < 200; streak += 1) {
      expect(Math.abs(windFor(streak, streak))).toBeLessThanOrEqual(MAX_WIND);
    }
  });

  it('cambia de lado entre tiros', () => {
    expect(Math.sign(windFor(8, 4))).not.toBe(Math.sign(windFor(8, 5)));
  });

  it('no siempre sopla con la misma fuerza', () => {
    const fuerzas = new Set([0, 1, 2, 3].map((i) => Math.abs(windFor(8, 2 + i * 2))));
    expect(fuerzas.size).toBeGreaterThan(1);
  });

  it('sale del número de tiro y no del azar', () => {
    // Dos partidas con los mismos tiros se ven igual, y un test que falla se
    // puede reproducir.
    expect(windFor(7, 13)).toBe(windFor(7, 13));
  });

  it('se sortea con la racha ya actualizada y para el tiro que viene', () => {
    // Se guarda al resolver y no al tirar, así se lo puede ver —y corregir el
    // arrastre— antes de soltar el próximo.
    const next = play(at({ streak: WIND_FROM_STREAK }), 'in');
    expect(next.wind).toBe(windFor(next.streak, next.shotId + 1));
  });
});

describe('shootoutReducer · RESET', () => {
  it('vuelve a cero pero conserva el récord y la puntería', () => {
    const jugado = play(at({ best: 6, aim: { angle: 40, power: 0.3 } }), 'in');
    const next = shootoutReducer(jugado, { type: 'RESET' });
    expect(next).toEqual({ ...INITIAL_STATE, best: 6, aim: { angle: 40, power: 0.3 } });
  });
});

describe('shotPoints', () => {
  it('da 3 a la limpia, 2 a la que rebotó y 0 al fallo', () => {
    expect(shotPoints('perfect')).toBe(3);
    expect(shotPoints('in')).toBe(2);
    expect(shotPoints('miss')).toBe(0);
  });
});

describe('feedbackFor', () => {
  it('avisa mientras la pelota está en el aire', () => {
    expect(feedbackFor(null, true)).toBe('Ahí va…');
    expect(feedbackFor('perfect', true)).toBe('Ahí va…');
  });

  it('distingue la limpia de la que entró rebotando', () => {
    expect(feedbackFor('perfect', false)).toBe('¡Limpia! +3');
    expect(feedbackFor('in', false)).toBe('¡Adentro! +2');
  });

  it('explica qué hacer antes del primer tiro', () => {
    expect(feedbackFor(null, false)).toBe('Arrastrá para apuntar');
  });

  it('invita a seguir después de un fallo', () => {
    expect(feedbackFor('miss', false)).toBe('Afuera. Probá de nuevo');
  });
});

describe('confettiCount', () => {
  it('la limpia larga más confeti que la que rebotó, y el fallo ninguno', () => {
    expect(confettiCount('perfect')).toBeGreaterThan(confettiCount('in'));
    expect(confettiCount('miss')).toBe(0);
  });
});

describe('describeWind', () => {
  it('dice para dónde sopla y cuánto', () => {
    expect(describeWind(0)).toBe('Sin viento');
    expect(describeWind(MAX_WIND)).toBe('Viento a favor, 100%');
    expect(describeWind(-MAX_WIND)).toBe('Viento en contra, 100%');
  });
});

describe('hoopMotionFor', () => {
  it('al principio el aro está clavado', () => {
    // El viento ya aparece antes: encimar los dos desde el arranque no deja
    // aprender ninguno de los dos.
    for (let streak = 0; streak < HOOP_MOVES_FROM_STREAK; streak += 1) {
      expect(hoopMotionFor(streak).amplitude).toBe(0);
    }
  });

  it('empieza a moverse al llegar al nivel', () => {
    expect(hoopMotionFor(HOOP_MOVES_FROM_STREAK).amplitude).toBeGreaterThan(0);
  });

  it('cuanto más alta la racha, más recorrido y más rápido', () => {
    const empieza = hoopMotionFor(HOOP_MOVES_FROM_STREAK);
    const avanzada = hoopMotionFor(HOOP_MOVES_FROM_STREAK + 8);

    expect(avanzada.amplitude).toBeGreaterThan(empieza.amplitude);
    // Menos período es más rápido.
    expect(avanzada.period).toBeLessThan(empieza.period);
  });

  it('las dos cosas tienen tope, para que siga siendo posible', () => {
    for (let streak = 0; streak < 300; streak += 1) {
      const { amplitude, period } = hoopMotionFor(streak);
      expect(amplitude).toBeLessThanOrEqual(MAX_HOOP_AMPLITUDE);
      expect(period).toBeGreaterThanOrEqual(MIN_HOOP_PERIOD);
    }
  });
});

describe('describeHoop', () => {
  it('dice si el aro se mueve y a qué ritmo', () => {
    expect(describeHoop({ amplitude: 0, period: 4 })).toBe('Aro fijo');
    expect(describeHoop({ amplitude: 20, period: 4 })).toBe('Aro móvil, sube y baja despacio');
    expect(describeHoop({ amplitude: 30, period: 2 })).toBe('Aro móvil, sube y baja rápido');
  });
});
