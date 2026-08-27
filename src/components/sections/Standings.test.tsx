import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Standings } from './Standings';
import { STANDINGS } from '@/data/standings';

const table = () => screen.getByRole('table');
const teamNames = () =>
  within(table())
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent);

describe('Standings', () => {
  it('muestra los ocho equipos', () => {
    render(<Standings />);
    expect(teamNames()).toHaveLength(STANDINGS.length);
  });

  it('arranca ordenada por puntos de mayor a menor', () => {
    render(<Standings />);
    expect(teamNames()[0]).toBe('Los Halcones');
    expect(teamNames().at(-1)).toBe('Rebote Club');
  });

  it('declara la columna ordenada con aria-sort', () => {
    render(<Standings />);
    const header = within(table()).getByRole('columnheader', { name: /Ordenar por Puntos/ });
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('invierte el orden al tocar dos veces la misma columna', async () => {
    render(<Standings />);
    await userEvent.click(screen.getByRole('button', { name: /Ordenar por Puntos/ }));

    expect(teamNames()[0]).toBe('Rebote Club');
    expect(
      within(table()).getByRole('columnheader', { name: /Ordenar por Puntos/ }),
    ).toHaveAttribute('aria-sort', 'ascending');
  });

  it('reordena por partidos ganados', async () => {
    render(<Standings />);
    await userEvent.click(screen.getByRole('button', { name: /Ordenar por Partidos ganados/ }));

    expect(teamNames()[0]).toBe('Los Halcones');
    expect(teamNames().at(-1)).toBe('Rebote Club');
    expect(
      within(table()).getByRole('columnheader', { name: /Ordenar por Puntos/ }),
    ).toHaveAttribute('aria-sort', 'none');
  });

  it('aclara que los datos son de ejemplo', () => {
    render(<Standings />);
    expect(screen.getByText('Datos de ejemplo · la temporada no arrancó')).toBeInTheDocument();
  });
});
