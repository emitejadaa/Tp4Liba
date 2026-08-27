'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Mantiene el foco dentro de un contenedor mientras está activo.
 *
 * Al abrirse mueve el foco al elemento marcado con `data-autofocus` —el primer
 * campo del formulario, por ejemplo— o al contenedor mismo si no hay ninguno.
 * Arrancar en el contenedor y no en el primer control hace que el lector de
 * pantalla anuncie el diálogo antes de meterse en su contenido, y evita que el
 * foco caiga en el botón de cerrar sólo por estar primero en el DOM.
 *
 * Después cicla con Tab y Shift+Tab, y al cerrarse devuelve el foco a donde
 * estaba. Sin esto, tabular dentro de un diálogo termina paseando por la página
 * de atrás, que es justamente lo que el diálogo estaba tapando.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;

    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));

    const preferred = container.querySelector<HTMLElement>('[data-autofocus]');
    (preferred ?? container).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = focusables();
      if (elements.length === 0) return;

      const first = elements[0]!;
      const last = elements.at(-1)!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [ref, active]);
}
