export type TeamRow = {
  team: string;
  /** Partidos jugados. */
  played: number;
  /** Partidos ganados. */
  won: number;
  /** Puntos: en básquet se suma 2 por ganado y 1 por perdido. */
  points: number;
};

/**
 * Tabla de ejemplo. La temporada todavía no arrancó, así que los números son
 * ilustrativos y así se aclara en la propia sección.
 *
 * Dos decisiones sobre estos datos, ambas para que el ordenamiento se note:
 *
 * 1. Los equipos no juegan todos la misma cantidad de partidos —hay fechas
 *    postergadas, como en cualquier liga amateur—, así que ordenar por PJ da un
 *    orden distinto que ordenar por G o por PTS. Con los ocho equipos en 6
 *    partidos, tocar «PJ» no movía una sola fila.
 * 2. El arreglo no viene pre-ordenado por puntos. Guardarlo ya ordenado hacía
 *    que el orden por defecto de la tabla coincidiera con el del arreglo, y
 *    parecía que el ordenamiento no hacía nada.
 *
 * Los puntos son coherentes con el reglamento de la liga: 2 por partido ganado
 * y 1 por perdido, o sea `PTS = G + PJ`.
 */
export const STANDINGS: readonly TeamRow[] = [
  { team: 'Costa Rica FC', played: 6, won: 3, points: 9 },
  { team: 'Rebote Club', played: 6, won: 1, points: 7 },
  { team: 'Palermo Ballers', played: 7, won: 5, points: 12 },
  { team: 'Doble Poste', played: 5, won: 2, points: 7 },
  { team: 'Los Halcones', played: 6, won: 5, points: 11 },
  { team: 'Los Pibes del Fondo', played: 7, won: 2, points: 9 },
  { team: 'Bajo Aro', played: 5, won: 4, points: 9 },
  { team: 'Triple Doble', played: 7, won: 4, points: 11 },
];
