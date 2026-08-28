import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Confetti } from './Confetti';

const particulas = (container: HTMLElement) =>
  container.querySelectorAll('span[style*="background-color"]');

describe('Confetti', () => {
  it('dibuja una partícula por unidad pedida', () => {
    const { container } = render(<Confetti shotId={1} count={12} delaySeconds={0} />);
    expect(particulas(container)).toHaveLength(12);
  });

  it('no dibuja nada con cero partículas', () => {
    const { container } = render(<Confetti shotId={1} count={0} delaySeconds={0} />);
    expect(particulas(container)).toHaveLength(0);
  });

  it('reparte las partículas en posiciones distintas', () => {
    const { container } = render(<Confetti shotId={3} count={10} delaySeconds={0} />);
    const tamaños = [...particulas(container)].map((el) => (el as HTMLElement).style.width);
    expect(new Set(tamaños).size).toBeGreaterThan(1);
  });

  it('es determinista: el mismo tiro reparte igual', () => {
    const leer = () => {
      const { container } = render(<Confetti shotId={7} count={8} delaySeconds={0} />);
      return [...particulas(container)].map((el) => (el as HTMLElement).style.cssText);
    };
    expect(leer()).toEqual(leer());
  });

  it('reparte distinto en tiros distintos', () => {
    const leer = (shotId: number) => {
      const { container } = render(<Confetti shotId={shotId} count={8} delaySeconds={0} />);
      return [...particulas(container)].map((el) => (el as HTMLElement).style.cssText).join('|');
    };
    expect(leer(1)).not.toBe(leer(2));
  });

  it('queda fuera del árbol de accesibilidad', () => {
    const { container } = render(<Confetti shotId={1} count={4} delaySeconds={0} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
