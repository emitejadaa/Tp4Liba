import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Venue } from './Venue';
import { VENUE } from '@/data/venue';

describe('Venue', () => {
  it('muestra la dirección y la descripción del diseño', () => {
    render(<Venue />);
    expect(screen.getByRole('heading', { name: VENUE.title, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(VENUE.description)).toBeInTheDocument();
  });

  it('no carga el iframe de Google hasta que se lo pide', () => {
    render(<Venue />);
    expect(screen.queryByTitle(/Mapa de/)).not.toBeInTheDocument();
    expect(screen.getByText(VENUE.placeholder)).toBeInTheDocument();
  });

  it('carga el mapa al tocar el placeholder', async () => {
    render(<Venue />);
    await userEvent.click(screen.getByRole('button', { name: /Tocá para cargar el mapa/ }));

    const frame = screen.getByTitle(`Mapa de ${VENUE.title}`);
    expect(frame).toHaveAttribute('src', VENUE.embedUrl);
  });

  it('abre Google Maps en una pestaña nueva de forma segura', () => {
    render(<Venue />);
    const link = screen.getByRole('link', { name: /Ver en Maps/ });
    expect(link).toHaveAttribute('href', VENUE.mapsUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
