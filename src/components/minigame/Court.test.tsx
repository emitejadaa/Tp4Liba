import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Court } from './Court';
import { INITIAL_AIM } from '@/lib/minigame/aim';

/**
 * El bucle que mueve el aro.
 *
 * Se prueba acá y no de punta a punta porque llegar a la racha que enciende el
 * aro móvil dentro de un navegador depende de la secuencia de vientos: hoy hacen
 * falta once tiros y mañana, si se toca un número del viento, otros tantos. Eso
 * sería un test que falla por algo que no está probando.
 */

const HOOP = '[data-testid="aro"]';

const props = {
  aim: INITIAL_AIM,
  wind: 0,
  shotId: 0,
  shooting: false,
  lastResult: null,
  reducedMotion: false,
  active: true,
  onAim: vi.fn(),
  onShoot: vi.fn(),
  onResolve: vi.fn(),
};

const transform = (container: HTMLElement) =>
  (container.querySelector(HOOP) as SVGGElement | null)?.style.transform ?? '';

describe('Court · el aro móvil', () => {
  it('con el aro quieto no se mueve nada', async () => {
    /*
     * Es casi todo el juego, y tiene que costar cero: con amplitud cero no se
     * monta ningún bucle. Si esto se rompiera, la landing entera pagaría un
     * `requestAnimationFrame` por cuadro para dibujar un aro que no se mueve.
     */
    const { container } = render(<Court {...props} hoopMotion={{ amplitude: 0, period: 4 }} />);
    const antes = transform(container);

    await new Promise((listo) => setTimeout(listo, 120));
    expect(transform(container)).toBe(antes);
  });

  it('con el aro móvil sube y baja', async () => {
    const { container } = render(<Court {...props} hoopMotion={{ amplitude: 30, period: 1 }} />);

    await waitFor(() => expect(transform(container)).toMatch(/translateY/));
    const antes = transform(container);
    await waitFor(() => expect(transform(container)).not.toBe(antes));
  });

  it('con la sección fuera de vista se queda quieto', async () => {
    // Un bucle de animación corriendo para nadie es batería tirada.
    const { container } = render(
      <Court {...props} active={false} hoopMotion={{ amplitude: 30, period: 1 }} />,
    );
    const antes = transform(container);

    await new Promise((listo) => setTimeout(listo, 120));
    expect(transform(container)).toBe(antes);
  });

  it('con movimiento reducido tampoco', async () => {
    /*
     * No es sólo que sea una animación: apuntarle a un aro que se mueve **es**
     * reaccionar al movimiento, así que dejarlo andando sería pedirle a quien
     * pidió que nada se moviera justo lo que pidió no tener que hacer.
     */
    const { container } = render(
      <Court {...props} reducedMotion hoopMotion={{ amplitude: 30, period: 1 }} />,
    );
    const antes = transform(container);

    await new Promise((listo) => setTimeout(listo, 120));
    expect(transform(container)).toBe(antes);
  });
});
