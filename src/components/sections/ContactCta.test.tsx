import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactCta } from './ContactCta';
import { SITE } from '@/lib/site';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactCta', () => {
  it('muestra el título y el mail de contacto', () => {
    render(<ContactCta />);
    expect(screen.getByRole('heading', { name: '¿Armás tu equipo?' })).toBeInTheDocument();
    expect(screen.getByText(SITE.email)).toBeInTheDocument();
  });

  it('copia el mail al portapapeles y lo anuncia', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ContactCta />);
    await userEvent.click(screen.getByRole('button', { name: /Copiar el mail de contacto/ }));

    expect(writeText).toHaveBeenCalledWith(SITE.email);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Mail copiado'));
  });

  it('no rompe si el navegador niega el portapapeles', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denegado')) },
    });

    render(<ContactCta />);
    const button = screen.getByRole('button', { name: /Copiar el mail de contacto/ });

    await userEvent.click(button);
    expect(screen.getByRole('status')).toHaveTextContent('');
    // El mail sigue a la vista para copiarlo a mano.
    expect(screen.getByText(SITE.email)).toBeInTheDocument();
  });

  it('ofrece los tres contactos con nombre accesible', () => {
    render(<ContactCta />);
    for (const label of ['Instagram', 'WhatsApp', 'Mail']) {
      expect(screen.getByRole('link', { name: `${label} de ${SITE.name}` })).toBeInTheDocument();
    }
  });

  it('apunta el ícono de mail al contacto de la liga', () => {
    render(<ContactCta />);
    expect(screen.getByRole('link', { name: `Mail de ${SITE.name}` })).toHaveAttribute(
      'href',
      `mailto:${SITE.email}`,
    );
  });
});
