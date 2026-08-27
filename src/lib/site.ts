/** Datos de identidad de la liga, usados en metadata y en la UI. */
export const SITE = {
  name: 'LIBA',
  tagline: 'Liga amateur de básquet 3v3',
  city: 'Palermo, Buenos Aires',
  email: 'libaarg2026@gmail.com',
  season: 2026,
} as const;

/** Prefijo de ruta con el que se publica el sitio (vacío en desarrollo). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Antepone el basePath a una ruta de `public/`, para que funcione en Pages. */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
