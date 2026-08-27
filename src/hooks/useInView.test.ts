import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from './useInView';

type Trigger = (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void;

/** IntersectionObserver falso que nos deja disparar la intersección a mano. */
function mockObserver() {
  const disconnect = vi.fn();
  let trigger: Trigger = () => {};

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        trigger = (entries) => callback(entries as IntersectionObserverEntry[], this as never);
      }
      observe() {}
      unobserve() {}
      disconnect = disconnect;
      takeRecords() {
        return [];
      }
    },
  );

  return { fire: (isIntersecting: boolean) => trigger([{ isIntersecting }]), disconnect };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useInView', () => {
  it('arranca fuera de vista', () => {
    mockObserver();
    const { result } = renderHook(() => useInView());
    // Sin elemento asignado a la ref el observer nunca se crea.
    expect(result.current.inView).toBe(false);
  });

  it('se marca visible al intersectar y deja de observar con once', () => {
    const observer = mockObserver();
    const { result } = renderHook(() => {
      const view = useInView<HTMLDivElement>();
      // Simulamos el montaje del elemento observado.
      view.ref.current ??= document.createElement('div');
      return view;
    });

    act(() => observer.fire(true));
    expect(result.current.inView).toBe(true);
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('vuelve a ocultarse al salir cuando once es false', () => {
    const observer = mockObserver();
    const { result } = renderHook(() => {
      const view = useInView<HTMLDivElement>({ once: false });
      view.ref.current ??= document.createElement('div');
      return view;
    });

    act(() => observer.fire(true));
    expect(result.current.inView).toBe(true);

    act(() => observer.fire(false));
    expect(result.current.inView).toBe(false);
  });

  it('muestra el contenido si el navegador no soporta IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { result } = renderHook(() => {
      const view = useInView<HTMLDivElement>();
      view.ref.current ??= document.createElement('div');
      return view;
    });
    expect(result.current.inView).toBe(true);
  });
});
