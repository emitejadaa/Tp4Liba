import type { TeamRow } from '@/data/standings';

/** Columnas por las que se puede ordenar la tabla. */
export type SortKey = 'points' | 'won' | 'played';

export type SortDirection = 'asc' | 'desc';

/**
 * Ordena la tabla de posiciones.
 *
 * Los desempates siguen el criterio habitual de una liga: primero puntos, y ante
 * igualdad de puntos gana quien tiene más partidos ganados. Si aún así empatan,
 * se ordena por nombre para que el resultado sea estable entre renders — sin
 * eso, dos equipos con la misma línea podrían intercambiarse de lugar y la
 * animación de reordenamiento haría saltar filas sin motivo.
 */
export function sortStandings(
  rows: readonly TeamRow[],
  key: SortKey,
  direction: SortDirection,
): TeamRow[] {
  const factor = direction === 'desc' ? -1 : 1;

  return [...rows].sort((a, b) => {
    if (a[key] !== b[key]) return (a[key] - b[key]) * factor;
    if (a.won !== b.won) return (a.won - b.won) * factor;
    return a.team.localeCompare(b.team, 'es');
  });
}

/** Alterna la dirección: al tocar otra columna se arranca de mayor a menor. */
export function nextSort(
  current: { key: SortKey; direction: SortDirection },
  key: SortKey,
): { key: SortKey; direction: SortDirection } {
  if (current.key !== key) return { key, direction: 'desc' };
  return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
}
