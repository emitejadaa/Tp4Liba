import { describe, expect, it } from 'vitest';
import type { Seam } from './basketball-texture';
import {
  SEAMS,
  SEAM_WIDTH,
  distanceToNearestSeam,
  distanceToSeam,
  grainAt,
  sphereAt,
} from './basketball-texture';

const norm = ({ x, y, z }: { x: number; y: number; z: number }) => Math.hypot(x, y, z);

describe('sphereAt', () => {
  it('devuelve siempre un punto sobre la esfera unitaria', () => {
    for (let u = 0; u <= 1; u += 0.125) {
      for (let v = 0; v <= 1; v += 0.125) {
        expect(norm(sphereAt(u, v))).toBeCloseTo(1, 10);
      }
    }
  });

  it('manda el borde superior del mapa al polo norte', () => {
    expect(sphereAt(0.5, 0).y).toBeCloseTo(1, 10);
  });

  it('manda el borde inferior al polo sur', () => {
    expect(sphereAt(0.5, 1).y).toBeCloseTo(-1, 10);
  });

  it('cierra la vuelta: la longitud 0 y la 1 son el mismo punto', () => {
    const inicio = sphereAt(0, 0.5);
    const fin = sphereAt(1, 0.5);
    expect(fin.x).toBeCloseTo(inicio.x, 10);
    expect(fin.z).toBeCloseTo(inicio.z, 10);
  });
});

describe('distanceToSeam', () => {
  it('da cero sobre el círculo máximo del ecuador', () => {
    const seam: Seam = { kind: 'great', axis: 'y' };
    expect(distanceToSeam(sphereAt(0.3, 0.5), seam)).toBeCloseTo(0, 10);
  });

  it('crece al alejarse del ecuador', () => {
    const seam: Seam = { kind: 'great', axis: 'y' };
    const cerca = distanceToSeam(sphereAt(0.3, 0.55), seam);
    const lejos = distanceToSeam(sphereAt(0.3, 0.75), seam);
    expect(lejos).toBeGreaterThan(cerca);
  });

  it('da cero sobre el círculo menor', () => {
    const seam: Seam = { kind: 'small', polarAngle: 0.97 };
    // Un punto cuyo ángulo polar respecto de +z es exactamente 0.97.
    const point = { x: Math.sin(0.97), y: 0, z: Math.cos(0.97) };
    expect(distanceToSeam(point, seam)).toBeCloseTo(0, 10);
  });

  it('nunca devuelve una distancia negativa', () => {
    for (const seam of SEAMS) {
      for (let u = 0; u <= 1; u += 0.2) {
        for (let v = 0; v <= 1; v += 0.2) {
          expect(distanceToSeam(sphereAt(u, v), seam)).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe('distanceToNearestSeam', () => {
  it('reconoce el cruce de las dos costuras rectas', () => {
    // Donde se cruzan el ecuador y el meridiano la distancia es cero.
    expect(distanceToNearestSeam({ x: 0, y: 0, z: 1 })).toBeCloseTo(0, 10);
  });

  it('deja gajos anchos entre costura y costura', () => {
    // En vez de apostar a un punto, buscamos el más alejado de toda costura: el
    // centro del gajo más grande tiene que estar bien lejos del ancho de trazo,
    // o la pelota se vería rayada en lugar de tener paneles.
    let masLejano = 0;
    for (let u = 0; u < 1; u += 0.005) {
      for (let v = 0; v < 1; v += 0.005) {
        masLejano = Math.max(masLejano, distanceToNearestSeam(sphereAt(u, v)));
      }
    }
    expect(masLejano).toBeGreaterThan(SEAM_WIDTH * 6);
  });

  it('marca como costura una franja acotada de la esfera', () => {
    let sobreCostura = 0;
    let total = 0;
    for (let u = 0; u < 1; u += 0.01) {
      for (let v = 0; v < 1; v += 0.01) {
        total++;
        if (distanceToNearestSeam(sphereAt(u, v)) < SEAM_WIDTH) sobreCostura++;
      }
    }
    const proporcion = sobreCostura / total;
    // Ni una pelota lisa ni una pelota negra: las costuras son una minoría.
    expect(proporcion).toBeGreaterThan(0.02);
    expect(proporcion).toBeLessThan(0.35);
  });
});

describe('grainAt', () => {
  it('devuelve valores entre 0 y 1', () => {
    for (let x = 0; x < 50; x++) {
      const value = grainAt(x, x * 7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('es determinista, así la textura no cambia entre recargas', () => {
    expect(grainAt(12, 34)).toBe(grainAt(12, 34));
  });

  it('varía entre píxeles vecinos, que es lo que da el granulado', () => {
    const valores = new Set(Array.from({ length: 20 }, (_, i) => grainAt(i, 5)));
    expect(valores.size).toBeGreaterThan(15);
  });
});
