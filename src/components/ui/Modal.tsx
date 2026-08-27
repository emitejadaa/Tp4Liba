'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Diálogo modal accesible.
 *
 * Se monta en un portal sobre `body` para que ningún `overflow` o `transform`
 * de la página lo recorte, atrapa el foco, cierra con Escape o con click en el
 * fondo, y bloquea el scroll de atrás mientras está abierto.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const prefersReduced = useReducedMotion();

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // Bloquear el scroll del fondo evita que la página de atrás se mueva
    // mientras se lee el diálogo.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  // El portal necesita el DOM, que no existe durante el render del servidor.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={prefersReduced ? undefined : { opacity: 0 }}
            animate={prefersReduced ? undefined : { opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            // El fondo es decorativo: cerrar con Escape cubre el teclado.
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            // El contenedor recibe el foco cuando el contenido no marca un
            // punto de entrada propio con `data-autofocus`.
            tabIndex={-1}
            className="bg-ink-raised border-line-card relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border p-7 shadow-2xl"
            initial={prefersReduced ? undefined : { opacity: 0, y: 24, scale: 0.97 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-[32px] leading-none font-bold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar el diálogo"
                className="text-muted hover:text-orange -mt-1 -mr-1 p-2 text-xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
