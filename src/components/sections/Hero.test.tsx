import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Hero } from './Hero';
import { HERO } from '@/data/hero';

describe('Hero', () => {
  it('muestra el título del diseño en un h1', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Bienvenidos a LIBA');
  });

  it('muestra la bajada y los tres datos de la liga', () => {
    render(<Hero />);
    expect(screen.getByText(HERO.subtitle)).toBeInTheDocument();
    for (const badge of HERO.badges) {
      expect(screen.getByText(badge)).toBeInTheDocument();
    }
  });

  it('lleva al cronograma desde el botón secundario', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'Ver Cronograma' })).toHaveAttribute(
      'href',
      '#cronograma',
    );
  });

  it('dispara la inscripción desde el botón principal', async () => {
    const onRegister = vi.fn();
    render(<Hero onRegister={onRegister} />);

    await userEvent.click(screen.getByRole('button', { name: 'Inscribirse' }));
    expect(onRegister).toHaveBeenCalledOnce();
  });
});
