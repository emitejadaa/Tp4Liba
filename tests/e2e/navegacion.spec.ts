import { expect, test } from '@playwright/test';

test.describe('Navegación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('muestra el encabezado con el título del torneo', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bienvenidos a LIBA');
    await expect(page).toHaveTitle(/LIBA/);
  });

  test('lleva a cada sección desde el nav', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });

    for (const [label, id] of [
      ['Tabla', 'tabla'],
      ['Cronograma', 'cronograma'],
      ['Reglamento', 'reglamento'],
    ] as const) {
      await nav.getByRole('link', { name: label }).click();
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });

  test('marca en el nav la sección que se está viendo', async ({ page }) => {
    await page.locator('#reglamento').scrollIntoViewIfNeeded();
    // El scroll-spy usa IntersectionObserver, que resuelve en el próximo frame.
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Reglamento' }),
    ).toHaveAttribute('aria-current', 'true');
  });

  test('el botón secundario del encabezado baja al cronograma', async ({ page }) => {
    await page.getByRole('link', { name: 'Ver Cronograma' }).click();
    await expect(page.locator('#cronograma')).toBeInViewport();
  });

  test('renderiza todas las secciones del diseño', async ({ page }) => {
    for (const id of [
      'inicio',
      'torneo',
      'minijuego',
      'sponsors',
      'tabla',
      'cronograma',
      'reglamento',
      'cancha',
      'contacto',
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });
});
