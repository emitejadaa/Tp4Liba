import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShootoutGame } from './ShootoutGame';

/**
 * El bucle que mueve la mira arranca sólo cuando la sección entra en pantalla.
 * Estos tests dejan el `IntersectionObserver` sin disparar a propósito: así la
 * mira se queda en el centro y cada tiro da el mismo resultado siempre.
 *
 * Dejarla en movimiento haría que el resultado dependiera de cuántos frames
 * alcanzó a correr el runner antes del click, que es exactamente el tipo de
 * test que pasa en una máquina y falla en otra. El comportamiento con la mira
 * moviéndose se verifica en los tests end-to-end, donde el reloj se controla.
 */
function observeWithoutFiring() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}

const statValue = (label: string) =>
  screen.getByText(label).parentElement?.querySelector('dd')?.textContent;

beforeEach(() => {
  observeWithoutFiring();
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ShootoutGame', () => {
  it('muestra el instructivo del diseño', () => {
    render(<ShootoutGame />);
    expect(screen.getByRole('heading', { name: 'Tirá al aro' })).toBeInTheDocument();
    expect(screen.getByText(/La mira se mueve sola/)).toBeInTheDocument();
  });

  it('arranca con los tres contadores en cero', () => {
    render(<ShootoutGame />);
    expect(statValue('Encestadas')).toBe('0');
    expect(statValue('Tiros')).toBe('0');
    expect(statValue('Racha')).toBe('0');
  });

  it('espera antes del primer tiro', () => {
    render(<ShootoutGame />);
    expect(screen.getByRole('status')).toHaveTextContent('Esperá la zona naranja');
  });

  it('cuenta el tiro al tocar Tirar', async () => {
    render(<ShootoutGame />);
    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));
    expect(statValue('Tiros')).toBe('1');
  });

  it('encesta cuando la mira está quieta en el centro', async () => {
    // Con la sección fuera de vista no corre ningún frame, así que la mira
    // sigue en el 0.5 con el que arranca el reducer.
    render(<ShootoutGame />);
    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));

    expect(statValue('Encestadas')).toBe('1');
    expect(statValue('Racha')).toBe('1');
    expect(screen.getByRole('status')).toHaveTextContent('¡Triple! +3');
  });

  it('acumula tiros en varias jugadas', async () => {
    render(<ShootoutGame />);
    const button = screen.getByRole('button', { name: 'Tirar' });

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(statValue('Tiros')).toBe('3');
  });

  it('describe la posición de la mira para lectores de pantalla', () => {
    render(<ShootoutGame />);
    const bar = screen.getByRole('progressbar', { name: 'Puntería' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', 'La mira está en la zona naranja');
  });

  it('guarda la mejor racha para la próxima visita', async () => {
    render(<ShootoutGame />);
    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));

    expect(window.localStorage.getItem('liba:mejor-racha')).toBe('1');
    expect(screen.getByText(/Mejor racha:/)).toBeInTheDocument();
  });

  it('retoma el récord guardado de una visita anterior', () => {
    window.localStorage.setItem('liba:mejor-racha', '7');
    render(<ShootoutGame />);

    const record = screen.getByText(/Mejor racha:/);
    expect(within(record).getByText('7')).toBeInTheDocument();
  });
});
