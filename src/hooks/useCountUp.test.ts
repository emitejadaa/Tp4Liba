import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

/** Reemplaza requestAnimationFrame por una cola que podemos avanzar a mano. */
function mockRaf() {
  let now = 0;
  const queue: FrameRequestCallback[] = [];

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.spyOn(performance, 'now').mockImplementation(() => now);

  return {
    advance(ms: number) {
      now += ms;
      const pending = queue.splice(0, queue.length);
      for (const cb of pending) cb(now);
    },
  };
}

describe('useCountUp', () => {
  let raf: ReturnType<typeof mockRaf>;

  beforeEach(() => {
    raf = mockRaf();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('se queda en cero mientras no está activo', () => {
    const { result } = renderHook(() => useCountUp(12, false));
    expect(result.current).toBe(0);
  });

  it('llega al valor final cuando termina la animación', () => {
    const { result } = renderHook(() => useCountUp(12, true, 900));
    act(() => raf.advance(900));
    expect(result.current).toBe(12);
  });

  it('pasa por valores intermedios antes de llegar', () => {
    const { result } = renderHook(() => useCountUp(100, true, 1000));
    act(() => raf.advance(200));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it('salta directo al valor final sin duración', () => {
    const { result } = renderHook(() => useCountUp(7, true, 0));
    expect(result.current).toBe(7);
  });
});
