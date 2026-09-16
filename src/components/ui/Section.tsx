import type { ReactNode } from 'react';
import { DepthLayer } from '@/components/ui/DepthLayer';
import { DepthPlanes } from '@/components/ui/DepthPlanes';
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
  /**
   * Marca de cancha que se dibuja en los planos del fondo. Conviene alternarla
   * entre secciones vecinas: repetida, el fondo se lee como un patrón.
   */
  mark?: 'circle' | 'key' | 'arc';
  /**
   * Color hacia el que el motor de scroll-craft tiñe el fondo de la página
   * mientras se recorre la sección. El viaje de un extremo al otro de la landing
   * es de unos pocos puntos de luminosidad: la idea es que se note al llegar
   * abajo, no en la transición.
   */
  drift?: string;
  /**
   * Enciende una luz que sigue al puntero por detrás del contenido. Es un solo
   * `data-sc-spotlight` por sección: el motor mide un elemento por movimiento
   * del mouse, y no uno por tarjeta.
   */
  spotlight?: boolean;
  'aria-labelledby'?: string;
};

/** Envoltorio de sección con el ancho y el ritmo vertical del diseño. */
export function Section({
  id,
  children,
  className,
  bordered = true,
  depth = false,
  mark,
  drift,
  spotlight = false,
  'aria-labelledby': labelledBy,
}: SectionProps) {
  /*
   * `data-sc-act="flow"` no cambia nada de la caja: le pide al motor que publique
   * en este elemento el avance de la sección —de que asoma por abajo a que
   * termina de salir por arriba— como la variable `--sc-p`. De ahí la leen los
   * planos del fondo, que se inclinan sin una línea de JavaScript propio.
   *
   * `isolate` arma el contexto de apilado que ordena las tres capas: el fondo de
   * la sección abajo, los planos en el medio y el contenido arriba.
   */
  const content = <>{children}</>;

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-sc-act="flow"
      data-sc-drift={drift}
      data-sc-spotlight={spotlight ? '' : undefined}
      className={cn(
        'relative isolate scroll-mt-24 py-16 md:py-20 lg:py-22',
        bordered && 'border-line border-t',
        className,
      )}
    >
      {mark ? <DepthPlanes mark={mark} /> : null}

      {depth ? (
        <DepthLayer className="layout-container relative z-10">{content}</DepthLayer>
      ) : (
        <div className="layout-container relative z-10">{content}</div>
      )}
    </section>
  );
}
