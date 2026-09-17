'use client';

import { MAX_ANGLE, MIN_ANGLE, type Aim } from '@/lib/minigame/aim';
import { MAX_WIND } from '@/lib/minigame/shootout';
import { cn } from '@/lib/cn';

/**
 * Lo que va a pasar cuando se suelte: con cuánta fuerza, en qué ángulo y con
 * qué viento.
 *
 * Es la barra que antes movía la mira sola, con el mismo alto, el mismo fondo y
 * los mismos bordes: cambió lo que mide, no cómo se ve. Ahora mide el arrastre,
 * que es lo único que decide un tiro.
 *
 * El viento tiene su propia barra porque es la otra mitad del problema y es la
 * que cambia sin que uno haga nada. Sale del centro para los dos lados: de qué
 * lado está el relleno es para dónde empuja, y cuánto llega es cuánto.
 */

type AimMeterProps = { aim: Aim; wind: number };

export function AimMeter({ aim, wind }: AimMeterProps) {
  const power = Math.round(aim.power * 100);
  const angle = Math.round(aim.angle);
  // El ángulo se dibuja sobre su propio recorrido, no sobre los 90 grados
  // enteros: si no, la mitad de la barra sería ángulo que no se puede elegir.
  const angleShare = ((angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100;
  const windShare = Math.min(Math.abs(wind) / MAX_WIND, 1) * 50;

  return (
    <div className="flex w-full max-w-[462px] flex-col gap-[10px]">
      <Row label="Fuerza" value={`${power}%`}>
        <div
          className="bg-orange absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${power}%` }}
          role="progressbar"
          aria-label="Fuerza del tiro"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={power}
          data-testid="power"
        />
      </Row>

      <Row label="Ángulo" value={`${angle}°`}>
        <div
          className="bg-orange absolute inset-y-0 w-[4px] -translate-x-1/2 rounded-full"
          style={{ left: `${angleShare}%` }}
          role="progressbar"
          aria-label="Ángulo del tiro"
          aria-valuemin={MIN_ANGLE}
          aria-valuemax={MAX_ANGLE}
          aria-valuenow={angle}
          aria-valuetext={`${angle} grados`}
          data-testid="angle"
        />
      </Row>

      <Row
        label="Viento"
        value={wind === 0 ? 'sin viento' : `${wind > 0 ? '→' : '←'} ${Math.abs(wind)}`}
        muted={wind === 0}
      >
        <div className="absolute inset-y-0 left-1/2 w-px bg-[rgb(148_163_184/0.3)]" />
        <div
          className="absolute inset-y-[3px] rounded-full bg-sky-400/70"
          style={
            wind >= 0
              ? { left: '50%', width: `${windShare}%` }
              : { right: '50%', width: `${windShare}%` }
          }
          data-testid="wind"
        />
      </Row>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  children,
}: {
  label: string;
  value: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-dim w-[54px] shrink-0 text-[12px] tracking-[0.08em] uppercase">
        {label}
      </span>
      <div className="relative h-[14px] min-w-0 flex-1 overflow-hidden rounded-full border border-[rgb(148_163_184/0.18)] bg-[#0a1524]">
        {children}
      </div>
      <span
        className={cn(
          'w-[72px] shrink-0 text-right text-[13px] font-semibold tabular-nums',
          muted ? 'text-dim' : 'text-soft',
        )}
      >
        {value}
      </span>
    </div>
  );
}
