import { describe, expect, it } from 'vitest';
import { FLIGHT, FLIGHT_TURNS, flightAt } from './ball-flight';

describe('FLIGHT', () => {
  it('va en orden y cubre el recorrido entero', () => {
    expect(FLIGHT[0]!.at).toBe(0);
    expect(FLIGHT[FLIGHT.length - 1]!.at).toBe(1);
    for (let i = 1; i < FLIGHT.length; i++) {
      expect(FLIGHT[i]!.at).toBeGreaterThan(FLIGHT[i - 1]!.at);
    }
  });

  it('arranca invisible, para que la del encabezado sea la única que se ve', () => {
    expect(FLIGHT[0]!.opacity).toBe(0);
  });

  it('nunca se pone tan opaca como para tapar lo que hay debajo', () => {
    // Cruza por encima del contenido: es un velo, no una tapa.
    for (const punto of FLIGHT) expect(punto.opacity).toBeLessThanOrEqual(0.6);
  });

  it('los cruces de lado a lado pasan por arriba o por abajo, no por el medio', () => {
    /*
     * Es lo que decide si la pelota molesta o no. El texto vive en la franja
     * central de la pantalla; un cruce a media altura la arrastra por encima de
     * un párrafo entero.
     */
    for (let i = 1; i < FLIGHT.length; i++) {
      const desde = FLIGHT[i - 1]!;
      const hasta = FLIGHT[i]!;
      const cruza = Math.abs(hasta.x - desde.x) > 40;
      if (!cruza) continue;

      const enElMedio = (desde.y + hasta.y) / 2;
      expect(enElMedio < 32 || enElMedio > 68).toBe(true);
    }
  });
});

describe('flightAt', () => {
  it('pasa exactamente por cada punto del recorrido', () => {
    for (const punto of FLIGHT) {
      const estado = flightAt(punto.at);
      expect(estado.x).toBeCloseTo(punto.x, 6);
      expect(estado.y).toBeCloseTo(punto.y, 6);
      expect(estado.size).toBeCloseTo(punto.size, 6);
      expect(estado.opacity).toBeCloseTo(punto.opacity, 6);
    }
  });

  it('acota los avances fuera de rango en vez de dispararse', () => {
    // `scrollY` se pasa de los extremos con el rebote del scroll en iOS.
    expect(flightAt(-2)).toEqual(flightAt(0));
    expect(flightAt(3)).toEqual(flightAt(1));
  });

  it('no pega saltos entre un avance y el siguiente', () => {
    /*
     * Un salto acá se ve como un teletransporte. Se compara contra el paso de
     * scroll, no contra un número fijo: lo que importa es que el movimiento sea
     * continuo, no que sea chico.
     */
    let anterior = flightAt(0);
    for (let p = 0.005; p <= 1; p += 0.005) {
      const actual = flightAt(p);
      // El cruce más rápido son 96 vw en 0,18 de avance; en el pico del
      // suavizado eso da unos 4 vw por paso. Cinco deja margen y sigue atrapando
      // un salto, que sería de decenas.
      expect(Math.abs(actual.x - anterior.x)).toBeLessThan(5);
      expect(Math.abs(actual.y - anterior.y)).toBeLessThan(5);
      expect(Math.abs(actual.size - anterior.size)).toBeLessThan(1);
      anterior = actual;
    }
  });

  it('llega a cada punto frenando, no de golpe', () => {
    // Es lo que compra el suavizado: sin él la pelota cambia de dirección con un
    // quiebre en cada punto de paso, como tironeada por una soga.
    const paso = 0.002;
    const [desde, hasta] = [FLIGHT[1]!, FLIGHT[2]!];

    const alLlegar = Math.abs(flightAt(hasta.at).x - flightAt(hasta.at - paso).x);
    const enElMedio = Math.abs(
      flightAt((desde.at + hasta.at) / 2).x - flightAt((desde.at + hasta.at) / 2 - paso).x,
    );

    expect(alLlegar).toBeLessThan(enElMedio / 4);
  });

  it('gira siempre para el mismo lado y da las vueltas declaradas', () => {
    expect(flightAt(0).spin).toBe(0);
    expect(flightAt(1).spin).toBeCloseTo(FLIGHT_TURNS * Math.PI * 2, 10);

    let anterior = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const { spin } = flightAt(p);
      expect(spin).toBeGreaterThan(anterior);
      anterior = spin;
    }
  });

  it('no devuelve un número inválido en ningún punto', () => {
    for (let p = -0.5; p <= 1.5; p += 0.01) {
      const { x, y, size, opacity, spin } = flightAt(p);
      expect(Number.isFinite(x + y + size + opacity + spin)).toBe(true);
    }
  });
});
