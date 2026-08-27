import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TournamentInfo } from './TournamentInfo';
import { TOURNAMENT_FACTS } from '@/data/tournament';

describe('TournamentInfo', () => {
  it('muestra las cuatro tarjetas del diseño', () => {
    render(<TournamentInfo />);
    expect(screen.getAllByRole('listitem')).toHaveLength(TOURNAMENT_FACTS.length);
  });

  it('muestra el título y la descripción de cada tarjeta', () => {
    render(<TournamentInfo />);
    for (const fact of TOURNAMENT_FACTS) {
      expect(screen.getByRole('heading', { name: fact.title, level: 3 })).toBeInTheDocument();
      expect(screen.getByText(fact.description)).toBeInTheDocument();
    }
  });

  it('titula la sección y la enlaza con su encabezado', () => {
    render(<TournamentInfo />);
    const heading = screen.getByRole('heading', { name: 'El torneo', level: 2 });
    expect(heading).toHaveAttribute('id', 'torneo-titulo');
    expect(screen.getByText('Temporada 2026')).toBeInTheDocument();
  });
});
