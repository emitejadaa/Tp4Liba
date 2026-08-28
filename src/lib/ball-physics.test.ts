import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOUNCE,
  dribble,
  hasSettled,
  introState,
  squashFor,
  stepBounce,
} from './ball-physics';

/** Corre la simulación hasta que se asiente, o hasta agotar los cuadros. */
function simular(segundos: number, dt = 1 / 60) {
  let estado = introState();
  const alturas: number[] = [];
  for (let i = 0; i < segundos / dt; i++) {
    estado = stepBounce(estado, dt);
    alturas.push(estado.height);
  }
  return { estado, alturas };
}

describe('stepBounce', () => {
  it('cae acelerando desde la altura inicial', () => {
    const primera = stepBounce(introState(2), 1 / 60);
    const segunda = stepBounce(primera, 1 / 60);

    expect(primera.height).toBeLessThan(2);
    // Cada cuadro cae más que el anterior: eso es acelerar.
    expect(2 - primera.height).toBeLessThan(primera.height - segunda.height);
  });

  it('nunca atraviesa el piso', () => {
    const { alturas } = simular(6);
    for (const altura of alturas) {
      expect(altura).toBeGreaterThanOrEqual(DEFAULT_BOUNCE.restHeight);
    }
  });

  it('pica varias veces antes de asentarse', () => {
    const { estado } = simular(6);
    expect(estado.bounces).toBeGreaterThanOrEqual(2);
  });

  it('cada pique es más bajo que el anterior', () => {
    let estado = introState();
    const picos: number[] = [];
    let anterior = estado.height;

    for (let i = 0; i < 600; i++) {
      const siguiente = stepBounce(estado, 1 / 60);
      // Un pico es donde deja de subir y empieza a bajar.
      if (siguiente.height < estado.height && estado.height > anterior) picos.push(estado.height);
      anterior = estado.height;
      estado = siguiente;
    }

    expect(picos.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < picos.length; i++) {
      expect(picos[i]!).toBeLessThan(picos[i - 1]!);
    }
  });

  it('termina quieta', () => {
    const { estado } = simular(10);
    expect(hasSettled(estado)).toBe(true);
  });

  it('no se dispara cuando un cuadro llega muy tarde', () => {
    // Volver de una pestaña en segundo plano manda un delta enorme: integrado
    // de una sola vez, la pelota atravesaría el piso y saldría para arriba.
    let estado = introState();
    for (let i = 0; i < 20; i++) estado = stepBounce(estado, 2);

    expect(estado.height).toBeGreaterThanOrEqual(DEFAULT_BOUNCE.restHeight);
    expect(Number.isFinite(estado.height)).toBe(true);
  });

  it('ignora deltas negativos', () => {
    const estado = introState(1);
    expect(stepBounce(estado, -5).height).toBe(1);
  });

  it('llega al mismo lugar con distinta cadencia de cuadros', () => {
    // A 30 y a 144 Hz la pelota tiene que terminar en el mismo estado, o el
    // movimiento dependería del monitor de cada uno.
    const correr = (dt: number) => {
      let estado = introState();
      for (let t = 0; t < 8; t += dt) estado = stepBounce(estado, dt);
      return estado;
    };

    expect(correr(1 / 30).height).toBeCloseTo(correr(1 / 144).height, 5);
  });
});

describe('dribble', () => {
  it('la impulsa hacia arriba', () => {
    const quieta = { height: 0, velocity: 0, bounces: 3 };
    expect(dribble(quieta).velocity).toBeGreaterThan(0);
  });

  it('deja que vuelva a picar', () => {
    let estado = dribble({ height: 0, velocity: 0, bounces: 0 });
    for (let i = 0; i < 240; i++) estado = stepBounce(estado, 1 / 60);
    expect(estado.bounces).toBeGreaterThan(0);
  });
});

describe('squashFor', () => {
  it('no deforma la pelota en el aire', () => {
    const arriba = squashFor({ height: 2, velocity: -4, bounces: 0 });
    expect(arriba.y).toBeCloseTo(1, 5);
    expect(arriba.x).toBeCloseTo(1, 5);
  });

  it('la aplasta al llegar al piso con velocidad', () => {
    const golpe = squashFor({ height: 0, velocity: -5, bounces: 0 });
    expect(golpe.y).toBeLessThan(1);
    expect(golpe.x).toBeGreaterThan(1);
  });

  it('no deforma si toca el piso sin velocidad', () => {
    const apoyada = squashFor({ height: 0, velocity: 0, bounces: 4 });
    expect(apoyada.y).toBeCloseTo(1, 5);
  });

  it('conserva el volumen: lo que se achata a lo alto se ensancha a lo ancho', () => {
    const golpe = squashFor({ height: 0, velocity: -6, bounces: 0 });
    expect(golpe.x * golpe.y * golpe.z).toBeCloseTo(1, 5);
  });

  it('nunca se aplasta más que el tope', () => {
    const brutal = squashFor({ height: 0, velocity: -500, bounces: 0 }, DEFAULT_BOUNCE, 0.22);
    expect(brutal.y).toBeGreaterThanOrEqual(1 - 0.22);
  });

  it('deforma más cuanto más rápido llega', () => {
    const suave = squashFor({ height: 0, velocity: -2, bounces: 0 });
    const fuerte = squashFor({ height: 0, velocity: -5, bounces: 0 });
    expect(fuerte.y).toBeLessThan(suave.y);
  });
});
