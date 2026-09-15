'use client';

import { useRef, type ReactNode } from 'react';
import { animate } from 'animejs';
import { EASE_ANIME } from '@/lib/anim/ease';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

type Stat = { label: string; value: number; accent?: boolean; adornment?: ReactNode };

/**
 * Un número que se da vuelta cuando cambia.
 *
 * Es la misma solapa que usan las filas de la tabla y el pase entre secciones:
 * gira desde su borde de arriba. Que el marcador hable el mismo idioma que el
 * resto de la página es lo que hace que un contador que sube se lea como parte
 * del sitio y no como un número que parpadeó.
 *
 * Lo mueve anime.js porque es un disparo suelto atado a un cambio de valor, no
 * un estado continuo: no hay nada que React tenga que seguir cuadro a cuadro.
 */
function FlipNumber({ value }: { value: number }) {
  const element = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const prefersReduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    if (!changed || prefersReduced || !element.current) return;

    const animation = animate(element.current, {
      rotateX: [-88, 0],
      y: ['-0.3em', '0em'],
      duration: 340,
      ease: EASE_ANIME,
    });

    return () => {
      animation.revert();
    };
  }, [value, prefersReduced]);

  return (
    <span ref={element} className="inline-block origin-top [transform-style:preserve-3d]">
      {value}
    </span>
  );
}

/** Los tres contadores del diseño: Encestadas, Tiros y Racha. */
export function ScoreStats({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl className="flex flex-wrap items-end gap-8">
      {stats.map(({ label, value, accent, adornment }) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt className="text-dim text-[15px] tracking-[0.04em] uppercase">{label}</dt>
          <dd
            className={cn(
              'flex items-end gap-1 text-[19px] font-bold tabular-nums',
              accent ? 'text-orange' : 'text-chalk',
            )}
            // La perspectiva va en el contenedor: el número gira contra ella.
            style={{ perspective: '420px' }}
          >
            <FlipNumber value={value} />
            {adornment}
          </dd>
        </div>
      ))}
    </dl>
  );
}
