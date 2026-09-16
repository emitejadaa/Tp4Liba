import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroBall } from './HeroBall';

describe('HeroBall', () => {
  it('dibuja las cuatro costuras, de los dos lados de la esfera', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelectorAll('[data-seam="front"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-seam="back"]')).toHaveLength(4);
  });

  it('sale dibujada del primer render, sin esperar a ninguna animación', () => {
    /*
     * El trazado inicial se calcula al renderizar y no en un efecto, así que el
     * HTML del servidor ya trae la pelota entera. Si dependiera del bucle, sin
     * JavaScript quedaría un hueco del tamaño de la pelota en el encabezado.
     */
    const { container } = render(<HeroBall />);
    for (const costura of container.querySelectorAll('[data-seam="front"]')) {
      expect(costura.getAttribute('d')).toMatch(/^M-?\d/);
    }
  });

  it('es decorativa: no la anuncia ningún lector de pantalla', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('fija el grosor del trazo en píxeles de pantalla', () => {
    // La pelota mide 280 px en un teléfono y 440 en escritorio; atado al
    // `viewBox`, el mismo dibujo saldría fino de un lado y grueso del otro.
    const { container } = render(<HeroBall />);
    for (const trazo of container.querySelectorAll('[vector-effect]')) {
      expect(trazo).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    }
    expect(container.querySelectorAll('[vector-effect]').length).toBeGreaterThan(4);
  });

  it('no monta un lienzo: la pelota es vectorial', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
