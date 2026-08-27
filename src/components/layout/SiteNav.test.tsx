import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SiteNav } from './SiteNav';
import { NAV_LINKS } from '@/data/navigation';

describe('SiteNav', () => {
  it('muestra un link por cada sección del nav', () => {
    render(<SiteNav />);
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });

    for (const link of NAV_LINKS) {
      // El link aparece dos veces: en la barra de desktop y en el panel mobile.
      const matches = screen.getAllByRole('link', { name: link.label });
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toHaveAttribute('href', `#${link.id}`);
    }
    expect(nav).toBeInTheDocument();
  });

  it('avisa al abrir y cerrar el menú mobile', async () => {
    render(<SiteNav />);
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('dispara la inscripción desde el CTA', async () => {
    const onRegister = vi.fn();
    render(<SiteNav onRegister={onRegister} />);

    const [cta] = screen.getAllByRole('button', { name: 'Inscribirse' });
    await userEvent.click(cta!);
    expect(onRegister).toHaveBeenCalledOnce();
  });

  it('marca el logo como acceso al inicio', () => {
    render(<SiteNav />);
    expect(screen.getByRole('link', { name: 'LIBA, ir al inicio' })).toHaveAttribute(
      'href',
      '#inicio',
    );
  });
});
