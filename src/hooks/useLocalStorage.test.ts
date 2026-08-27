import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useLocalStorage', () => {
  it('arranca con el valor inicial cuando no hay nada guardado', () => {
    const { result } = renderHook(() => useLocalStorage('liba:racha', 0));
    expect(result.current[0]).toBe(0);
  });

  it('lee lo que había guardado', () => {
    window.localStorage.setItem('liba:racha', '5');
    const { result } = renderHook(() => useLocalStorage('liba:racha', 0));
    expect(result.current[0]).toBe(5);
  });

  it('persiste el valor nuevo', () => {
    const { result } = renderHook(() => useLocalStorage('liba:racha', 0));
    act(() => result.current[1](3));
    expect(result.current[0]).toBe(3);
    expect(window.localStorage.getItem('liba:racha')).toBe('3');
  });

  it('no rompe si el almacenamiento tira una excepción', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('acceso denegado');
    });

    const { result } = renderHook(() => useLocalStorage('liba:racha', 0));
    expect(() => act(() => result.current[1](9))).not.toThrow();
    // El estado en memoria igual avanza, sólo se pierde la persistencia.
    expect(result.current[0]).toBe(9);
  });
});
