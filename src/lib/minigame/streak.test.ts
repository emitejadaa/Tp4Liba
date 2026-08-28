import { describe, expect, it } from 'vitest';
import { MAX_STREAK_TIER_AT, STREAK_PER_TIER, shotsToNextTier, streakTier } from './streak';

describe('streakTier', () => {
  it('no enciende nada por debajo de tres encestadas', () => {
    for (const streak of [0, 1, 2]) {
      expect(streakTier(streak).level).toBe(0);
      expect(streakTier(streak).height).toBe(0);
    }
  });

  it('sube un nivel cada tres encestadas', () => {
    expect(streakTier(3).level).toBe(1);
    expect(streakTier(6).level).toBe(2);
    expect(streakTier(9).level).toBe(3);
    expect(streakTier(12).level).toBe(4);
    expect(streakTier(15).level).toBe(5);
  });

  it('mantiene el nivel dentro del tramo de tres', () => {
    expect(streakTier(6).level).toBe(streakTier(8).level);
    expect(streakTier(9).level).toBe(streakTier(11).level);
  });

  it('deja de escalar en el tope', () => {
    const tope = streakTier(MAX_STREAK_TIER_AT);
    expect(streakTier(40)).toEqual(tope);
    expect(streakTier(1000)).toEqual(tope);
  });

  it('crece y se acelera con cada nivel', () => {
    const niveles = [0, 3, 6, 9, 12, 15].map(streakTier);

    for (let i = 1; i < niveles.length; i++) {
      expect(niveles[i]!.height).toBeGreaterThan(niveles[i - 1]!.height);
      expect(niveles[i]!.sparks).toBeGreaterThanOrEqual(niveles[i - 1]!.sparks);
    }
    // El titileo se acelera a partir del primer nivel encendido.
    for (let i = 2; i < niveles.length; i++) {
      expect(niveles[i]!.flicker).toBeLessThan(niveles[i - 1]!.flicker);
    }
  });

  it('cambia de color en cada nivel', () => {
    const paletas = [3, 6, 9, 12, 15].map((s) => streakTier(s).colors.join());
    expect(new Set(paletas).size).toBe(paletas.length);
  });

  it('describe el nivel en texto para lectores de pantalla', () => {
    expect(streakTier(0).label).toBe('sin racha');
    expect(streakTier(15).label).not.toBe(streakTier(3).label);
  });

  it('trata una racha negativa como cero', () => {
    expect(streakTier(-5).level).toBe(0);
  });
});

describe('shotsToNextTier', () => {
  it('cuenta cuánto falta para encender el próximo nivel', () => {
    expect(shotsToNextTier(0)).toBe(STREAK_PER_TIER);
    expect(shotsToNextTier(1)).toBe(2);
    expect(shotsToNextTier(2)).toBe(1);
    expect(shotsToNextTier(3)).toBe(STREAK_PER_TIER);
  });

  it('es null cuando ya llegó al tope', () => {
    expect(shotsToNextTier(MAX_STREAK_TIER_AT)).toBeNull();
    expect(shotsToNextTier(30)).toBeNull();
  });
});
