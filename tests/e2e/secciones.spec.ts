import { expect, test } from '@playwright/test';

test.describe('Reglamento', () => {
  test('abre y cierra una regla', async ({ page }) => {
    await page.goto('/');
    const boton = page.getByRole('button', { name: /Código de conducta/ });

    await expect(boton).toHaveAttribute('aria-expanded', 'false');
    await boton.click();
    await expect(boton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/La decisión del árbitro es final/)).toBeVisible();

    await boton.click();
    await expect(boton).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Tabla de posiciones', () => {
  test('reordena al tocar una columna', async ({ page }) => {
    await page.goto('/');
    const equipos = page.locator('#tabla tbody th');

    await expect(equipos.first()).toHaveText('Los Halcones');

    await page.getByRole('button', { name: /Ordenar por Puntos/ }).click();
    await expect(equipos.first()).toHaveText('Rebote Club');
  });
});

test.describe('Cronograma', () => {
  test('despliega el boxscore de un cruce', async ({ page }) => {
    await page.goto('/');
    const boton = page.getByRole('button', { name: /Ver boxscore/ }).first();

    await boton.click();
    await expect(boton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/Se cargan al terminar el partido/).first()).toBeVisible();
  });
});

test.describe('Dónde jugamos', () => {
  test('no carga el mapa de Google hasta que se lo pide', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#cancha iframe')).toHaveCount(0);

    await page.getByRole('button', { name: /Tocá para cargar el mapa/ }).click();
    await expect(page.locator('#cancha iframe')).toHaveCount(1);
  });
});
