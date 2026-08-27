import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * La mira del minijuego se mueve con `requestAnimationFrame`, así que sin
 * controlar el tiempo cada corrida daría un resultado distinto. `page.clock`
 * congela el reloj: la mira queda quieta donde está y los tiros son
 * reproducibles.
 */
test.describe('Minijuego «Tirá al aro»', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();
  });

  const stat = (page: Page, label: string) =>
    page.locator('#minijuego dl div').filter({ hasText: label }).locator('dd');

  test('arranca en cero y esperando', async ({ page }) => {
    await expect(stat(page, 'Encestadas')).toHaveText('0');
    await expect(stat(page, 'Tiros')).toHaveText('0');
    await expect(page.locator('#minijuego [role="status"]')).toHaveText('Esperá la zona naranja');
  });

  test('con el reloj congelado la mira queda en la zona y el tiro entra', async ({ page }) => {
    await page.getByRole('button', { name: 'Tirar' }).click();

    await expect(stat(page, 'Tiros')).toHaveText('1');
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(stat(page, 'Racha')).toHaveText('1');
    // Que sea doble o triple depende de dónde exactamente quedó la mira dentro
    // de la zona, y eso no es lo que este test verifica.
    await expect(page.locator('#minijuego [role="status"]')).toHaveText(/¡(Adentro|Triple)!/);
  });

  test('cuenta cada tiro y el récord sobrevive a recargar la página', async ({ page }) => {
    const tirar = page.getByRole('button', { name: 'Tirar' });

    await tirar.click();
    await tirar.click();
    await tirar.click();

    await expect(stat(page, 'Tiros')).toHaveText('3');
    await expect(page.getByText('Mejor racha:')).toBeVisible();

    // Lo que importa no es el contenido de localStorage sino que el récord
    // siga estando en la próxima visita.
    await page.reload();
    await page.locator('#minijuego').scrollIntoViewIfNeeded();
    await expect(page.locator('#minijuego').getByText('Mejor racha:')).toBeVisible();
    await expect(stat(page, 'Tiros')).toHaveText('0');
  });

  test('falla cuando la mira quedó fuera de la zona', async ({ page }) => {
    // Adelantamos el reloj para que la mira se corra del centro.
    await page.clock.runFor(700);
    await page.getByRole('button', { name: 'Tirar' }).click();

    await expect(stat(page, 'Tiros')).toHaveText('1');
    await expect(stat(page, 'Encestadas')).toHaveText('0');
    await expect(stat(page, 'Racha')).toHaveText('0');
  });

  test('describe la posición de la mira para lectores de pantalla', async ({ page }) => {
    const barra = page.getByRole('progressbar', { name: 'Puntería' });
    await expect(barra).toHaveAttribute('aria-valuetext', /La mira está/);
  });
});
