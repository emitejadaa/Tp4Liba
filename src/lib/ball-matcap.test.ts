import { describe, expect, it } from 'vitest';
import { BALL_PRESETS } from './basketball-texture';
import { LIGHTS, shadeNormal } from './ball-matcap';

/** Sombrea una normal dada por sus dos primeras componentes. */
function shadeAt(nx: number, ny: number, id: keyof typeof BALL_PRESETS = 'nocturno') {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return shadeNormal(nx, ny, nz, BALL_PRESETS[id]);
}

/** Brillo percibido, para comparar dos puntos del matcap. */
const luma = ([r, g, b]: readonly [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

describe('shadeNormal', () => {
  it('devuelve siempre canales entre 0 y 1', () => {
    for (let nx = -1; nx <= 1; nx += 0.1) {
      for (let ny = -1; ny <= 1; ny += 0.1) {
        if (nx * nx + ny * ny > 1) continue;
        for (const canal of shadeAt(nx, ny)) {
          expect(canal).toBeGreaterThanOrEqual(0);
          expect(canal).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('ilumina más el lado de la luz principal que el opuesto', () => {
    // La principal viene de arriba a la izquierda.
    expect(luma(shadeAt(-0.5, 0.5))).toBeGreaterThan(luma(shadeAt(0.5, -0.5)));
  });

  it('nunca deja una zona en negro absoluto', () => {
    // Sin rebote ni ambiente, la mitad en sombra se ve como un agujero y la
    // pelota deja de leerse como un objeto iluminado.
    let masOscuro = 1;
    for (let nx = -1; nx <= 1; nx += 0.05) {
      for (let ny = -1; ny <= 1; ny += 0.05) {
        if (nx * nx + ny * ny > 1) continue;
        masOscuro = Math.min(masOscuro, luma(shadeAt(nx, ny)));
      }
    }
    expect(masOscuro).toBeGreaterThan(0.05);
  });

  it('el encendido de borde sube el borde y deja quieto el interior', () => {
    // Se compara el mismo preset con y sin encendido, en vez de comparar dos
    // puntos entre sí: el interior puede caer justo dentro del rebote cálido y
    // ser más brillante que el borde sin que eso diga nada del encendido.
    const sinRim = { ...BALL_PRESETS.nocturno, rim: 0 };
    const conRim = { ...BALL_PRESETS.nocturno, rim: 0.6 };

    const en = (nx: number, ny: number, preset: typeof sinRim) =>
      luma(shadeNormal(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), preset));

    const gananciaBorde = en(0.985, -0.1, conRim) - en(0.985, -0.1, sinRim);
    const gananciaCentro = en(0, 0, conRim) - en(0, 0, sinRim);

    expect(gananciaBorde).toBeGreaterThan(0.1);
    expect(gananciaCentro).toBeLessThan(0.01);
  });

  it('el rebote cálido tiñe de naranja el lado opuesto a la luz principal', () => {
    const [r, , b] = shadeAt(0.75, -0.2);
    expect(r).toBeGreaterThan(b);
  });

  it('la variante lustrosa concentra más el brillo que la mate', () => {
    // En el centro del brillo la lustrosa tiene que ganar, y lejos de él las
    // dos tienen que parecerse: eso es que el brillo sea más chico, no más luz.
    const centroBrillo = { nx: -0.42, ny: 0.47 };
    const lejos = { nx: 0.2, ny: -0.6 };

    const enBrillo =
      luma(shadeAt(centroBrillo.nx, centroBrillo.ny, 'estilizado')) -
      luma(shadeAt(centroBrillo.nx, centroBrillo.ny, 'cuero'));
    const enSombra =
      luma(shadeAt(lejos.nx, lejos.ny, 'estilizado')) - luma(shadeAt(lejos.nx, lejos.ny, 'cuero'));

    expect(enBrillo).toBeGreaterThan(enSombra);
  });

  it('es determinista', () => {
    expect(shadeAt(0.3, 0.2)).toEqual(shadeAt(0.3, 0.2));
  });
});

describe('LIGHTS', () => {
  it('trae una luz principal y al menos un rebote', () => {
    expect(LIGHTS.length).toBeGreaterThanOrEqual(2);
  });

  it('la primera es la principal: ninguna otra le gana', () => {
    // No se fija el valor exacto, que se ajusta al calibrar la exposición;
    // lo que no puede cambiar es cuál manda.
    const principal = LIGHTS[0]?.intensity ?? 0;
    expect(principal).toBeGreaterThan(0);
    for (const light of LIGHTS.slice(1)) {
      expect(light.intensity).toBeLessThan(principal);
    }
  });

  it('ninguna luz quema por sí sola', () => {
    for (const light of LIGHTS) expect(light.intensity).toBeLessThanOrEqual(1);
  });

  it('las luces vienen desde adelante, no desde atrás de la pelota', () => {
    // Una luz con `z` negativo quedaría detrás del objeto y no aportaría nada
    // salvo en el borde, que ya lo cubre el encendido de silueta.
    for (const light of LIGHTS) {
      expect(light.direction[2]).toBeGreaterThan(0);
    }
  });
});
