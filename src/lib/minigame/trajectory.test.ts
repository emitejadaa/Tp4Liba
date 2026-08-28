import { describe, expect, it } from 'vitest';
import type { ShotResult } from './shootout';
import { RIM_DX, RIM_DY, confettiCount, shotArc } from './trajectory';

const arcs = (result: ShotResult, howMany = 6) =>
  Array.from({ length: howMany }, (_, shotId) => shotArc(result, shotId));

describe('shotArc', () => {
  it('devuelve todas las series con la misma cantidad de puntos', () => {
    for (const result of ['perfect', 'in', 'miss'] as const) {
      for (const arc of arcs(result)) {
        const largo = arc.times.length;
        expect(arc.x).toHaveLength(largo);
        expect(arc.y).toHaveLength(largo);
        expect(arc.scale).toHaveLength(largo);
        expect(arc.rotate).toHaveLength(largo);
      }
    }
  });

  it('arranca siempre en la posición de reposo', () => {
    for (const result of ['perfect', 'in', 'miss'] as const) {
      for (const arc of arcs(result)) {
        expect(arc.x[0]).toBe(0);
        expect(arc.y[0]).toBe(0);
        expect(arc.scale[0]).toBe(1);
        expect(arc.rotate[0]).toBe(0);
      }
    }
  });

  it('los tiempos van de 0 a 1 en orden creciente', () => {
    for (const result of ['perfect', 'in', 'miss'] as const) {
      for (const arc of arcs(result)) {
        expect(arc.times[0]).toBe(0);
        expect(arc.times.at(-1)).toBe(1);
        for (let i = 1; i < arc.times.length; i++) {
          expect(arc.times[i]!).toBeGreaterThan(arc.times[i - 1]!);
        }
      }
    }
  });

  it('las que entran pasan por el centro del aro', () => {
    for (const result of ['perfect', 'in'] as const) {
      for (const arc of arcs(result)) {
        const cruce = arc.times.indexOf(arc.swishAt);
        expect(cruce).toBeGreaterThan(0);
        expect(Math.abs(arc.x[cruce]! - RIM_DX)).toBeLessThanOrEqual(10);
        expect(Math.abs(arc.y[cruce]! - RIM_DY)).toBeLessThanOrEqual(10);
      }
    }
  });

  it('las que entran siguen de largo hacia abajo después del aro', () => {
    for (const result of ['perfect', 'in'] as const) {
      for (const arc of arcs(result)) {
        // En pantalla, más y es más abajo: la pelota atraviesa la red.
        expect(arc.y.at(-1)!).toBeGreaterThan(RIM_DY + 80);
      }
    }
  });

  it('las que fallan nunca cruzan el aro', () => {
    for (const arc of arcs('miss')) {
      expect(arc.swishAt).toBe(1);
      const pasaPorElAro = arc.times.some((_, i) => {
        return Math.abs(arc.x[i]! - RIM_DX) <= 12 && Math.abs(arc.y[i]! - RIM_DY) <= 12;
      });
      expect(pasaPorElAro).toBe(false);
    }
  });

  it('un tiro perfecto siempre entra limpio, con la misma trayectoria', () => {
    const todas = arcs('perfect', 5);
    for (const arc of todas) expect(arc).toEqual(todas[0]);
  });

  it('alterna entre varias trayectorias en los tiros comunes', () => {
    for (const result of ['in', 'miss'] as const) {
      const distintas = new Set(arcs(result, 6).map((arc) => JSON.stringify(arc.x)));
      expect(distintas.size).toBeGreaterThan(1);
    }
  });

  it('es determinista: el mismo tiro da siempre la misma trayectoria', () => {
    expect(shotArc('in', 7)).toEqual(shotArc('in', 7));
    expect(shotArc('miss', 4)).toEqual(shotArc('miss', 4));
  });
});

describe('confettiCount', () => {
  it('sólo larga confeti cuando la pelota entra', () => {
    expect(confettiCount('miss')).toBe(0);
    expect(confettiCount('in')).toBeGreaterThan(0);
  });

  it('festeja más un tiro perfecto', () => {
    expect(confettiCount('perfect')).toBeGreaterThan(confettiCount('in'));
  });
});
