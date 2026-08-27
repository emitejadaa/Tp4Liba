import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

const open = (props: Partial<Parameters<typeof Modal>[0]> = {}) =>
  render(
    <Modal open onClose={vi.fn()} title="Inscribí tu equipo" {...props}>
      <button type="button">Primero</button>
      <button type="button">Último</button>
    </Modal>,
  );

describe('Modal', () => {
  it('no renderiza nada cerrado', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Inscribí tu equipo">
        <p>contenido</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('se anuncia como diálogo modal con su título', () => {
    open();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Inscribí tu equipo' })).toBeInTheDocument();
  });

  it('cierra con Escape', async () => {
    const onClose = vi.fn();
    open({ onClose });

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cierra con el botón de cerrar', async () => {
    const onClose = vi.fn();
    open({ onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el diálogo' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('pone el foco en el diálogo al abrirse, no en el botón de cerrar', () => {
    open();
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('respeta el punto de entrada que marca el contenido', () => {
    render(
      <Modal open onClose={vi.fn()} title="Inscribí tu equipo">
        <button type="button">Sin marcar</button>
        <button type="button" data-autofocus>
          Marcado
        </button>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Marcado' })).toHaveFocus();
  });

  it('cicla el foco con Tab sin salirse del diálogo', async () => {
    open();
    // Del último elemento, Tab vuelve al primero en vez de irse a la página.
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el diálogo' }));
    screen.getByRole('button', { name: 'Cerrar el diálogo' }).focus();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
  });

  it('bloquea el scroll del fondo mientras está abierto', () => {
    const { unmount } = open();
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
