import { describe, expect, it } from 'vitest';
import {
  INITIAL_AIM,
  MAX_ANGLE,
  MAX_DRAG,
  MAX_SPEED,
  MIN_ANGLE,
  MIN_DRAG,
  MIN_SPEED,
  aimFromDrag,
  clampAim,
  describeAim,
  launchVelocity,
} from './aim';

describe('aimFromDrag', () => {
  it('no es un tiro si el arrastre fue muy corto', () => {
    // Apoyar el dedo y levantarlo sin mover cancela. Sin este piso, cualquier
    // tap sobre la cancha saldría como un tiro flojísimo que corta la racha.
    expect(aimFromDrag(0, 0)).toBeNull();
    expect(aimFromDrag(MIN_DRAG - 1, 0)).toBeNull();
  });

  it('arrastrar hacia arriba y a la derecha apunta hacia arriba y a la derecha', () => {
    // El gesto es el de tirar, no el de una gomera: la pelota va para donde fue
    // el dedo. En pantalla el eje Y crece hacia abajo, así que subir es negativo.
    const aim = aimFromDrag(60, -60)!;
    expect(aim.angle).toBeCloseTo(45, 0);
  });

  it('arrastrar derecho a la derecha es el tiro más plano', () => {
    expect(aimFromDrag(80, 0)!.angle).toBeCloseTo(0, 0);
  });

  it('arrastrar derecho para arriba es el tiro más vertical', () => {
    expect(aimFromDrag(0, -80)!.angle).toBeCloseTo(90, 0);
  });

  it('cuanto más largo el arrastre, más fuerza', () => {
    expect(aimFromDrag(100, 0)!.power).toBeGreaterThan(aimFromDrag(50, 0)!.power);
  });

  it('la fuerza llega al máximo y se queda ahí', () => {
    expect(aimFromDrag(MAX_DRAG, 0)!.power).toBe(1);
    expect(aimFromDrag(MAX_DRAG * 4, 0)!.power).toBe(1);
  });

  it('el ángulo tiene topes', () => {
    // Un arrastre hacia abajo o hacia atrás no tira la pelota para atrás: se
    // recorta al tiro más plano, y la guía muestra lo que va a pasar.
    expect(aimFromDrag(60, 90)!.angle).toBe(MIN_ANGLE);
    expect(aimFromDrag(-60, -20)!.angle).toBeLessThanOrEqual(MAX_ANGLE);
    expect(aimFromDrag(-60, -20)!.angle).toBeGreaterThanOrEqual(MIN_ANGLE);
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
