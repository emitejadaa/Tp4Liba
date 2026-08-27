import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('une las clases con espacios', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('descarta los valores falsy de los condicionales', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });

  it('devuelve string vacío sin clases', () => {
    expect(cn()).toBe('');
  });
});
