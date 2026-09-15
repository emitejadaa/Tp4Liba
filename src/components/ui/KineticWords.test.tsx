import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KineticWords } from './KineticWords';

describe('KineticWords', () => {
  it('deja el texto completo en el HTML, no una pila de letras sueltas', () => {
    /*
     * El corte es por palabra y lo hace React, no el separador de anime.js: el
     * título tiene que salir entero del servidor para que lo lean los buscadores
     * y los lectores de pantalla. Si esto se rompe, la página sigue viéndose
     * igual y deja de leerse, que es la peor forma de romperse.
     */
    render(
      <h1>
        <KineticWords accent="LIBA">Bienvenidos a</KineticWords>
      </h1>,
    );

    expect(screen.getByRole('heading')).toHaveTextContent('Bienvenidos a LIBA');
  });

  it('separa una palabra por pieza animable', () => {
    const { container } = render(<KineticWords accent="LIBA">Bienvenidos a</KineticWords>);
    const piezas = container.querySelectorAll('[data-word]');

    // Dos palabras más el acento.
    expect(piezas).toHaveLength(3);
    expect([...piezas].map((pieza) => pieza.textContent)).toEqual(['Bienvenidos', 'a', 'LIBA']);
  });

  it('funciona sin acento', () => {
    const { container } = render(<KineticWords>Tirá al aro</KineticWords>);
    expect(container.querySelectorAll('[data-word]')).toHaveLength(3);
    expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe('Tirá al aro');
  });

  it('pinta el acento con la clase que se le pase', () => {
    const { container } = render(
      <KineticWords accent="LIBA" accentClassName="text-orange">
        Bienvenidos a
      </KineticWords>,
    );
    const acento = [...container.querySelectorAll('[data-word]')].at(-1);
    expect(acento?.className).toContain('text-orange');
  });
});
