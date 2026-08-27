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
 * Tabla de ejemplo del diseño. La temporada todavía no arrancó, así que los
 * números son ilustrativos y así se aclara en la propia sección.
 */
export const STANDINGS: readonly TeamRow[] = [
  { team: 'Los Halcones', played: 6, won: 6, points: 12 },
  { team: 'Palermo Ballers', played: 6, won: 5, points: 11 },
  { team: 'Triple Doble', played: 6, won: 4, points: 10 },
  { team: 'Bajo Aro', played: 6, won: 3, points: 9 },
  { team: 'Costa Rica FC', played: 6, won: 3, points: 9 },
  { team: 'Los Pibes del Fondo', played: 6, won: 2, points: 8 },
  { team: 'Doble Poste', played: 6, won: 1, points: 7 },
  { team: 'Rebote Club', played: 6, won: 0, points: 6 },
];
