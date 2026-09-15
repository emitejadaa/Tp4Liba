'use client';

import { useEffect } from 'react';

/**
 * Monta el motor de scroll-craft sobre la página, una sola vez.
 *
 * El motor es JavaScript de navegador: lee `matchMedia` apenas se evalúa y
 * cuelga `window.ScrollCraft`. Por eso se importa dinámicamente dentro del
 * efecto y no arriba del archivo, que lo haría correr también en el prerender.
 *
 * No renderiza nada. Lo que hace es leer los atributos `data-sc-*` que ya están
 * en el HTML —los planos de profundidad, el tinte de fondo de cada sección, la
 * barra de progreso— y manejarlos desde un único bucle de animación. Es el
 * motivo por el que se puede tener movimiento en toda la página sin que React se
 * entere: el motor escribe estilos, no estado.
 */

/**
 * El motor no tiene desmontaje: engancha su bucle y sus listeners al `window` y
 * vive lo que vive la pestaña. Con el modo estricto de React el efecto corre dos
 * veces en desarrollo, así que hace falta esta bandera para no terminar con dos
 * bucles escribiendo los mismos estilos.
 */
let mounted = false;

export function ScrollCraftRoot() {
  useEffect(() => {
    if (mounted) return;
    mounted = true;

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let frame: number | null = null;

    void import('@/vendor/scrollcraft/scrollcraft.js')
      .then(() => {
        if (cancelled || !window.ScrollCraft) return;
        const engine = window.ScrollCraft.mount(document);

        /*
         * El motor mide las secciones al montar y vuelve a medir ante `resize`.
         * Acá adentro hay cosas que cambian el alto sin que la ventana cambie:
         * el acordeón del reglamento, los boxscores del cronograma, el mapa de
         * la cancha. Si no se vuelve a medir, todo lo que está más abajo calcula
         * su avance contra una posición vieja y los planos quedan corridos.
         *
         * Se remide en el cuadro siguiente y no en el mismo: el observador se
         * dispara durante el layout, y medir ahí obliga al navegador a
         * recalcularlo entero en el medio.
         */
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
              frame = null;
              engine.layout();
            });
          });
          observer.observe(document.body);
        }
      })
      .catch(() => {
        // Si el motor no baja, la página se queda con las animaciones de Motion
        // y los planos decorativos quietos. Nada de lo que se lee depende de él.
        mounted = false;
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
