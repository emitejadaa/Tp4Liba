import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('le pide al motor que publique el avance de la sección', () => {
    // `--sc-p` es de donde salen la inclinación de las placas del fondo y el
    // tinte del fondo de la página. Sin el acto no hay ninguna de las dos.
    const { container } = render(<Section id="torneo">contenido</Section>);
    expect(container.querySelector('section')).toHaveAttribute('data-sc-act', 'flow');
  });

  it('declara el color hacia el que tiñe el fondo, sólo si se lo pasan', () => {
    const { container: con } = render(
      <Section id="torneo" drift="#0a1524">
        contenido
      </Section>,
    );
    expect(con.querySelector('section')).toHaveAttribute('data-sc-drift', '#0a1524');

    const { container: sin } = render(<Section id="tabla">contenido</Section>);
    expect(sin.querySelector('section')).not.toHaveAttribute('data-sc-drift');
  });

  it('enciende la luz del puntero sólo cuando se la pide', () => {
    const { container: con } = render(
      <Section id="torneo" spotlight>
        contenido
      </Section>,
    );
    expect(con.querySelector('section')).toHaveAttribute('data-sc-spotlight');

    const { container: sin } = render(<Section id="tabla">contenido</Section>);
    expect(sin.querySelector('section')).not.toHaveAttribute('data-sc-spotlight');
  });

  it('dibuja los planos del fondo sólo cuando se elige una marca', () => {
    const { container: con } = render(
      <Section id="torneo" mark="circle">
        contenido
      </Section>,
    );
    expect(con.querySelectorAll('[data-sc-parallax]')).toHaveLength(3);

    const { container: sin } = render(<Section id="tabla">contenido</Section>);
    expect(sin.querySelectorAll('[data-sc-parallax]')).toHaveLength(0);
  });

  it('deja el contenido por encima de los planos', () => {
    /*
     * El orden de apilado no es cosmético: los planos se plantan con offsets
     * negativos y cruzan por detrás del texto. Si el contenido no queda arriba,
     * una raya de cancha pasa por encima de un título.
     */
    const { container } = render(
      <Section id="torneo" mark="circle">
        contenido
      </Section>,
    );
    const planos = container.querySelector('[data-sc-parallax]')?.closest('div[aria-hidden]');
    const contenido = container.querySelector('.layout-container');

    expect(planos?.className).toContain('z-0');
    expect(contenido?.className).toContain('z-10');
  });

  it('mantiene el ancla quieta: la profundidad se mueve por dentro', () => {
    // Transformar el `<section>` haría que el navegador calcule el salto del nav
    // contra una posición que cambia mientras se scrollea.
    const { container } = render(
      <Section id="cronograma" depth>
        contenido
      </Section>,
    );
    const seccion = container.querySelector('section');

    expect(seccion).toHaveAttribute('id', 'cronograma');
    expect(seccion?.querySelector('[data-depth-layer]')).toBeInTheDocument();
  });
});
