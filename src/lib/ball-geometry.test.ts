import { describe, expect, it } from 'vitest';
import type { Seam, Vec3 } from './ball-geometry';
import { SEAMS, ballPaths, rotate, seamPath, seamPointAt, seamPoints } from './ball-geometry';

const largo = ({ x, y, z }: Vec3) => Math.hypot(x, y, z);

/** Cuántos subtrazados tiene un trazado: uno por cada `M`. */
const tramos = (d: string) => (d.match(/M/g) ?? []).length;

/** Puntos de juguete donde `z` decide de qué lado de la esfera cae cada uno. */
const conZ = (zs: readonly number[]): Vec3[] => zs.map((z, i) => ({ x: i / zs.length, y: 0.5, z }));

describe('seamPointAt', () => {
  it('devuelve siempre un punto sobre la esfera unitaria', () => {
    for (const seam of SEAMS) {
      for (let t = 0; t < Math.PI * 2; t += 0.1) {
        expect(largo(seamPointAt(seam, t))).toBeCloseTo(1, 10);
      }
    }
  });

  it('el círculo máximo del ecuador no se sale del ecuador', () => {
    const seam: Seam = { kind: 'great', axis: 'y' };
    for (let t = 0; t < Math.PI * 2; t += 0.2) {
      expect(seamPointAt(seam, t).y).toBeCloseTo(0, 10);
    }
  });

  it('el círculo menor se mantiene a su ángulo polar del eje', () => {
    const polarAngle = 0.98;
    const seam: Seam = { kind: 'small', axis: 'x', polarAngle };
    for (let t = 0; t < Math.PI * 2; t += 0.2) {
      // La proyección sobre el eje es el coseno del ángulo polar, por definición.
      expect(seamPointAt(seam, t).x).toBeCloseTo(Math.cos(polarAngle), 10);
    }
  });

  it('cierra la vuelta: 0 y 2π son el mismo punto', () => {
    for (const seam of SEAMS) {
      const inicio = seamPointAt(seam, 0);
      const fin = seamPointAt(seam, Math.PI * 2);
      expect(fin.x).toBeCloseTo(inicio.x, 10);
      expect(fin.y).toBeCloseTo(inicio.y, 10);
      expect(fin.z).toBeCloseTo(inicio.z, 10);
    }
  });
});

describe('SEAMS', () => {
  it('son cuatro: dos que la parten al medio y dos arcos de costado', () => {
    expect(SEAMS).toHaveLength(4);
    expect(SEAMS.filter((seam) => seam.kind === 'great')).toHaveLength(2);
    expect(SEAMS.filter((seam) => seam.kind === 'small')).toHaveLength(2);
  });

  it('los arcos de los costados van sobre el eje x, no sobre el que mira a la cámara', () => {
    // Tomados sobre z se verían como un anillo concéntrico y la pelota dejaría
    // de leerse como pelota de básquet.
    for (const seam of SEAMS) {
      if (seam.kind === 'small') expect(seam.axis).toBe('x');
    }
  });

  it('los dos arcos son simétricos respecto del ecuador', () => {
    const menores = SEAMS.filter((seam) => seam.kind === 'small');
    const [uno, otro] = menores as [
      Extract<Seam, { kind: 'small' }>,
      Extract<Seam, { kind: 'small' }>,
    ];
    expect(uno.polarAngle + otro.polarAngle).toBeCloseTo(Math.PI, 10);
  });
});

describe('rotate', () => {
  it('no cambia el tamaño de lo que gira', () => {
    for (const seam of SEAMS) {
      for (let t = 0; t < Math.PI * 2; t += 0.3) {
        expect(largo(rotate(seamPointAt(seam, t), 1.2, -0.3))).toBeCloseTo(1, 10);
      }
    }
  });

  it('sin giro ni inclinación deja el punto donde estaba', () => {
    const punto = { x: 0.3, y: -0.4, z: 0.86 };
    const girado = rotate(punto, 0, 0);
    expect(girado.x).toBeCloseTo(punto.x, 10);
    expect(girado.y).toBeCloseTo(punto.y, 10);
    expect(girado.z).toBeCloseTo(punto.z, 10);
  });

  it('una vuelta entera vuelve al mismo lugar', () => {
    const punto = { x: 0.3, y: -0.4, z: 0.86 };
    const vuelta = rotate(punto, Math.PI * 2, -0.3);
    const quieto = rotate(punto, 0, -0.3);
    expect(vuelta.x).toBeCloseTo(quieto.x, 10);
    expect(vuelta.y).toBeCloseTo(quieto.y, 10);
    expect(vuelta.z).toBeCloseTo(quieto.z, 10);
  });

  it('gira primero y recién después inclina', () => {
    /*
     * Con el orden al revés el eje de giro quedaría siempre vertical y la pelota
     * daría vueltas como un globo terráqueo trabado. Se comprueba con el polo:
     * girando primero, el polo termina inclinado; el giro sobre el eje vertical
     * por sí solo no lo mueve.
     */
    const polo = { x: 0, y: 1, z: 0 };
    expect(rotate(polo, 1.1, -0.3).z).not.toBeCloseTo(0, 6);
    expect(rotate(polo, 1.1, 0).y).toBeCloseTo(1, 10);
  });
});

