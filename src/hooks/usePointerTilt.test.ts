import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePointerTilt } from './usePointerTilt';

/** Corre las devoluciones de requestAnimationFrame apenas se piden. */
function rafInmediato() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

/** Evento de puntero falso, con el rectángulo del elemento ya resuelto. */
function pointerEvent(clientX: number, clientY: number, rect: Partial<DOMRect> = {}) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, ...rect }) as DOMRect;
  return { clientX, clientY, currentTarget: element } as unknown as React.PointerEvent<HTMLElement>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePointerTilt', () => {
  it('arranca sin inclinación', () => {
    const { result } = renderHook(() => usePointerTilt());
    expect(result.current.tilt).toEqual({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  });

  it('no se inclina si el puntero no entró primero', () => {
    rafInmediato();
    const { result } = renderHook(() => usePointerTilt());

    act(() => result.current.handlers.onPointerMove(pointerEvent(180, 90)));
    expect(result.current.tilt.rotateY).toBe(0);
  });

  it('se inclina hacia el puntero', () => {
    rafInmediato();
    const { result } = renderHook(() => usePointerTilt(10));

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    // Esquina inferior derecha del elemento.
    act(() => result.current.handlers.onPointerMove(pointerEvent(200, 100)));

    expect(result.current.tilt.rotateY).toBeGreaterThan(0);
    expect(result.current.tilt.rotateX).toBeLessThan(0);
    expect(result.current.tilt.glareX).toBe(100);
  });

  it('invierte la inclinación del otro lado', () => {
    rafInmediato();
    const { result } = renderHook(() => usePointerTilt(10));

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    act(() => result.current.handlers.onPointerMove(pointerEvent(0, 0)));

    expect(result.current.tilt.rotateY).toBeLessThan(0);
    expect(result.current.tilt.rotateX).toBeGreaterThan(0);
  });

  it('respeta el ángulo máximo', () => {
    rafInmediato();
    const { result } = renderHook(() => usePointerTilt(6));

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    act(() => result.current.handlers.onPointerMove(pointerEvent(200, 100)));

    expect(Math.abs(result.current.tilt.rotateX)).toBeLessThanOrEqual(6);
    expect(Math.abs(result.current.tilt.rotateY)).toBeLessThanOrEqual(6);
  });

  it('vuelve al reposo al salir el puntero', () => {
    rafInmediato();
    const { result } = renderHook(() => usePointerTilt());

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    act(() => result.current.handlers.onPointerMove(pointerEvent(200, 100)));
    act(() => result.current.handlers.onPointerLeave());

    expect(result.current.tilt).toEqual({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  });

  it('mide el elemento una sola vez, al entrar', () => {
    rafInmediato();
    const { result } = renderHook(() => usePointerTilt());

    const evento = pointerEvent(0, 0);
    const medir = vi.spyOn(evento.currentTarget, 'getBoundingClientRect');

    act(() => result.current.handlers.onPointerEnter(evento));
    act(() => result.current.handlers.onPointerMove(pointerEvent(50, 50)));
    act(() => result.current.handlers.onPointerMove(pointerEvent(80, 60)));

    // Un getBoundingClientRect por movimiento fuerza recalcular layout.
    expect(medir).toHaveBeenCalledTimes(1);
  });
});
