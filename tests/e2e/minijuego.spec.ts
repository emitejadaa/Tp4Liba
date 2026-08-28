import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Con `prefers-reduced-motion` la mira no se desliza: avanza a pasos con un
 * intervalo. Eso la vuelve completamente determinista bajo `page.clock`, que sí
 * controla los temporizadores —a diferencia de `requestAnimationFrame`, donde
 * la posición dependía de cuántos cuadros alcanzara a dibujar la máquina.
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

  test('sin avanzar el reloj la mira sigue en el centro y el tiro es triple', async ({ page }) => {
    await page.getByRole('button', { name: 'Tirar' }).click();

    await expect(stat(page, 'Tiros')).toHaveText('1');
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(stat(page, 'Racha')).toHaveText('1');
    await expect(page.locator('#minijuego [role="status"]')).toHaveText('¡Triple! +3');
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
    // Dos pasos de la mira la dejan lejos del centro.
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
