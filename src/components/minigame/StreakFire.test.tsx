import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakFire } from './StreakFire';
import { streakTier } from '@/lib/minigame/streak';

const fuego = (container: HTMLElement) => container.querySelector('svg');

describe('StreakFire', () => {
  it('no dibuja nada por debajo de tres encestadas', () => {
    for (const streak of [0, 1, 2]) {
      const { container } = render(<StreakFire streak={streak} reducedMotion={false} />);
      expect(container).toBeEmptyDOMElement();
    }
  });

  it('aparece a partir de la tercera', () => {
    const { container } = render(<StreakFire streak={3} reducedMotion={false} />);
    expect(fuego(container)).toBeInTheDocument();
  });

  it('crece a medida que sube la racha', () => {
    const alto = (streak: number) => {
      const { container } = render(<StreakFire streak={streak} reducedMotion={false} />);
      return Number.parseInt((container.firstElementChild as HTMLElement).style.height, 10);
    };

    expect(alto(6)).toBeGreaterThan(alto(3));
    expect(alto(12)).toBeGreaterThan(alto(6));
  });

  it('deja de crecer en el tope', () => {
    const alto = (streak: number) => {
      const { container } = render(<StreakFire streak={streak} reducedMotion={false} />);
      return (container.firstElementChild as HTMLElement).style.height;
    };
    expect(alto(50)).toBe(alto(15));
  });

  it('usa la paleta del nivel correspondiente', () => {
    const { container } = render(<StreakFire streak={15} reducedMotion={false} />);
    const [base] = streakTier(15).colors;
    expect(container.querySelector(`path[fill="${base}"]`)).toBeInTheDocument();
  });

  it('no larga chispas con prefers-reduced-motion', () => {
    const conMovimiento = render(<StreakFire streak={12} reducedMotion={false} />);
    const chispas = conMovimiento.container.querySelectorAll('span.rounded-full');
    expect(chispas.length).toBeGreaterThan(0);

    const sinMovimiento = render(<StreakFire streak={12} reducedMotion />);
    expect(sinMovimiento.container.querySelectorAll('span.rounded-full')).toHaveLength(0);
    // La llama se sigue viendo: lo que se corta es el movimiento, no el estado.
    expect(fuego(sinMovimiento.container)).toBeInTheDocument();
  });

  it('queda fuera del árbol de accesibilidad, porque el estado va en el texto', () => {
    const { container } = render(<StreakFire streak={9} reducedMotion={false} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
