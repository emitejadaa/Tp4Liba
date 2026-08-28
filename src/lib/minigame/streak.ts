/**
 * Fuego de racha.
 *
 * Cada tres encestadas seguidas el fuego cambia de nivel: crece, cambia de
 * color y se mueve distinto. El tope está en 15, que es donde la zona de
 * puntería ya llegó a su ancho mínimo y seguir escalando el efecto dejaría de
 * significar algo.
 */

export type StreakTier = {
  /** 0 = sin fuego. Sube de a uno cada tres encestadas. */
  level: number;
  name: string;
  /** Colores del degradado de la llama, de la base a la punta. */
  colors: readonly [string, string, string];
  /** Alto de la llama en píxeles. */
  height: number;
  /** Cuántas chispas suben alrededor. */
  sparks: number;
  /** Duración del ciclo de titileo, en segundos. Baja al subir de nivel. */
  flicker: number;
  /** Cómo está la racha, para quien no ve el fuego. Se lee «Racha <label>». */
  label: string;
};

/** Racha a partir de la cual el efecto deja de escalar. */
export const MAX_STREAK_TIER_AT = 15;

/** Encestadas necesarias para subir un nivel de fuego. */
export const STREAK_PER_TIER = 3;

const TIERS: readonly StreakTier[] = [
  {
    level: 0,
    name: 'apagado',
    colors: ['#f97316', '#fb923c', '#fed7aa'],
    height: 0,
    sparks: 0,
    flicker: 0,
    label: 'sin racha',
  },
  {
    level: 1,
    name: 'chispa',
    colors: ['#c2410c', '#f97316', '#fdba74'],
    height: 26,
    sparks: 2,
    flicker: 1.1,
    label: 'encendida',
  },
  {
    level: 2,
    name: 'llama',
    colors: ['#ea580c', '#fb923c', '#fde68a'],
    height: 34,
    sparks: 3,
    flicker: 0.95,
    label: 'en llamas',
  },
  {
    level: 3,
    name: 'fogata',
    colors: ['#f97316', '#fbbf24', '#fef3c7'],
    height: 42,
    sparks: 5,
    flicker: 0.8,
    label: 'ardiendo',
  },
  {
    level: 4,
    name: 'incendio',
    colors: ['#fbbf24', '#fde68a', '#ffffff'],
    height: 50,
    sparks: 7,
    flicker: 0.65,
    label: 'al rojo vivo',
  },
  {
    level: 5,
    name: 'fuego azul',
    colors: ['#38bdf8', '#a5f3fc', '#ffffff'],
    height: 58,
    sparks: 9,
    flicker: 0.5,
    label: 'imparable',
  },
];

/**
 * Nivel de fuego para una racha.
 *
 * De 0 a 2 no hay fuego; a partir de 3 sube un nivel cada tres encestadas, y
 * queda clavado en el último nivel al llegar a `MAX_STREAK_TIER_AT`.
 */
export function streakTier(streak: number): StreakTier {
  const capped = Math.min(Math.max(streak, 0), MAX_STREAK_TIER_AT);
  const level = Math.min(Math.floor(capped / STREAK_PER_TIER), TIERS.length - 1);
  return TIERS[level]!;
}

/** Cuántas encestadas faltan para el próximo nivel, o null si ya está al tope. */
export function shotsToNextTier(streak: number): number | null {
  if (streak >= MAX_STREAK_TIER_AT) return null;
  return STREAK_PER_TIER - (streak % STREAK_PER_TIER);
}
