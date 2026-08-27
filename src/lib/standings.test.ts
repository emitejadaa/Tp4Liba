import { describe, expect, it } from 'vitest';
import type { TeamRow } from '@/data/standings';
import { STANDINGS } from '@/data/standings';
import { nextSort, sortStandings } from './standings';

const rows: readonly TeamRow[] = [
  { team: 'Bajo Aro', played: 6, won: 3, points: 9 },
  { team: 'Costa Rica FC', played: 6, won: 3, points: 9 },
  { team: 'Los Halcones', played: 6, won: 6, points: 12 },
  { team: 'Rebote Club', played: 6, won: 0, points: 6 },
];

describe('sortStandings', () => {
  it('ordena de mayor a menor por puntos', () => {
    const sorted = sortStandings(rows, 'points', 'desc');
    expect(sorted.map((row) => row.team)).toEqual([
      'Los Halcones',
      'Bajo Aro',
      'Costa Rica FC',
      'Rebote Club',
    ]);
  });

  it('invierte el orden en ascendente', () => {
    const sorted = sortStandings(rows, 'points', 'asc');
    expect(sorted[0]?.team).toBe('Rebote Club');
    expect(sorted.at(-1)?.team).toBe('Los Halcones');
  });

  it('desempata por partidos ganados', () => {
    const empatados: TeamRow[] = [
      { team: 'Doble Poste', played: 6, won: 1, points: 9 },
      { team: 'Triple Doble', played: 6, won: 4, points: 9 },
    ];
    expect(sortStandings(empatados, 'points', 'desc')[0]?.team).toBe('Triple Doble');
  });

  it('ordena por nombre cuando la línea es idéntica, para no saltar entre renders', () => {
    const iguales: TeamRow[] = [
      { team: 'Rebote Club', played: 6, won: 3, points: 9 },
      { team: 'Bajo Aro', played: 6, won: 3, points: 9 },
    ];
    const once = sortStandings(iguales, 'points', 'desc');
    const twice = sortStandings(once, 'points', 'desc');
    expect(once.map((row) => row.team)).toEqual(twice.map((row) => row.team));
    expect(once[0]?.team).toBe('Bajo Aro');
  });

  it('no muta el arreglo original', () => {
    const original = [...rows];
    sortStandings(rows, 'won', 'asc');
    expect(rows).toEqual(original);
  });

  it('deja la tabla del diseño en su orden original al ordenar por puntos', () => {
    const sorted = sortStandings(STANDINGS, 'points', 'desc');
    expect(sorted.map((row) => row.team)).toEqual(STANDINGS.map((row) => row.team));
  });
});

describe('nextSort', () => {
  it('arranca en descendente al cambiar de columna', () => {
    expect(nextSort({ key: 'points', direction: 'asc' }, 'won')).toEqual({
      key: 'won',
      direction: 'desc',
    });
  });

  it('alterna la dirección sobre la misma columna', () => {
    expect(nextSort({ key: 'points', direction: 'desc' }, 'points')).toEqual({
      key: 'points',
      direction: 'asc',
    });
  });
});
