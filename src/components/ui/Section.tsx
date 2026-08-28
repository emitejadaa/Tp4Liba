import type { ReactNode } from 'react';
import { DepthLayer } from '@/components/ui/DepthLayer';
import { cn } from '@/lib/cn';

type SectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
  /** Línea divisoria superior, como separa las secciones el diseño. */
  bordered?: boolean;
  /**
   * Mueve el contenido en profundidad al scrollear: llega desde el fondo y se
   * planta de frente mientras se lo lee.
   */
  depth?: boolean;
  'aria-labelledby'?: string;
};

/** Envoltorio de sección con el ancho y el ritmo vertical del diseño. */
export function Section({
  id,
  children,
  className,
  bordered = true,
  depth = false,
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
      {depth ? (
        <DepthLayer className="layout-container">{children}</DepthLayer>
      ) : (
        <div className="layout-container">{children}</div>
      )}
    </section>
  );
}
