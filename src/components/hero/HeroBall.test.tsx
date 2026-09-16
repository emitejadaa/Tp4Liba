import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroBall } from './HeroBall';

describe('HeroBall', () => {
  it('dibuja las cuatro costuras', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelectorAll('[data-seam]')).toHaveLength(4);
  });

  it('el cuerpo es un disco lleno con el naranja de la marca', () => {
    // Vacía se leía como un globo de alambre: un diagrama, no una pelota.
    const { container } = render(<HeroBall />);
    // Se busca dentro del cuerpo: en `defs` hay otro círculo, el del recorte.
    expect(container.querySelector('[data-ball="body"] circle')).toHaveAttribute(
      'fill',
      'var(--color-orange)',
    );
  });

  it('la apoya con una sombra debajo', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelector('[data-ball="shadow"]')).toBeInTheDocument();
  });

  it('sale dibujada del primer render, sin esperar a ninguna animación', () => {
    /*
     * El trazado inicial se calcula al renderizar y no en un efecto, así que el
     * HTML del servidor ya trae la pelota entera. Si dependiera del bucle, sin
     * JavaScript quedaría un hueco del tamaño de la pelota en el encabezado.
     */
    const { container } = render(<HeroBall />);
    for (const costura of container.querySelectorAll('[data-seam]')) {
      expect(costura.getAttribute('d')).toMatch(/^M-?\d/);
    }
  });

  it('es decorativa: no la anuncia ningún lector de pantalla', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('fija el grosor de las costuras en píxeles de pantalla', () => {
    // La pelota mide 280 px en un teléfono y 380 en escritorio; atado al
    // `viewBox`, el mismo dibujo saldría fino de un lado y grueso del otro.
    const { container } = render(<HeroBall />);
    const conTrazo = container.querySelectorAll('[vector-effect]');

    expect(conTrazo).toHaveLength(4);
    for (const trazo of conTrazo) {
      expect(trazo).toHaveAttribute('vector-effect', 'non-scaling-stroke');
      expect(trazo).toHaveAttribute('data-seam');
    }
  });

  it('recorta las costuras contra el cuerpo', () => {
    // El trazo tiene ancho: cerca de la silueta, la mitad cae fuera del disco y
    // se ven pestañas de tinta asomando por el borde.
    const { container } = render(<HeroBall />);
    const recorte = container.querySelector('clipPath');
    const costuras = container.querySelector('[data-seam]')?.closest('g');

    expect(recorte).toBeInTheDocument();
    expect(costuras).toHaveAttribute('clip-path', `url(#${recorte!.id})`);
  });

  it('cada pelota recorta con su propio id', () => {
    // Hay dos pelotas en la página —la del encabezado y la que la cruza—, y con
    // un id fijo la segunda apuntaría al recorte de la primera.
    const { container } = render(
      <>
        <HeroBall />
        <HeroBall />
      </>,
    );
    const ids = [...container.querySelectorAll('clipPath')].map((recorte) => recorte.id);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('no monta un lienzo: la pelota es vectorial', () => {
    const { container } = render(<HeroBall />);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
