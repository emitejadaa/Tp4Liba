import { describe, expect, it } from 'vitest';
import {
  DEAD_ZONE,
  INITIAL_AIM,
  MAX_ANGLE,
  MAX_PULL,
  MAX_SPEED,
  MIN_ANGLE,
  MIN_SPEED,
  aimFromPull,
  clampAim,
  describeAim,
  launchVelocity,
  pullFor,
} from './aim';

describe('aimFromPull', () => {
  it('con el dedo encima de la pelota no hay tiro', () => {
    // Es la manera de arrepentirse: llevar el dedo de vuelta a la pelota. Y es
    // lo que evita que un toque suelto sobre la cancha salga como un tiro.
    expect(aimFromPull(0, 0)).toBeNull();
    expect(aimFromPull(DEAD_ZONE - 1, 0)).toBeNull();
  });

  it('el dedo arriba y a la derecha apunta arriba y a la derecha', () => {
    // El gesto es el de tirar, no el de una gomera: la pelota va para donde está
    // el dedo. En pantalla el eje Y crece hacia abajo, así que arriba es negativo.
    expect(aimFromPull(60, -60)!.angle).toBeCloseTo(45, 0);
  });

  it('el dedo al ras de la pelota es el tiro más plano', () => {
    expect(aimFromPull(80, 0)!.angle).toBeCloseTo(0, 0);
  });

  it('el dedo justo encima es el tiro más vertical', () => {
    expect(aimFromPull(0, -80)!.angle).toBeCloseTo(90, 0);
  });

  it('cuanto más lejos el dedo, más fuerza', () => {
    expect(aimFromPull(100, 0)!.power).toBeGreaterThan(aimFromPull(50, 0)!.power);
  });

  it('la fuerza llega al máximo y se queda ahí', () => {
    expect(aimFromPull(MAX_PULL, 0)!.power).toBe(1);
    expect(aimFromPull(MAX_PULL * 4, 0)!.power).toBe(1);
  });

  it('el ángulo tiene topes', () => {
    // El dedo por debajo o por detrás de la pelota no la tira para atrás: se
    // recorta al tiro más plano, y la banda muestra el tiro recortado.
    expect(aimFromPull(60, 90)!.angle).toBe(MIN_ANGLE);
    expect(aimFromPull(-60, -20)!.angle).toBeLessThanOrEqual(MAX_ANGLE);
    expect(aimFromPull(-60, -20)!.angle).toBeGreaterThanOrEqual(MIN_ANGLE);
  });

  it('no depende de dónde se apretó, sólo de dónde está el dedo', () => {
    /*
     * Es la diferencia con medir el arrastre desde donde se apretó. Así, dos
     * dedos en el mismo punto de la cancha dan el mismo tiro siempre, y no uno
     * distinto según de dónde vinieron.
     */
    expect(aimFromPull(90, -70)).toEqual(aimFromPull(90, -70));
  });
});

describe('pullFor', () => {
  it('es la vuelta de `aimFromPull`', () => {
    for (const aim of [INITIAL_AIM, { angle: 20, power: 0 }, { angle: 88, power: 1 }]) {
      const { x, y } = pullFor(aim);
      const round = aimFromPull(x, y)!;
      expect(round.angle).toBeCloseTo(aim.angle, 6);
      expect(round.power).toBeCloseTo(aim.power, 6);
    }
  });

  it('con fuerza cero el tirón llega justo al borde de la zona muerta', () => {
    // Si fuera más corto, la banda arrancaría adentro de la zona donde no hay
    // tiro y el dibujo diría lo contrario que el juego.
    const { x, y } = pullFor({ angle: 45, power: 0 });
    expect(Math.hypot(x, y)).toBeCloseTo(DEAD_ZONE, 6);
  });

  it('la banda se planta en el tope en vez de seguir al dedo', () => {
    const { x, y } = pullFor({ angle: 45, power: 1 });
    expect(Math.hypot(x, y)).toBeCloseTo(MAX_PULL, 6);
  });
});

describe('launchVelocity', () => {
  it('la fuerza cero es el tiro más flojo y la uno el más fuerte', () => {
    expect(Math.hypot(...Object.values(launchVelocity({ angle: 45, power: 0 })))).toBeCloseTo(
      MIN_SPEED,
      6,
    );
    expect(Math.hypot(...Object.values(launchVelocity({ angle: 45, power: 1 })))).toBeCloseTo(
      MAX_SPEED,
      6,
    );
  });

  it('un ángulo positivo sale hacia arriba', () => {
    expect(launchVelocity({ angle: 60, power: 0.5 }).vy).toBeLessThan(0);
  });

  it('y nunca hacia atrás: el tope de arriba es la vertical', () => {
    // Un tiro que sale para atrás no es un tiro difícil, es un control roto.
    for (let angle = MIN_ANGLE; angle <= MAX_ANGLE; angle += 2) {
      expect(launchVelocity({ angle, power: 0.5 }).vx).toBeGreaterThanOrEqual(-1e-9);
    }
  });
});

describe('clampAim', () => {
  it('mantiene la puntería dentro de sus topes', () => {
    expect(clampAim({ angle: 200, power: 9 })).toEqual({ angle: MAX_ANGLE, power: 1 });
    expect(clampAim({ angle: -200, power: -9 })).toEqual({ angle: MIN_ANGLE, power: 0 });
  });
});

describe('describeAim', () => {
  it('dice los dos números, que es lo único que se oye con el teclado', () => {
    expect(describeAim({ angle: 63.4, power: 0.62 })).toBe('Ángulo 63 grados, fuerza 62%');
  });
});

describe('INITIAL_AIM', () => {
  it('está dentro de los topes', () => {
    expect(clampAim(INITIAL_AIM)).toEqual(INITIAL_AIM);
  });
});
