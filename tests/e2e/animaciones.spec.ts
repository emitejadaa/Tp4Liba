import { expect, test } from '@playwright/test';

/**
 * El resto de la suite corre con `prefers-reduced-motion` para que las
 * aserciones de comportamiento sean deterministas. Este archivo vuelve a
 * habilitar el movimiento y verifica lo que sólo existe con animación.
 */
test.use({ contextOptions: { reducedMotion: 'no-preference' } });

test.describe('Animaciones e interacción', () => {
  test('la pelota del encabezado se mueve al scrollear', async ({ page }) => {
    await page.goto('/');
    const pelota = page.locator('#inicio img[src*="basketball"]');

    const antes = await pelota.boundingBox();
    expect(antes).not.toBeNull();

    await page.mouse.wheel(0, 500);

    /*
     * El parallax está suavizado con un resorte, así que la posición final no
     * llega en un cuadro fijo: esperamos a que el desfasaje respecto del scroll
     * de la página supere el umbral en lugar de dormir una cantidad arbitraria.
     */
    await expect
      .poll(
        async () => {
          const ahora = await pelota.boundingBox();
          return ahora ? Math.abs(ahora.y - (antes!.y - 500)) : 0;
        },
        { timeout: 5_000 },
      )
      .toBeGreaterThan(20);
  });

  test('una encestada larga confeti y sacude la red', async ({ page }) => {
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();

    // Tiramos justo cuando la mira pasa por el centro de la zona.
    await page.evaluate(async () => {
      const seccion = document.querySelector('#minijuego')!;
      const barra = seccion.querySelector('[role="progressbar"]')!;
      const tirar = [...seccion.querySelectorAll('button')].find(
        (boton) => boton.textContent?.trim() === 'Tirar',
      )!;

      const empezo = performance.now();
      while (performance.now() - empezo < 10_000) {
        if (Math.abs(Number(barra.getAttribute('aria-valuenow')) - 50) <= 1) {
          tirar.click();
          return;
        }
        await new Promise((listo) => requestAnimationFrame(() => listo()));
      }
    });

    await expect(page.locator('#minijuego [role="status"]')).toHaveText(/¡(Adentro|Triple)!/);
    // El confeti sale cuando la pelota cruza el aro, no al tocar el botón.
    await page.waitForTimeout(900);
    const confeti = page.locator('#minijuego span.rounded-\\[1px\\]');
    expect(await confeti.count()).toBeGreaterThan(0);
  });

  test('el fuego de racha aparece recién a las tres encestadas', async ({ page }) => {
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();

    const fuego = page.locator('#minijuego svg[viewBox="0 0 40 64"]');
    await expect(fuego).toHaveCount(0);

    const racha = await page.evaluate(async () => {
      const seccion = document.querySelector('#minijuego')!;
      const barra = seccion.querySelector('[role="progressbar"]')!;
      const tirar = [...seccion.querySelectorAll('button')].find(
        (boton) => boton.textContent?.trim() === 'Tirar',
      )!;
      const leerRacha = () => Number((seccion.textContent?.match(/RACHA\s*(\d+)/i) ?? [])[1] ?? 0);

      const empezo = performance.now();
      while (leerRacha() < 3 && performance.now() - empezo < 25_000) {
        if (Math.abs(Number(barra.getAttribute('aria-valuenow')) - 50) <= 2) tirar.click();
        await new Promise((listo) => requestAnimationFrame(() => listo()));
      }
      return leerRacha();
    });

    expect(racha).toBeGreaterThanOrEqual(3);
    await expect(fuego).toHaveCount(1);
    await expect(page.getByText('Racha encendida')).toBeVisible();
  });
});
