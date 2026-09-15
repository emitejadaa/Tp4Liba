/**
 * Tipos del motor de scroll-craft, que es JavaScript sin tipar.
 *
 * Sólo se declara lo que la landing realmente usa: montar el motor sobre un
 * nodo y volver a medir cuando el layout cambió. El resto de lo que devuelve
 * `mount` —la lista de actos, los playheads de video— existe para el arnés de
 * verificación del proyecto original, no para la página.
 */
declare global {
  interface ScrollCraftInstance {
    /** Vuelve a medir todo: alturas de acto, splits de texto, ventanas de cue. */
    layout(): void;
    /** Recalcula el progreso y reescribe los estilos, sin volver a medir. */
    read(): void;
  }

  interface ScrollCraftStatic {
    mount(root?: Element | Document | string, opts?: { lerp?: number }): ScrollCraftInstance;
    /** `true` si el sistema pidió reducir el movimiento al cargar la página. */
    reduce: boolean;
    instances: ScrollCraftInstance[];
  }

  interface Window {
    ScrollCraft?: ScrollCraftStatic;
  }
}

export {};
