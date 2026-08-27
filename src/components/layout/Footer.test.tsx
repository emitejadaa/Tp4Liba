import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';
import { SITE } from '@/lib/site';

describe('Footer', () => {
  it('muestra el aviso de copyright del diseño', () => {
    render(<Footer />);
    expect(
      screen.getByText(`© ${SITE.season} ${SITE.name} · ${SITE.tagline} · ${SITE.city}`),
    ).toBeInTheDocument();
  });

  it('vuelve al inicio con scroll suave', async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);

    render(<Footer />);
    await userEvent.click(screen.getByRole('button', { name: 'Volver al inicio de la página' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    vi.unstubAllGlobals();
  });
});