describe('seamPoints', () => {
  it('devuelve tantos puntos como pasos, sin repetir el del cierre', () => {
    const puntos = seamPoints(SEAMS[0]!, 0, 0, 12);
    expect(puntos).toHaveLength(12);
  });

  it('nunca devuelve un número inválido', () => {
    for (const seam of SEAMS) {
      for (const punto of seamPoints(seam, 2.4, -0.3, 24)) {
        expect(Number.isFinite(punto.x + punto.y + punto.z)).toBe(true);
      }
    }
  });
});

describe('seamPath', () => {
  it('parte la curva donde cruza al otro lado de la esfera', () => {
    // Sin el corte, la línea cruzaría la pelota de lado a lado por el medio.
    expect(tramos(seamPath(conZ([1, 1, -1, -1])))).toBe(1);
  });

  it('no parte en dos un tramo que cruza el final de la vuelta', () => {
    /*
     * Los puntos 3 y 0 son contiguos sobre la curva, aunque estén en las puntas
     * del array. Tratarlos como dos tramos dejaría un corte visible arriba de
     * todo de la pelota, siempre en el mismo lugar.
     */
    expect(tramos(seamPath(conZ([1, -1, -1, 1])))).toBe(1);
  });

  it('una curva que se ve entera sale cerrada y de una sola pieza', () => {
    const d = seamPath(conZ([1, 1, 1, 1]));
    expect(tramos(d)).toBe(1);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('una curva que quedó del otro lado no dibuja nada', () => {
    // El cuerpo de la pelota es opaco: la mitad de atrás está tapada por la
    // pelota misma, así que dibujarla sería pintar encima del disco.
    expect(seamPath(conZ([-1, -1, -1, -1]))).toBe('');
  });

  it('un tramo que asoma apenas igual se dibuja, anclado en los dos bordes', () => {
    /*
     * Entre dos puntos muestreados que quedaron atrás hay un pedacito de costura
     * que sí se ve. Antes se descartaba por tener un solo punto y la costura
     * parpadeaba al acercarse al borde; con los cruces calculados es un arco
     * corto y completo.
     */
    const d = seamPath(conZ([1, -1, 1, -1]));
    expect(tramos(d)).toBe(2);
  });

  it('las puntas de cada tramo caen justo sobre la silueta', () => {
    // Si terminaran en el último punto muestreado quedaría un diente de un par
    // de píxeles que aparece y desaparece mientras la pelota gira.
    const d = seamPath(seamPoints(SEAMS[1]!, 0.4, -0.16, 48));
    const [primerX, primerY] = d.slice(1).split(/[ ]/).slice(0, 2).map(Number) as [number, number];
    // La tolerancia es la del redondeo a tres decimales del propio trazado, no
    // la de la cuenta: lo que se mide acá es el texto que se escribe en el DOM.
    expect(Math.hypot(primerX, primerY)).toBeCloseTo(1, 3);
  });

  it('invierte la vertical, porque en SVG la `y` crece hacia abajo', () => {
    const d = seamPath([
      { x: 0, y: 0.5, z: 1 },
      { x: 1, y: 0.5, z: 1 },
    ]);
    expect(d).toContain('-0.5');
  });

  it('redondea: un trazado con dieciséis decimales por número pesa de más', () => {
    const d = seamPath(seamPoints(SEAMS[0]!, 0.7, -0.16, 24));
    for (const numero of d.match(/-?\d+\.?\d*/g) ?? []) {
      const decimales = numero.split('.')[1]?.length ?? 0;
      expect(decimales).toBeLessThanOrEqual(3);
    }
  });

  it('con la lista vacía devuelve un trazado vacío', () => {
    expect(seamPath([])).toBe('');
  });
});

describe('ballPaths', () => {
  it('dibuja las cuatro costuras', () => {
    expect(ballPaths(0.4, -0.16)).toHaveLength(4);
  });

  it('a cualquier giro, siempre hay costura a la vista', () => {
    // Una pelota que en algún ángulo se queda sin líneas se ve como un disco de
    // color. Es el chequeo que atrapa una proyección con el signo cambiado.
    for (let spin = 0; spin < Math.PI * 2; spin += 0.25) {
      const visibles = ballPaths(spin, -0.16).filter((d) => d.length > 0);
      expect(visibles.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('nunca escribe un `NaN` en un trazado', () => {
    for (let spin = 0; spin < Math.PI * 2; spin += 0.3) {
      for (const d of ballPaths(spin, -0.16)) expect(d).not.toContain('NaN');
    }
  });

  it('es determinista: el mismo giro da el mismo dibujo', () => {
    expect(ballPaths(1.23, -0.16)).toEqual(ballPaths(1.23, -0.16));
  });

  it('gira: dos ángulos distintos dan dibujos distintos', () => {
    expect(ballPaths(0, -0.16)).not.toEqual(ballPaths(0.6, -0.16));
  });
});
