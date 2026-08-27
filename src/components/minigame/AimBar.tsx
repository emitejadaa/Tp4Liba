'use client';

import { zoneHalfWidth } from '@/lib/minigame/shootout';

type AimBarProps = { aim: number; streak: number };

/**
 * Barra de puntería: la zona naranja y la mira que se mueve encima.
 *
 * Reproduce el nodo 4:102 del diseño: 18px de alto, fondo #0a1524, borde al 18%
 * y bordes redondeados completos.
 */
export function AimBar({ aim, streak }: AimBarProps) {
  const half = zoneHalfWidth(streak);
  const zoneLeft = (0.5 - half) * 100;
  const zoneWidth = half * 2 * 100;

  return (
    <div
      className="relative h-[18px] w-full max-w-[462px] overflow-hidden rounded-full border border-[rgb(148_163_184/0.18)] bg-[#0a1524]"
      role="progressbar"
      aria-label="Puntería"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(aim * 100)}
      aria-valuetext={
        Math.abs(aim - 0.5) <= half ? 'La mira está en la zona naranja' : 'La mira está afuera'
      }
    >
      <div
        className="bg-orange/30 absolute inset-y-0"
        style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
      />
      <div
        className="bg-orange absolute inset-y-0 w-[4px] -translate-x-1/2 rounded-full"
        style={{ left: `${aim * 100}%` }}
        data-testid="aim-marker"
      />
    </div>
  );
}
