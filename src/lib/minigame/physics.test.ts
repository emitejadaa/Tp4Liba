import { describe, expect, it } from 'vitest';
import { BALL_RADIUS, COURT_WIDTH, FLOOR_Y, LAUNCH, RIM } from './court';
import { INITIAL_AIM, launchVelocity } from './aim';
import {
  MAX_FLIGHT_SECONDS,
  STEP_SECONDS,
  advanceShot,
  launchShot,
  previewPath,
  simulateShot,
  shotPoints,
} from './physics';

const NO_WIND = { wind: 0 };

/** Tira con un ángulo y una fuerza y devuelve el tiro terminado. */
const shoot = (angle: number, power: number, wind = 0) =>
  simulateShot(launchVelocity({ angle, power }), { wind });

/**
 * Recorre un tiro paso a paso y cuenta qué pasó **durante el vuelo**.
 *
 * Mirar el tiro terminado no alcanza para casi nada: la pelota sigue picando
 * después de entrar, así que al final tocó el aro, la tabla y el piso aunque
 * haya entrado limpia, y termina rodando lejos de donde cayó.
 */
function trace(angle: number, power: number, wind = 0) {
  let shot = launchShot(launchVelocity({ angle, power }));
  let apexY = shot.body.y;
  let atScore = { touchedRim: false, touchedBoard: false };

  while (!shot.settled) {
    const before = shot;
    shot = advanceShot(shot, { wind }, STEP_SECONDS);
    apexY = Math.min(apexY, shot.body.y);
    if (before.scoredAt === null && shot.scoredAt !== null) {
      atScore = { touchedRim: shot.touchedRim, touchedBoard: shot.touchedBoard };
    }
  }

  return { shot, apexY, atScore };
}

/** Dónde está la pelota a mitad de vuelo, antes de que el piso meta la cola. */
function midFlight(angle: number, power: number, wind = 0) {
  let shot = launchShot(launchVelocity({ angle, power }));
  while (shot.elapsed < 0.45 && !shot.settled) shot = advanceShot(shot, { wind }, STEP_SECONDS);
  return shot.body;
}

describe('simulateShot', () => {
  it('siempre termina', () => {
    // Sin esta garantía el bucle de dibujo se queda pidiendo cuadros para
    // siempre y el juego se come una pestaña entera.
    for (let angle = -8; angle <= 92; angle += 4) {
      for (let power = 0; power <= 1; power += 0.1) {
        const shot = shoot(angle, power);
        expect(shot.settled).toBe(true);
        expect(shot.result).not.toBeNull();
        expect(shot.elapsed).toBeLessThanOrEqual(MAX_FLIGHT_SECONDS + STEP_SECONDS);
      }
    }
  });

  it('la pelota nunca se va de la cancha', () => {
    for (let angle = 0; angle <= 92; angle += 6) {
      for (let power = 0; power <= 1; power += 0.15) {
        const { body } = shoot(angle, power);
        expect(body.x).toBeGreaterThanOrEqual(BALL_RADIUS - 0.5);
        expect(body.x).toBeLessThanOrEqual(COURT_WIDTH - BALL_RADIUS + 0.5);
        expect(body.y).toBeLessThanOrEqual(FLOOR_Y - BALL_RADIUS + 0.5);
      }
    }
  });

  it('la puntería inicial entra limpia', () => {
    // Es lo que hace que el primer tiro enseñe a jugar en vez de castigar por
    // no saber todavía, y lo que le da sentido al botón «Tirar».
    expect(simulateShot(launchVelocity(INITIAL_AIM), NO_WIND).result).toBe('perfect');
  });

  it('una entrada limpia es la que no tocó nada al cruzar', () => {
    const { shot, atScore } = trace(INITIAL_AIM.angle, INITIAL_AIM.power);
    expect(shot.result).toBe('perfect');
    expect(atScore).toEqual({ touchedRim: false, touchedBoard: false });
  });

  it('un tiro flojo ni llega a la altura del aro', () => {
    const { shot, apexY } = trace(INITIAL_AIM.angle, 0.1);
    expect(shot.result).toBe('miss');
    // El eje Y crece hacia abajo: quedar por debajo del aro es tener más Y.
    expect(apexY).toBeGreaterThan(RIM.y);
  });

  it('un tiro pasado de fuerza se va largo', () => {
    const shot = shoot(INITIAL_AIM.angle, 1);
    expect(shot.result).toBe('miss');
  });

  it('un tiro casi horizontal no llega nunca al aro', () => {
    expect(shoot(-8, 1).result).toBe('miss');
  });

  it('con la misma entrada da siempre lo mismo', () => {
    // El juego no usa `Math.random` en ninguna parte: dos partidas con los
    // mismos tiros se ven igual, y un test que falla se puede reproducir.
    const a = shoot(64, 0.7);
    const b = shoot(64, 0.7);
    expect(a.result).toBe(b.result);
    expect(a.body.x).toBeCloseTo(b.body.x, 10);
    expect(a.body.y).toBeCloseTo(b.body.y, 10);
  });
});

