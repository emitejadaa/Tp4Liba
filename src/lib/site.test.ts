import { describe, expect, it } from 'vitest';
import { SITE, asset } from './site';

describe('SITE', () => {
  it('expone el contacto de la liga', () => {
    expect(SITE.email).toBe('libaarg2026@gmail.com');
  });
});

describe('asset', () => {
  it('normaliza rutas sin barra inicial', () => {
    expect(asset('assets/ball.svg')).toBe('/assets/ball.svg');
  });

  it('deja intactas las rutas absolutas', () => {
    expect(asset('/assets/ball.svg')).toBe('/assets/ball.svg');
  });
});
