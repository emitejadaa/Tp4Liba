import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
  /** Línea divisoria superior, como separa las secciones el diseño. */
  bordered?: boolean;
  'aria-labelledby'?: string;
};

/** Envoltorio de sección con el ancho y el ritmo vertical del diseño. */
export function Section({
  id,
  children,
  className,
  bordered = true,
  'aria-labelledby': labelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        'scroll-mt-24 py-16 md:py-20 lg:py-22',
        bordered && 'border-line border-t',
        className,
      )}
    >
      <div className="layout-container">{children}</div>
    </section>
  );
}
