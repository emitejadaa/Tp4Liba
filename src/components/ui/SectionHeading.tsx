import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionHeadingProps = {
  id: string;
  children: ReactNode;
  /** Texto chico que acompaña al título (a la derecha en desktop). */
  aside?: ReactNode;
  /** Etiqueta en naranja por encima del título. */
  eyebrow?: string;
  className?: string;
};

/** Título de sección con su etiqueta y su nota al costado. */
export function SectionHeading({ id, children, aside, eyebrow, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-10', className)}>
      {eyebrow ? (
        <p className="text-orange mb-3 text-xs font-bold tracking-[0.18em] uppercase">{eyebrow}</p>
      ) : null}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
        <h2 id={id} className="text-4xl leading-[1.05] font-bold md:text-[2.75rem]">
          {children}
        </h2>
        {aside ? <p className="text-muted shrink-0 text-sm md:pb-1">{aside}</p> : null}
      </div>
    </div>
  );
}
