import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DepthPlanes } from './DepthPlanes';
import { PLANE_RATE } from '@/lib/anim/tokens';

/** Las tasas de parallax que quedaron escritas en el HTML, en orden. */
function rates(container: HTMLElement): number[] {
  return [...container.querySelectorAll('[data-sc-parallax]')].map((plane) =>
    Number(plane.getAttribute('data-sc-parallax')),
  );
}

describe('DepthPlanes', () => {
  it('declara tres planos y ninguno viaja como otro', () => {
    // Con dos planos no hay profundidad, y con los tres a la misma tasa tampoco:
    // lo que arma la perspectiva es la diferencia, no el movimiento.
    const { container } = render(<DepthPlanes />);
    const tasas = rates(container);

    expect(tasas).toHaveLength(3);
    expect(new Set(tasas).size).toBe(3);
  });

  it('manda el fondo en contra del scroll y el frente a favor', () => {
    const { container } = render(<DepthPlanes />);
    const [fondo, medio, frente] = rates(container);

    expect(fondo).toBe(PLANE_RATE.back);
    expect(medio).toBe(PLANE_RATE.mid);
    expect(frente).toBe(PLANE_RATE.front);
    expect(Math.sign(fondo!)).not.toBe(Math.sign(frente!));
  });

  it('es decorativo: no lo anuncia ningún lector de pantalla', () => {
    const { container } = render(<DepthPlanes />);
    const raiz = container.firstElementChild;

    expect(raiz).toHaveAttribute('aria-hidden', 'true');
    expect(raiz?.className).toContain('pointer-events-none');
  });

  it('recorta sus planos, así el fondo nunca estira la página', () => {
    // Las marcas se plantan con offsets negativos a propósito; sin recorte,
    // ensancharían el documento y el teléfono se arrastraría para el costado.
    const { container } = render(<DepthPlanes />);
    expect(container.firstElementChild?.className).toContain('overflow-hidden');
  });

  it('cada marca dibuja algo distinto', () => {
    const dibujo = (mark: 'circle' | 'key' | 'arc') => {
      const { container } = render(<DepthPlanes mark={mark} />);
      return container.querySelector('svg')?.innerHTML ?? '';
    };

    const dibujos = [dibujo('circle'), dibujo('key'), dibujo('arc')];
    expect(new Set(dibujos).size).toBe(3);
  });
});
