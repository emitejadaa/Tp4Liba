import { describe, expect, it } from 'vitest';
import { DEFAULT_DEPTH, PLATEAU, pushAt, tiltAt, travelAt } from './depth';

describe('travelAt', () => {
  it('vale 0 en todo el centro del recorrido', () => {
    // La meseta es lo que hace que se pueda leer una sección sin que se mueva.
    for (let p = 0.5 - PLATEAU / 2; p <= 0.5 + PLATEAU / 2; p += 0.01) {
      expect(travelAt(p)).toBeCloseTo(0, 10);
    }
  });

  it('llega a -1 entrando y a 1 saliendo', () => {
    expect(travelAt(0)).toBeCloseTo(-1, 10);
    expect(travelAt(1)).toBeCloseTo(1, 10);
  });

  it('es monótono: nunca vuelve para atrás al avanzar el scroll', () => {
    let anterior = travelAt(0);
    for (let p = 0; p <= 1; p += 0.01) {
      const actual = travelAt(p);
      expect(actual).toBeGreaterThanOrEqual(anterior - 1e-9);
      anterior = actual;
    }
  });

  it('acota los progresos fuera de rango en vez de dispararse', () => {
    // `useScroll` puede pasarse de 0 o de 1 con el rebote del scroll en iOS.
    expect(travelAt(-3)).toBe(-1);
    expect(travelAt(4)).toBe(1);
  });

  it('es simétrico entre entrar y salir', () => {
    for (let p = 0; p <= 0.5; p += 0.05) {
      expect(travelAt(p)).toBeCloseTo(-travelAt(1 - p), 10);
    }
  });
});

describe('tiltAt', () => {
  it('está derecha en el centro', () => {
    expect(tiltAt(0.5)).toBeCloseTo(0, 10);
  });

  it('se inclina para el lado opuesto al entrar y al salir', () => {
    expect(tiltAt(0)).toBeGreaterThan(0);
    expect(tiltAt(1)).toBeLessThan(0);
  });

  it('no se pasa del ángulo pedido', () => {
    for (let p = -0.5; p <= 1.5; p += 0.02) {
      expect(Math.abs(tiltAt(p, 6))).toBeLessThanOrEqual(6 + 1e-9);
    }
  });
});

describe('pushAt', () => {
  it('queda en su lugar en el centro', () => {
    expect(pushAt(0.5)).toBeCloseTo(0, 10);
  });

  it('nunca se acerca a la cámara, sólo se aleja', () => {
    // Acercarse rompería el diseño: la sección taparía a la vecina.
    for (let p = -0.5; p <= 1.5; p += 0.02) {
      expect(pushAt(p)).toBeLessThanOrEqual(0);
    }
  });

  it('se aleja lo pedido en los extremos', () => {
    expect(pushAt(0, 200)).toBeCloseTo(-200, 10);
    expect(pushAt(1, 200)).toBeCloseTo(-200, 10);
  });

  it('arranca a moverse sin golpe al salir de la meseta', () => {
    /*
     * Es lo que compra elevar al cuadrado: en el borde de la meseta la
     * pendiente es cero, así que el movimiento empieza de a poco. Con una recta
     * ahí habría un codo y se vería un tirón cada vez que una sección se
     * despega del centro.
     */
    const bordeMeseta = (1 - PLATEAU) / 2;
    const paso = 0.004;

    const enElBorde = Math.abs(pushAt(bordeMeseta - paso, 100) - pushAt(bordeMeseta, 100));
    const enElExtremo = Math.abs(pushAt(paso, 100) - pushAt(0, 100));

    expect(enElBorde).toBeLessThan(enElExtremo / 10);
  });

  it('a mitad de recorrido está más cerca del reposo que una recta', () => {
    /** Progreso en el que el recorrido vale `travel`, entrando por abajo. */
    const progresoPara = (travel: number) => (1 - PLATEAU - travel * (1 - PLATEAU)) / 2;

    const mitad = progresoPara(0.5);
    expect(travelAt(mitad)).toBeCloseTo(-0.5, 10);

    // Cuadrática: a la mitad del camino recorrió un cuarto de la distancia.
    expect(pushAt(mitad, 100)).toBeCloseTo(-25, 6);
  });

  it('los valores por defecto son moderados', () => {
    // Una profundidad grande da sensación de túnel y marea; esto es un acento.
    expect(DEFAULT_DEPTH.rotate).toBeLessThanOrEqual(8);
    expect(DEFAULT_DEPTH.depth).toBeLessThanOrEqual(200);
  });
});
