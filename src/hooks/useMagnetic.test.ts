import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMagnetic } from './useMagnetic';

function rafInmediato() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

function pointerEvent(clientX: number, clientY: number) {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 }) as DOMRect;
  return { clientX, clientY, currentTarget: element } as unknown as React.PointerEvent<HTMLElement>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useMagnetic', () => {
  it('arranca en su lugar', () => {
    const { result } = renderHook(() => useMagnetic());
    expect(result.current.offset).toEqual({ x: 0, y: 0 });
  });

  it('se corre hacia el puntero', () => {
    rafInmediato();
    const { result } = renderHook(() => useMagnetic(0.5, 20));

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    // El centro del elemento está en (50, 20); el puntero, a la derecha.
    act(() => result.current.handlers.onPointerMove(pointerEvent(90, 20)));

    expect(result.current.offset.x).toBeGreaterThan(0);
    expect(result.current.offset.y).toBe(0);
  });

  it('nunca se corre más que el máximo, para no escaparse del cursor', () => {
    rafInmediato();
    const { result } = renderHook(() => useMagnetic(5, 8));

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    act(() => result.current.handlers.onPointerMove(pointerEvent(5000, 5000)));

    expect(result.current.offset.x).toBe(8);
    expect(result.current.offset.y).toBe(8);
  });

  it('vuelve a su lugar al salir', () => {
    rafInmediato();
    const { result } = renderHook(() => useMagnetic());

    act(() => result.current.handlers.onPointerEnter(pointerEvent(0, 0)));
    act(() => result.current.handlers.onPointerMove(pointerEvent(90, 35)));
    act(() => result.current.handlers.onPointerLeave());

    expect(result.current.offset).toEqual({ x: 0, y: 0 });
  });
});
