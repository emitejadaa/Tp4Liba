import { describe, expect, it, vi } from 'vitest';
import { runTransition, sectionTarget, type Transition } from './transition';

describe('runTransition', () => {
  it('tapa, cambia y destapa, en ese orden', async () => {
    const orden: string[] = [];
    const transition: Transition = {
      name: 'test',
      leave: () => {
        orden.push('leave');
      },
      enter: () => {
        orden.push('enter');
      },
    };

    await runTransition(transition, { from: 'inicio', to: 'tabla' }, () => orden.push('swap'));
    expect(orden).toEqual(['leave', 'swap', 'enter']);
  });

  it('espera a que termine de tapar antes de cambiar', async () => {
    // Si el cambio pasara mientras el telón todavía entra, se vería la página
    // saltar por el borde: es el error que todo el ciclo existe para evitar.
    const orden: string[] = [];
    const transition: Transition = {
      name: 'test',
      leave: async () => {
        await Promise.resolve();
        orden.push('leave');
      },
    };

    await runTransition(transition, { from: null, to: 'tabla' }, () => orden.push('swap'));
    expect(orden).toEqual(['leave', 'swap']);
  });

  it('destapa igual si tapar falló', async () => {
    const enter = vi.fn();
    const transition: Transition = {
      name: 'test',
      leave: () => {
        throw new Error('se rompió el telón');
      },
      enter,
    };

    await expect(
      runTransition(transition, { from: null, to: 'tabla' }, () => {}),
    ).rejects.toThrow();
    // Una pantalla tapada para siempre es peor que una animación cortada.
    expect(enter).toHaveBeenCalledOnce();
  });

  it('no cambia si tapar falló', async () => {
    const swap = vi.fn();
    const transition: Transition = {
      name: 'test',
      leave: () => {
        throw new Error('se rompió el telón');
      },
    };

    await expect(runTransition(transition, { from: null, to: 'tabla' }, swap)).rejects.toThrow();
    expect(swap).not.toHaveBeenCalled();
  });

  it('funciona con una transición sin ganchos', async () => {
    const swap = vi.fn();
    await runTransition({ name: 'vacía' }, { from: null, to: 'tabla' }, swap);
    expect(swap).toHaveBeenCalledOnce();
  });
});

describe('sectionTarget', () => {
  it('devuelve el id de un ancla interna', () => {
    expect(sectionTarget({ href: '#cronograma' })).toBe('cronograma');
  });

  it('ignora los enlaces que salen de la página', () => {
    expect(sectionTarget({ href: 'https://instagram.com/liba.arg' })).toBeNull();
    expect(sectionTarget({ href: 'mailto:hola@liba.ar' })).toBeNull();
    expect(sectionTarget({ href: '/otra-pagina' })).toBeNull();
  });

  it('ignora el `#` pelado, que significa volver arriba', () => {
    expect(sectionTarget({ href: '#' })).toBeNull();
  });

  it('ignora los enlaces que abren en otra pestaña', () => {
    expect(sectionTarget({ href: '#tabla', target: '_blank' })).toBeNull();
    // `_self` es lo mismo que no declarar nada.
    expect(sectionTarget({ href: '#tabla', target: '_self' })).toBe('tabla');
  });

  it('ignora las descargas', () => {
    expect(sectionTarget({ href: '#tabla', hasDownload: true })).toBeNull();
  });

  it('deja pasar el click con modificadores, que es «abrir en otra pestaña»', () => {
    // Taparle la pantalla a quien pidió una pestaña nueva sería animar un salto
    // que no va a pasar.
    for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(sectionTarget({ href: '#tabla' }, { [modifier]: true })).toBeNull();
    }
  });
});
