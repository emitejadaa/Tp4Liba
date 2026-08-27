import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Dato del hero: un punto naranja y una etiqueta corta. */
export function DotBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn('text-soft flex items-center gap-[9px] text-[15px] font-semibold', className)}
    >
      <span className="bg-orange size-[7px] shrink-0 rounded-full" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Etiqueta destacada, como el «Recomendado» del plan Oro. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'bg-orange text-ink rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
