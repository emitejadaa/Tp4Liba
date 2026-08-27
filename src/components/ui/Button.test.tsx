import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('dispara el click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Inscribirse</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Inscribirse' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('no dispara el click cuando está deshabilitado', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Tirar
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tirar' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aplica los estilos de la variante secundaria', () => {
    render(<Button variant="secondary">Ver Cronograma</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-line-strong');
  });
});

describe('ButtonLink', () => {
  it('renderiza un link navegable', () => {
    render(<ButtonLink href="#cronograma">Ver Cronograma</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Ver Cronograma' })).toHaveAttribute(
      'href',
      '#cronograma',
    );
  });
});
