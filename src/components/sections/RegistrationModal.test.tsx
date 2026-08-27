import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegistrationModal } from './RegistrationModal';
import { SITE } from '@/lib/site';

const fill = async (values: { name?: string; email?: string; organization?: string }) => {
  if (values.name !== undefined) {
    await userEvent.type(screen.getByLabelText('Tu nombre'), values.name);
  }
  if (values.email !== undefined) {
    await userEvent.type(screen.getByLabelText('Mail'), values.email);
  }
  if (values.organization !== undefined) {
    await userEvent.type(screen.getByLabelText(/Nombre del/), values.organization);
  }
};

describe('RegistrationModal', () => {
  it('usa el título y la etiqueta de equipo', () => {
    render(<RegistrationModal open kind="equipo" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Inscribí tu equipo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del equipo')).toBeInTheDocument();
  });

  it('cambia los textos para sponsors y muestra el plan elegido', () => {
    render(<RegistrationModal open kind="sponsor" tier="oro" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Quiero ser sponsor' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la marca')).toBeInTheDocument();
    expect(screen.getByText('oro')).toBeInTheDocument();
  });

  it('arranca con el foco en el primer campo', () => {
    render(<RegistrationModal open kind="equipo" onClose={vi.fn()} />);
    expect(screen.getByLabelText('Tu nombre')).toHaveFocus();
  });

  it('muestra los errores al enviar vacío y no confirma', async () => {
    render(<RegistrationModal open kind="equipo" onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByText('Escribí tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Necesitamos un mail para contestarte.')).toBeInTheDocument();
    expect(screen.getByText('Poné el nombre del equipo.')).toBeInTheDocument();
    expect(screen.queryByText(/Anotamos a/)).not.toBeInTheDocument();
  });

  it('marca el campo inválido con aria-invalid', async () => {
    render(<RegistrationModal open kind="equipo" onClose={vi.fn()} />);
    await fill({ email: 'no-es-un-mail' });
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByLabelText('Mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('limpia el error del campo apenas se corrige', async () => {
    render(<RegistrationModal open kind="equipo" onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('Escribí tu nombre.')).toBeInTheDocument();

    await fill({ name: 'Emiliano' });
    expect(screen.queryByText('Escribí tu nombre.')).not.toBeInTheDocument();
  });

  it('confirma con los datos cargados y aclara que no hay envío automático', async () => {
    render(<RegistrationModal open kind="equipo" onClose={vi.fn()} />);
    await fill({ name: 'Emiliano', email: 'emi@liba.com.ar', organization: 'Los Halcones' });
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByText(/Anotamos a/)).toBeInTheDocument();
    expect(screen.getByText('Los Halcones')).toBeInTheDocument();
    expect(screen.getByText(/no envía nada por su cuenta/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: SITE.email })).toHaveAttribute(
      'href',
      `mailto:${SITE.email}`,
    );
  });

  it('cierra desde la confirmación', async () => {
    const onClose = vi.fn();
    render(<RegistrationModal open kind="equipo" onClose={onClose} />);
    await fill({ name: 'Emiliano', email: 'emi@liba.com.ar', organization: 'Los Halcones' });
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
