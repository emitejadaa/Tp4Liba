import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Schedule } from './Schedule';
import { SCHEDULE } from '@/data/schedule';

describe('Schedule', () => {
  it('muestra los cuatro cruces de la fecha', () => {
    render(<Schedule />);
    expect(screen.getAllByRole('listitem')).toHaveLength(SCHEDULE.matches.length);

    for (const match of SCHEDULE.matches) {
      expect(screen.getByText(match.home)).toBeInTheDocument();
      expect(screen.getByText(match.away)).toBeInTheDocument();
    }
  });

  it('mantiene los boxscore cerrados al principio', () => {
    render(<Schedule />);
    for (const button of screen.getAllByRole('button', { name: /Ver boxscore/ })) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('abre y cierra el boxscore de un cruce', async () => {
    render(<Schedule />);
    const [first] = screen.getAllByRole('button', { name: /Ver boxscore/ });

    await userEvent.click(first!);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Se cargan al terminar el partido/)).toBeInTheDocument();

    await userEvent.click(first!);
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  it('deja abierto un solo boxscore a la vez', async () => {
    render(<Schedule />);
    const buttons = screen.getAllByRole('button', { name: /Ver boxscore/ });

    await userEvent.click(buttons[0]!);
    await userEvent.click(buttons[1]!);

    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra el cierre de la fecha', () => {
    render(<Schedule />);
    expect(screen.getByText(SCHEDULE.closing.note)).toBeInTheDocument();
    expect(screen.getByText(SCHEDULE.closing.time)).toBeInTheDocument();
  });
});
