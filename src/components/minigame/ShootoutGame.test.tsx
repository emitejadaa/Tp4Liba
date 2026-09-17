import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShootoutGame } from './ShootoutGame';
import { INITIAL_AIM, MAX_ANGLE } from '@/lib/minigame/aim';

/**
 * Los tests corren con `prefers-reduced-motion`.
 *
 * No es para esquivar el movimiento: es que en ese modo el tiro se resuelve de
 * una —se simula entero y se avisa el resultado— en vez de repartirse en cuadros
 * de `requestAnimationFrame`. La simulación es exactamente la misma, así que se
 * verifica el mismo juego sin que el resultado dependa de cuántos cuadros
 * alcanzó a dibujar la máquina antes de que el test mirara.
 *
 * El vuelo cuadro a cuadro y el arrastre con el dedo se prueban en los tests
 * end-to-end, que es donde hay un navegador que los puede hacer.
 */
function prefersReducedMotion() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

const statValue = (label: string) =>
  screen.getByText(label).parentElement?.querySelector('dd')?.textContent;

const court = () => screen.getByRole('application');
const tirar = () => screen.getByRole('button', { name: 'Tirar' });
const angle = () => screen.getByRole('progressbar', { name: 'Ángulo del tiro' });
const power = () => screen.getByRole('progressbar', { name: 'Fuerza del tiro' });

beforeEach(() => {
  prefersReducedMotion();
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ShootoutGame', () => {
  it('explica que se apunta arrastrando desde la pelota', () => {
    render(<ShootoutGame />);
    expect(screen.getByRole('heading', { name: 'Tirá al aro' })).toBeInTheDocument();
    expect(screen.getByText(/Arrastrá desde la pelota/)).toBeInTheDocument();
  });

  it('arranca con los tres contadores en cero', () => {
    render(<ShootoutGame />);
    expect(statValue('Encestadas')).toBe('0');
    expect(statValue('Tiros')).toBe('0');
    expect(statValue('Racha')).toBe('0');
  });

  it('invita a arrastrar antes del primer tiro', () => {
    render(<ShootoutGame />);
    expect(screen.getByRole('status')).toHaveTextContent('Arrastrá para apuntar');
  });

  it('la puntería con la que arranca entra limpia', async () => {
    // Es lo que hace que el primer tiro enseñe a jugar en vez de castigar por no
    // saber todavía. Si dejara de entrar, el botón «Tirar» sería para errar.
    render(<ShootoutGame />);
    await userEvent.click(tirar());

    expect(statValue('Tiros')).toBe('1');
    expect(statValue('Encestadas')).toBe('1');
    expect(statValue('Racha')).toBe('1');
    expect(screen.getByRole('status')).toHaveTextContent('¡Limpia! +3');
  });

  it('acumula tiros en varias jugadas', async () => {
    render(<ShootoutGame />);
    await userEvent.click(tirar());
    await userEvent.click(tirar());
    await userEvent.click(tirar());

    expect(statValue('Tiros')).toBe('3');
  });

  it('un tiro flojo falla y corta la racha', async () => {
    render(<ShootoutGame />);
    await userEvent.click(tirar());
    expect(statValue('Racha')).toBe('1');

    // Trece flechas para abajo bajan la fuerza de 62% a 23%: se queda corto.
    court().focus();
    await userEvent.keyboard('{ArrowLeft>13/}');
    await userEvent.click(tirar());

    expect(statValue('Tiros')).toBe('2');
    expect(statValue('Encestadas')).toBe('1');
    expect(statValue('Racha')).toBe('0');
    expect(screen.getByRole('status')).toHaveTextContent('Afuera');
  });

  it('guarda la mejor racha para la próxima visita', async () => {
    render(<ShootoutGame />);
    await userEvent.click(tirar());

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

describe('ShootoutGame · apuntar con el teclado', () => {
  it('muestra con qué fuerza y en qué ángulo va a salir', () => {
    render(<ShootoutGame />);
    expect(angle()).toHaveAttribute('aria-valuenow', String(INITIAL_AIM.angle));
    expect(power()).toHaveAttribute('aria-valuenow', String(Math.round(INITIAL_AIM.power * 100)));
  });

  it('las flechas de arriba y abajo mueven el ángulo', async () => {
    render(<ShootoutGame />);
    court().focus();

    await userEvent.keyboard('{ArrowUp}');
    expect(Number(angle().getAttribute('aria-valuenow'))).toBeGreaterThan(INITIAL_AIM.angle);

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(Number(angle().getAttribute('aria-valuenow'))).toBeLessThan(INITIAL_AIM.angle);
  });

  it('las de los costados mueven la fuerza', async () => {
    render(<ShootoutGame />);
    court().focus();
    const inicial = Number(power().getAttribute('aria-valuenow'));

    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(Number(power().getAttribute('aria-valuenow'))).toBeGreaterThan(inicial);
  });

  it('el ángulo no se pasa de la vertical', async () => {
    // Un tiro que sale para atrás no es un tiro difícil, es un control roto.
    render(<ShootoutGame />);
    court().focus();

    await userEvent.keyboard('{ArrowUp>40/}');
    expect(angle()).toHaveAttribute('aria-valuenow', String(MAX_ANGLE));
  });

  it('Enter tira', async () => {
    render(<ShootoutGame />);
    court().focus();

    await userEvent.keyboard('{Enter}');
    expect(statValue('Tiros')).toBe('1');
  });

  it('la cancha se anuncia con la puntería puesta y las teclas', () => {
    // Es lo único que oye quien juega con el teclado: no tiene ni la guía
    // punteada ni el medidor.
    render(<ShootoutGame />);
    expect(court()).toHaveAccessibleName(
      expect.stringContaining('Ángulo 63 grados, fuerza 62%') as unknown as string,
    );
    expect(court().getAttribute('aria-label')).toContain('Enter para tirar');
  });
});

describe('ShootoutGame · el viento', () => {
  it('los primeros tiros no tienen viento', () => {
    render(<ShootoutGame />);
    expect(screen.getByText('sin viento')).toBeInTheDocument();
  });

  it('aparece cuando la racha lo pide', async () => {
    render(<ShootoutGame />);
    await userEvent.click(tirar());
    await userEvent.click(tirar());

    // Con dos encestadas seguidas el próximo tiro ya viene con viento, y se ve
    // antes de tirarlo: de eso se trata, de poder corregir.
    expect(screen.queryByText('sin viento')).not.toBeInTheDocument();
    expect(court().getAttribute('aria-label')).toMatch(/Viento (a favor|en contra)/);
  });
});
