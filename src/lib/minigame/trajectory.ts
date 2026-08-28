import type { ShotResult } from './shootout';

/**
 * Trayectorias del balón.
 *
 * Las coordenadas son desplazamientos en píxeles respecto de la posición de
 * reposo del balón, dentro de la cancha de 460×300 del minijuego. El balón
 * arranca con su centro en (73, 257) y el centro del aro está en (322, 88), de
 * donde salen el desplazamiento de 249 px a la derecha y 169 hacia arriba.
 */

/** Desplazamiento horizontal desde el balón hasta el centro del aro. */
export const RIM_DX = 249;

/** Desplazamiento vertical desde el balón hasta el centro del aro. */
export const RIM_DY = -169;

export type Arc = {
  x: readonly number[];
  y: readonly number[];
  scale: readonly number[];
  rotate: readonly number[];
  /** Momento de cada punto, de 0 a 1. */
  times: readonly number[];
  durationSeconds: number;
  /** Momento en que el balón cruza el aro, para sincronizar red y confeti. */
  swishAt: number;
};

/**
 * Tres formas de encestar. Todas pasan por el centro del aro y siguen de largo
 * hacia abajo —la pelota atraviesa la red en vez de frenar arriba— pero llegan
 * distinto: la limpia describe un arco alto, la de tabla rebota en el vidrio y
 * la tensa va casi derecha.
 */
const MADE_ARCS: readonly Arc[] = [
  {
    // Limpia: arco alto y caída vertical por el centro del aro.
    x: [0, 120, RIM_DX, RIM_DX + 8, RIM_DX + 12],
    y: [0, -250, RIM_DY, RIM_DY + 58, RIM_DY + 118],
    scale: [1, 0.78, 0.6, 0.56, 0.52],
    rotate: [0, 200, 330, 400, 470],
    times: [0, 0.42, 0.62, 0.8, 1],
    durationSeconds: 1.05,
    swishAt: 0.62,
  },
  {
    // De tabla: pega arriba a la derecha y baja al aro.
    x: [0, 150, RIM_DX + 46, RIM_DX + 4, RIM_DX + 6],
    y: [0, -212, -232, RIM_DY, RIM_DY + 112],
    scale: [1, 0.8, 0.62, 0.58, 0.52],
    rotate: [0, 170, 260, 300, 380],
    times: [0, 0.34, 0.52, 0.7, 1],
    durationSeconds: 1.1,
    swishAt: 0.7,
  },
  {
    // Tensa: casi sin arco, entra rápido y sale por abajo.
    x: [0, 155, RIM_DX, RIM_DX + 10, RIM_DX + 14],
    y: [0, -196, RIM_DY, RIM_DY + 64, RIM_DY + 120],
    scale: [1, 0.76, 0.58, 0.55, 0.5],
    rotate: [0, 240, 380, 450, 520],
    times: [0, 0.46, 0.64, 0.82, 1],
    durationSeconds: 0.92,
    swishAt: 0.64,
  },
];

/**
 * Tres formas de errar: corta contra el frente del aro, larga por encima del
 * tablero, y desviada contra el costado.
 */
const MISS_ARCS: readonly Arc[] = [
  {
    // Corta: pega en el frente del aro y vuelve.
    x: [0, 130, RIM_DX - 66, RIM_DX - 118, RIM_DX - 150],
    y: [0, -206, RIM_DY + 4, RIM_DY + 96, 46],
    scale: [1, 0.78, 0.62, 0.7, 0.85],
    rotate: [0, 190, 300, 380, 460],
    times: [0, 0.4, 0.58, 0.78, 1],
    durationSeconds: 1.05,
    swishAt: 1,
  },
  {
    // Larga: pasa por encima del tablero y se va.
    x: [0, 170, RIM_DX + 74, RIM_DX + 128, RIM_DX + 168],
    y: [0, -268, -262, -186, 40],
    scale: [1, 0.74, 0.6, 0.62, 0.72],
    rotate: [0, 220, 340, 420, 520],
    times: [0, 0.38, 0.56, 0.76, 1],
    durationSeconds: 1.1,
    swishAt: 1,
  },
  {
    // Desviada: se va por el costado sin llegar al aro.
    x: [0, 104, 172, 206, 224],
    y: [0, -178, -196, -96, 66],
    scale: [1, 0.8, 0.68, 0.74, 0.88],
    rotate: [0, -160, -280, -360, -440],
    times: [0, 0.36, 0.56, 0.78, 1],
    durationSeconds: 1,
    swishAt: 1,
  },
];

/**
 * Elige la trayectoria de un tiro.
 *
 * La variante sale de `shotId` y no del azar, así dos partidas con la misma
 * secuencia de tiros se ven igual y los tests no dependen de `Math.random`.
 * Un tiro perfecto siempre entra limpio: el arco premia haberle pegado al
 * centro de la zona.
 */
export function shotArc(result: ShotResult, shotId: number): Arc {
  if (result === 'perfect') return MADE_ARCS[0]!;

  const pool = result === 'in' ? MADE_ARCS : MISS_ARCS;
  // El tiro perfecto ya se llevó la variante 0, así que las que entran
  // alternan entre las otras dos.
  const index = result === 'in' ? 1 + (shotId % (pool.length - 1)) : shotId % pool.length;
  return pool[index]!;
}

/** Cuántas partículas de confeti larga una encestada. */
export function confettiCount(result: ShotResult): number {
  if (result === 'perfect') return 18;
  if (result === 'in') return 12;
  return 0;
}
