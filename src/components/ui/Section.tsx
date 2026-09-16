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
   * Dispositivo de scroll del motor de scroll-craft.
   *
   * `flow` no cambia la caja: la sección ocupa lo que ocupa su contenido y lo
   * único que hace el motor es publicar el avance. `pin` y `pan` sí la cambian:
   * el motor le fija el alto en pantallas (`span`) y pega el escenario, así que
   * la sección se queda quieta mientras su contenido avanza adentro.
   *
   * Un acto clavado se lleva la cámara de profundidad: son dos movimientos
   * peleando por lo mismo, y la regla es una cosa por acto.
   */
  act?: 'flow' | 'pin' | 'pan';
  /**
   * Pantallas de scroll que ocupa un acto clavado.
   *
   * El mínimo útil es 1,2. Por debajo, el recorrido del acto es de unos pocos
   * píxeles: el avance salta de 0 a 1 entre dos notches de la rueda y todo lo
   * que depende de él se ve a los tirones en vez de correr.
   */
  span?: number;
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
  act = 'flow',
  span,
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
  const pinned = act !== 'flow';
  const content = <>{children}</>;

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-sc-act={act}
      data-sc-span={span}
      data-sc-drift={drift}
      data-sc-spotlight={spotlight ? '' : undefined}
      /*
       * El alto de un acto clavado lo declara el HTML, no el motor.
       *
       * El motor se lo fija igual al montar, pero eso pasa después de la primera
       * pintura: hasta ese momento la sección mide lo que mide su contenido, y
       * cuando el motor llega la página pega un salto de varias pantallas. Con el
       * alto puesto desde el arranque, el motor escribe el mismo valor y no se
       * mueve nada.
       */
      style={pinned && span ? { height: `${span * 100}vh` } : undefined}
      className={cn(
        'relative isolate scroll-mt-24',
        // Un acto clavado no lleva relleno vertical: el motor le fija el alto y
        // adentro el escenario ocupa la pantalla entera y centra su contenido.
        pinned ? 'py-0' : 'py-16 md:py-20 lg:py-22',
        bordered && 'border-line border-t',
        className,
      )}
    >
      {mark ? <DepthPlanes mark={mark} /> : null}

      {pinned ? (
        <div className="sc-stage flex items-center">
          {/*
            El riel va a sangre y se pone su propio margen: el motor lo desplaza
            exactamente lo que sobresale de la **ventana**, así que metido en un
            contenedor con ancho máximo terminaría el recorrido con el último
            ítem pasado del borde.
          */}
          <div className={cn('relative z-10 w-full', act !== 'pan' && 'layout-container')}>
            {content}
          </div>
        </div>
      ) : depth ? (
        <DepthLayer className="layout-container relative z-10">{content}</DepthLayer>
      ) : (
        <div className="layout-container relative z-10">{content}</div>
      )}
    </section>
  );
}
