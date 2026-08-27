import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Sponsors } from './Sponsors';
import { SPONSOR_COMPARISON, SPONSOR_TIERS } from '@/data/sponsors';

describe('Sponsors', () => {
  /**
   * El diseño resuelve esta sección de dos maneras según el ancho: tarjetas en
   * desktop y tabla comparativa en pantallas angostas. Como jsdom no aplica CSS,
   * las dos están en el DOM a la vez, así que las consultas se acotan a una.
   */
  const cards = () => within(screen.getByRole('list', { name: 'Planes de sponsoreo' }));

  it('muestra los tres planes con su resumen', () => {
    render(<Sponsors />);
    for (const tier of SPONSOR_TIERS) {
      expect(cards().getByRole('heading', { name: tier.name, level: 3 })).toBeInTheDocument();
      expect(cards().getByText(tier.summary)).toBeInTheDocument();
    }
  });

  it('destaca el plan Oro como recomendado', () => {
    render(<Sponsors />);
    expect(screen.getByText('Recomendado')).toBeInTheDocument();
  });

  it('lista los beneficios de cada plan', () => {
    render(<Sponsors />);
    for (const tier of SPONSOR_TIERS) {
      for (const perk of tier.perks) {
        expect(cards().getByText(perk)).toBeInTheDocument();
      }
    }
  });

  it('avisa qué plan se eligió al pedir ser sponsor', async () => {
    const onSponsor = vi.fn();
    render(<Sponsors onSponsor={onSponsor} />);

    const buttons = screen.getAllByRole('button', { name: 'Quiero ser sponsor' });
    await userEvent.click(buttons[0]!);
    expect(onSponsor).toHaveBeenCalledWith('bronce');
  });

  it('ofrece la tabla comparativa con una fila por beneficio', () => {
    render(<Sponsors />);
    const table = screen.getByRole('table', {
      name: 'Beneficios incluidos en cada plan de sponsoreo',
    });
    // Una fila de encabezado más una por beneficio.
    expect(within(table).getAllByRole('row')).toHaveLength(SPONSOR_COMPARISON.length + 1);
  });

  it('describe en texto si el beneficio está incluido', () => {
    render(<Sponsors />);
    const table = screen.getByRole('table', {
      name: 'Beneficios incluidos en cada plan de sponsoreo',
    });
    // «Logo en las 8 camisetas» sólo está en Oro: dos planes lo tienen excluido.
    const row = within(table).getByRole('row', { name: /Logo en las 8 camisetas/ });
    expect(within(row).getByText(/no incluido en Bronce/)).toBeInTheDocument();
    expect(within(row).getByText(/incluido en Oro/)).toBeInTheDocument();
  });
});