describe('simulateShot · el aro', () => {
  it('hay tiros que entran después de tocar', () => {
    /*
     * Es la razón de tener física y no una animación: una animación tiene que
     * decidir antes de empezar si el tiro entra. Acá pega en el aro, rebota y el
     * resultado se sabe recién cuando cae.
     */
    const rebotados = [];
    for (let angle = 50; angle <= 80; angle += 1) {
      for (let p = 55; p <= 100; p += 1) {
        const shot = shoot(angle, p / 100);
        if (shot.result === 'in' && (shot.touchedRim || shot.touchedBoard)) rebotados.push(shot);
      }
    }
    expect(rebotados.length).toBeGreaterThan(20);
  });

  it('entrar tocando vale menos que entrar limpia', () => {
    expect(shotPoints('perfect')).toBe(3);
    expect(shotPoints('in')).toBe(2);
    expect(shotPoints('miss')).toBe(0);
  });

  it('subir a través del aro no cuenta', () => {
    /*
     * Un tiro casi vertical pasa por la boca del aro de abajo hacia arriba antes
     * de caer. Si el cruce no mirara la dirección, ese tiro contaría dos veces
     * y hasta contaría cuando después se va para cualquier lado.
     */
    const shot = shoot(90, 0.2);
    expect(shot.result).toBe('miss');
  });
});

describe('simulateShot · el viento', () => {
  /*
   * Se compara a mitad de vuelo y no dónde quedó la pelota: después de caer
   * sigue picando y rodando, y adónde llegó rodando no dice nada del viento.
   */
  it('a favor empuja la pelota más lejos', () => {
    expect(midFlight(60, 0.5, 200).x).toBeGreaterThan(midFlight(60, 0.5).x);
  });

  it('en contra la deja más cerca', () => {
    expect(midFlight(60, 0.5, -200).x).toBeLessThan(midFlight(60, 0.5).x);
  });

  it('puede dar vuelta un tiro que entraba', () => {
    // Es para lo que está: que la racha cueste porque el tiro de antes ya no
    // sirve tal cual y hay que corregirlo.
    expect(simulateShot(launchVelocity(INITIAL_AIM), NO_WIND).result).toBe('perfect');
    expect(simulateShot(launchVelocity(INITIAL_AIM), { wind: -230 }).result).toBe('miss');
  });
});

describe('advanceShot', () => {
  it('avanzar de a poco da lo mismo que avanzar de una', () => {
    /*
     * Es la razón del paso fijo. Con el delta del cuadro, la misma pelota entra
     * en una pantalla de 120 Hz y pega en el aro en una de 60. Acá el resultado
     * no depende de en cuántos pedazos se parta el tiempo.
     */
    const velocity = launchVelocity(INITIAL_AIM);
    let shot = launchShot(velocity);
    while (!shot.settled) shot = advanceShot(shot, NO_WIND, 1 / 37);

    const deUna = simulateShot(velocity, NO_WIND);
    expect(shot.result).toBe(deUna.result);
    expect(shot.body.x).toBeCloseTo(deUna.body.x, 6);
  });

  it('recorta un salto de tiempo enorme', () => {
    // Volver a una pestaña que estuvo en segundo plano no puede teletransportar
    // la pelota media cancha de un cuadro al otro.
    const shot = advanceShot(launchShot(launchVelocity(INITIAL_AIM)), NO_WIND, 30);
    expect(shot.elapsed).toBeLessThanOrEqual(0.25 + STEP_SECONDS);
  });

  it('no sigue avanzando un tiro terminado', () => {
    const terminado = simulateShot(launchVelocity(INITIAL_AIM), NO_WIND);
    expect(advanceShot(terminado, NO_WIND, 1).elapsed).toBe(terminado.elapsed);
  });
});

describe('previewPath', () => {
  it('devuelve la cantidad de puntos pedida', () => {
    expect(previewPath(launchVelocity(INITIAL_AIM), NO_WIND, 0.3, 8)).toHaveLength(8);
  });

  it('arranca en la pelota y sube', () => {
    const path = previewPath(launchVelocity(INITIAL_AIM), NO_WIND, 0.3, 8);
    expect(path[0]!.x).toBeGreaterThan(LAUNCH.x);
    expect(path[0]!.y).toBeLessThan(LAUNCH.y);
  });

  it('no llega al aro: es una ayuda, no la respuesta', () => {
    const path = previewPath(launchVelocity(INITIAL_AIM), NO_WIND, 0.34, 9);
    expect(path.at(-1)!.x).toBeLessThan(RIM.front);
  });

  it('ignora los choques, así que nunca rebota hacia atrás', () => {
    const path = previewPath(launchVelocity({ angle: 45, power: 1 }), NO_WIND, 1.2, 40);
    for (let index = 1; index < path.length; index += 1) {
      expect(path[index]!.x).toBeGreaterThan(path[index - 1]!.x);
    }
  });
});
