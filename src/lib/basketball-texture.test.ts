import { describe, expect, it } from 'vitest';
import type { Seam } from './basketball-texture';
import {
  BALL_PRESETS,
  SEAMS,
  SEAM_WIDTH,
  distanceToNearestSeam,
  distanceToSeam,
  grainAt,
  heightAt,
  seamFalloffAt,
  seamInkAt,
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
    const seam: Seam = { kind: 'small', axis: 'x', polarAngle: 0.97 };
    // Un punto cuyo ángulo polar respecto de +x es exactamente 0.97.
    const point = { x: Math.cos(0.97), y: 0, z: Math.sin(0.97) };
    expect(distanceToSeam(point, seam)).toBeCloseTo(0, 10);
  });

  it('los arcos de los costados van sobre el eje x, no sobre el que mira a la cámara', () => {
    // Tomados sobre z se verían como un anillo concéntrico en vez de dos arcos.
    const menores = SEAMS.filter((seam) => seam.kind === 'small');
    expect(menores).toHaveLength(2);
    for (const seam of menores) expect(seam.axis).toBe('x');
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

  it('dibuja tres costuras verticales al mirar la pelota de frente', () => {
    /*
     * Recorriendo una latitud de la cara visible tienen que aparecer tres
     * cruces: la vertical del medio y los dos arcos de los costados. Se muestrea
     * arriba del ecuador y no sobre él, porque el ecuador es una costura entero
     * y ahí no habría nada que contar.
     */
    let cruces = 0;
    let dentro = false;
    for (let u = 0; u < 0.5; u += 0.0005) {
      const cerca = distanceToNearestSeam(sphereAt(u, 0.3)) < SEAM_WIDTH;
      if (cerca && !dentro) cruces++;
      dentro = cerca;
    }
    expect(cruces).toBe(3);
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

describe('seamFalloffAt', () => {
  it('vale 1 en el centro de la costura', () => {
    // Donde se cruzan el ecuador y el meridiano estamos en el fondo del surco.
    expect(seamFalloffAt({ x: 0, y: 0, z: 1 })).toBeCloseTo(1, 6);
  });

  it('vale 0 lejos de toda costura', () => {
    let masLejano = { punto: sphereAt(0, 0), distancia: 0 };
    for (let u = 0; u < 1; u += 0.01) {
      for (let v = 0; v < 1; v += 0.01) {
        const punto = sphereAt(u, v);
        const distancia = distanceToNearestSeam(punto);
        if (distancia > masLejano.distancia) masLejano = { punto, distancia };
      }
    }
    expect(seamFalloffAt(masLejano.punto)).toBe(0);
  });

  it('nunca se sale del rango 0 a 1', () => {
    for (let u = 0; u < 1; u += 0.05) {
      for (let v = 0; v < 1; v += 0.05) {
        const valor = seamFalloffAt(sphereAt(u, v));
        expect(valor).toBeGreaterThanOrEqual(0);
        expect(valor).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('heightAt', () => {
  const preset = BALL_PRESETS.cuero;
  const ANCHO = 512;

  it('hunde la costura respecto del cuero liso', () => {
    // El cruce de las dos costuras rectas cae en el centro del mapa.
    const enCostura = heightAt(ANCHO / 2, ANCHO / 4, ANCHO, preset);
    const enPanel = heightAt(ANCHO / 8, ANCHO / 8, ANCHO, preset);
    expect(enCostura).toBeLessThan(enPanel);
  });

  it('nunca devuelve una altura negativa', () => {
    for (let x = 0; x < ANCHO; x += 7) {
      for (let y = 0; y < ANCHO / 2; y += 7) {
        expect(heightAt(x, y, ANCHO, preset)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('envuelve en la longitud, así la costura no se corta en el borde', () => {
    // Salirse por un lado del mapa tiene que devolver lo mismo que entrar por
    // el otro: si no, se vería una línea vertical donde la textura se cierra.
    expect(heightAt(-1, 40, ANCHO, preset)).toBeCloseTo(heightAt(ANCHO - 1, 40, ANCHO, preset), 10);
    expect(heightAt(ANCHO, 40, ANCHO, preset)).toBeCloseTo(heightAt(0, 40, ANCHO, preset), 10);
  });

  it('el granulado del preset cambia cuánto varía la superficie', () => {
    const variacion = (id: keyof typeof BALL_PRESETS) => {
      const alturas = Array.from({ length: 200 }, (_, i) =>
        heightAt(i * 3, 60, ANCHO, BALL_PRESETS[id]),
      );
      return Math.max(...alturas) - Math.min(...alturas);
    };
    // «Cuero» tiene el granulado al máximo y «estilizado» casi nada.
    expect(variacion('cuero')).toBeGreaterThan(variacion('estilizado'));
  });
});

describe('BALL_PRESETS', () => {
  it('ofrece las tres variantes de cuero más la gráfica', () => {
    expect(Object.keys(BALL_PRESETS)).toEqual(['cuero', 'nocturno', 'estilizado', 'grafico']);
  });

  it('cada variante tiene su propio material', () => {
    const materiales = Object.values(BALL_PRESETS).map(
      (preset) => `${preset.sheen}-${preset.sharpness}-${preset.grain}`,
    );
    expect(new Set(materiales).size).toBe(materiales.length);
  });

  it('van de mate a lustrosa en el mismo orden en los dos parámetros del brillo', () => {
    // Un brillo más fuerte tiene que venir además más concentrado: fuerte y
    // desparramado a la vez no se lee como lustre, se lee como niebla.
    const { cuero, nocturno, estilizado } = BALL_PRESETS;
    expect(cuero.sheen).toBeLessThan(nocturno.sheen);
    expect(nocturno.sheen).toBeLessThan(estilizado.sheen);
    expect(cuero.sharpness).toBeLessThan(nocturno.sharpness);
    expect(nocturno.sharpness).toBeLessThan(estilizado.sharpness);
  });

  it('el brillo se mantiene dentro de un rango que no queme la imagen', () => {
    for (const preset of Object.values(BALL_PRESETS)) {
      // La gráfica no tiene brillo especular: un reflejo concentrado es
      // justamente lo que no se quiere, así que el piso es cero y no más.
      expect(preset.sheen).toBeGreaterThanOrEqual(0);
      expect(preset.sheen).toBeLessThanOrEqual(1);
      expect(preset.sharpness).toBeGreaterThanOrEqual(1);
      expect(preset.rim).toBeGreaterThanOrEqual(0);
      expect(preset.rim).toBeLessThanOrEqual(1);
    }
  });

  it('todas declaran aplanado y sombra dentro de rango', () => {
    for (const preset of Object.values(BALL_PRESETS)) {
      expect(preset.flat).toBeGreaterThanOrEqual(0);
      expect(preset.flat).toBeLessThanOrEqual(1);
      expect(preset.shadow).toBeGreaterThanOrEqual(0);
      expect(preset.shadow).toBeLessThanOrEqual(1);
    }
  });

  it('la variante gráfica apaga toda la maquinaria de realismo', () => {
    const { grafico } = BALL_PRESETS;
    // Granulado, relieve y reflejo son las tres cosas que hacen leer «cuero».
    expect(grafico.grain).toBe(0);
    expect(grafico.normalStrength).toBe(0);
    expect(grafico.sheen).toBe(0);
    expect(grafico.flat).toBe(1);
    // Y la sombra queda apenas de apoyo, muy por debajo de la fotográfica.
    expect(grafico.shadow).toBeLessThan(BALL_PRESETS.cuero.shadow / 2);
  });

  it('la variante gráfica usa los colores de la paleta y no un naranja de cuero', () => {
    // Naranja `--color-orange` sobre tinta `--color-ink`: los mismos dos colores
    // con los que está hecho el resto de la página.
    expect(BALL_PRESETS.grafico.leather).toEqual([249, 115, 22]);
    expect(BALL_PRESETS.grafico.seam).toEqual([7, 17, 31]);
  });
});

describe('seamInkAt', () => {
  it('con acabado de cuero es el mismo desvanecimiento del surco', () => {
    const punto = sphereAt(0.12, 0.42);
    expect(seamInkAt(punto, BALL_PRESETS.cuero)).toBeCloseTo(seamFalloffAt(punto), 10);
  });

  it('con acabado gráfico la costura tiene más cuerpo que el surco', () => {
    /*
     * Se mide en el borde de la costura, no en el centro: en el centro las dos
     * valen 1 y no habría nada que comparar. Lo que cambia es cuánto tarda en
     * apagarse, que es lo que hace que una se lea como línea y la otra como
     * sombra.
     */
    const alturaSobreElEcuador = Math.sin(SEAM_WIDTH * 0.6);
    // Bien separado de las otras tres costuras, para que la única cerca sea el
    // ecuador y la comparación mida lo que dice medir.
    const x = Math.cos(0.5);
    const borde = {
      x,
      y: alturaSobreElEcuador,
      z: Math.sqrt(1 - x * x - alturaSobreElEcuador * alturaSobreElEcuador),
    };
    expect(distanceToNearestSeam(borde)).toBeCloseTo(SEAM_WIDTH * 0.6, 6);
    expect(seamInkAt(borde, BALL_PRESETS.grafico)).toBeGreaterThan(
      seamInkAt(borde, BALL_PRESETS.cuero),
    );
  });

  it('nunca se pasa de 1 ni queda por debajo de 0', () => {
    for (const preset of Object.values(BALL_PRESETS)) {
      for (let u = 0; u < 1; u += 0.05) {
        for (let v = 0; v < 1; v += 0.05) {
          const valor = seamInkAt(sphereAt(u, v), preset);
          expect(valor).toBeGreaterThanOrEqual(0);
          expect(valor).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('lejos de toda costura no pinta nada, tenga el acabado que tenga', () => {
    const lejos = sphereAt(0.0625, 0.25);
    for (const preset of Object.values(BALL_PRESETS)) {
      expect(seamInkAt(lejos, preset)).toBe(0);
    }
  });
});
