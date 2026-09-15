/**
 * El ciclo de vida de una transición entre secciones.
 *
 * Está modelado sobre el de Barba.js —`once`, `leave`, `enter`, con el cambio de
 * contenido en el medio— porque es el modelo correcto para esto: separa
 * «tapar», «cambiar» y «destapar», y así el cambio nunca se ve a medio hacer.
 *
 * No es Barba. Barba resuelve navegación entre **documentos**: intercepta el
 * click, baja la otra página, reemplaza el contenedor y anima el cambio. Esta
 * landing es una sola ruta de Next exportada a un único HTML, y sus enlaces son
 * anclas dentro de esa página, así que no hay segundo documento que traer.
 * Inicializar Barba acá significaría que se apropie de los clicks para pedir por
 * red la misma página y reemplazar con ella el árbol que React está manejando,
 * que es la forma más rápida de romper la hidratación sin ganar nada.
 *
 * Lo que sí se toma es la idea, que es la parte que vale: acá el «documento
 * nuevo» es la sección de destino y el «cambio de contenedor» es el salto de
 * scroll. Tapado, el salto es instantáneo y no se ve; destapado, la sección ya
 * está en su lugar.
 *
 * Las funciones son puras y sin DOM a propósito: la coreografía concreta —el
 * telón de anime.js— se enchufa desde el componente, y este archivo se prueba
 * sin montar nada.
 */

export type TransitionContext = {
  /** Id de la sección desde la que se sale, o `null` en la primera carga. */
  from: string | null;
  /** Id de la sección a la que se va. */
  to: string;
};

export type Transition = {
  name: string;
  /** Corre una sola vez, en la primera carga. No hay `from`. */
  once?: (context: TransitionContext) => Promise<void> | void;
  /** Tapar. Termina con la pantalla cubierta. */
  leave?: (context: TransitionContext) => Promise<void> | void;
  /** Destapar. Arranca con la pantalla cubierta. */
  enter?: (context: TransitionContext) => Promise<void> | void;
};

/**
 * Corre una transición completa.
 *
 * `swap` es el cambio en sí —acá, el salto de scroll— y va entre `leave` y
 * `enter`, nunca en paralelo: si el salto pasara mientras el telón todavía está
 * entrando, se vería la página moverse por el borde.
 *
 * Si `leave` o `swap` fallan, `enter` corre igual. Un telón que se queda puesto
 * porque algo tiró una excepción deja la página tapada y sin manera de seguir,
 * que es mucho peor que una animación cortada.
 */
export async function runTransition(
  transition: Transition,
  context: TransitionContext,
  swap: () => void,
): Promise<void> {
  try {
    await transition.leave?.(context);
    swap();
  } finally {
    await transition.enter?.(context);
  }
}

/**
 * El id de sección al que apunta un enlace, o `null` si no es un salto interno.
 *
 * Devuelve `null` para todo lo que tenga que seguir siendo un click común: los
 * enlaces a otros sitios, los de descarga, los que abren en otra pestaña, y los
 * clicks con una tecla modificadora apretada —que son «abrir en pestaña nueva»,
 * y taparle la pantalla a alguien que quiso eso sería un error—.
 *
 * También devuelve `null` para `#` a secas, que en HTML significa «volver
 * arriba» y no una sección.
 */
export function sectionTarget(
  link: { href: string; target?: string; hasDownload?: boolean },
  modifiers: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
): string | null {
  if (modifiers.metaKey || modifiers.ctrlKey || modifiers.shiftKey || modifiers.altKey) return null;
  if (link.hasDownload) return null;
  if (link.target && link.target !== '' && link.target !== '_self') return null;

  const hash = link.href.startsWith('#') ? link.href : null;
  if (!hash || hash.length < 2) return null;

  return hash.slice(1);
}
