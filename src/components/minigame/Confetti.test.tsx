import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Confetti } from './Confetti';

/** El confeti vive adentro de la SVG de la cancha, así que se lo monta ahí. */
const draw = (props: { shotId: number; count: number }) =>
  render(
    <svg viewBox="0 0 460 300">
      <Confetti {...props} />
    </svg>,
  );

const particulas = (container: HTMLElement) => container.querySelectorAll('rect');

describe('Confetti', () => {
  it('dibuja una partícula por unidad pedida', () => {
    const { container } = draw({ shotId: 1, count: 12 });
    expect(particulas(container)).toHaveLength(12);
  });

  it('no dibuja nada con cero partículas', () => {
    const { container } = draw({ shotId: 1, count: 0 });
    expect(particulas(container)).toHaveLength(0);
  });

  it('reparte las partículas en tamaños distintos', () => {
    const { container } = draw({ shotId: 3, count: 10 });
    const tamaños = [...particulas(container)].map((el) => el.getAttribute('width'));
    expect(new Set(tamaños).size).toBeGreaterThan(1);
  });

  it('es determinista: el mismo tiro reparte igual', () => {
    const leer = () => {
      const { container } = draw({ shotId: 7, count: 8 });
      return [...particulas(container)].map((el) => el.outerHTML);
    };
    expect(leer()).toEqual(leer());
  });

  it('reparte distinto en tiros distintos', () => {
    const leer = (shotId: number) => {
      const { container } = draw({ shotId, count: 8 });
      return [...particulas(container)].map((el) => el.outerHTML).join('|');
    };
    expect(leer(1)).not.toBe(leer(2));
  });

  it('va en unidades de cancha, así que se achica con ella', () => {
    // Antes era una capa de HTML por encima: en un teléfono salía a tamaño de
    // escritorio sobre una cancha de la mitad.
    const { container } = draw({ shotId: 1, count: 4 });
    const primera = particulas(container)[0]!;
    expect(Number(primera.getAttribute('width'))).toBeLessThan(10);
  });

  it('queda fuera del árbol de accesibilidad', () => {
    const { container } = draw({ shotId: 1, count: 4 });
    expect(container.querySelector('[data-testid="confetti"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
