import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Rules } from './Rules';
import { RULES } from '@/data/rules';

const buttonFor = (title: string) => screen.getByRole('button', { name: new RegExp(title) });

describe('Rules', () => {
  it('muestra un ítem por cada regla', () => {
    render(<Rules />);
    expect(screen.getAllByRole('button')).toHaveLength(RULES.length);
  });

  it('arranca con el primer ítem abierto, como en el diseño', () => {
    render(<Rules />);
    expect(buttonFor('Formato de juego')).toHaveAttribute('aria-expanded', 'true');
    expect(buttonFor('Sistema de puntaje')).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre un ítem cerrado y muestra su texto', async () => {
    render(<Rules />);
    const button = buttonFor('Código de conducta');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(RULES[3]!.body)).toBeInTheDocument();
  });

  it('cierra el ítem que ya estaba abierto', async () => {
    render(<Rules />);
    const button = buttonFor('Formato de juego');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('permite tener varias reglas abiertas a la vez', async () => {
    render(<Rules />);
    await userEvent.click(buttonFor('Presentación de equipos'));

    expect(buttonFor('Formato de juego')).toHaveAttribute('aria-expanded', 'true');
    expect(buttonFor('Presentación de equipos')).toHaveAttribute('aria-expanded', 'true');
  });

  it('enlaza cada botón con su panel', () => {
    render(<Rules />);
    const button = buttonFor('Formato de juego');
    const panelId = button.getAttribute('aria-controls');

    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toHaveAttribute('aria-labelledby', button.id);
  });
});
