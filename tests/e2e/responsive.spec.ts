import { expect, test, type Page } from '@playwright/test';

/**
 * La landing en todos los tamaños.
 *
 * No hay un «diseño mobile» y un «diseño desktop»: hay una página que tiene que
 * funcionar en un teléfono plegado, en un teléfono apaisado —que es corto, no
 * angosto, y es el caso que siempre se olvida—, en una tablet y en un monitor
 * ancho. Lo que se verifica acá son las tres cosas que se rompen de verdad:
 * que la página no se arrastre para el costado, que lo que se toca entre en un
 * dedo, y que lo importante del encabezado se vea sin scrollear.
 */
const PANTALLAS = [
  { nombre: 'teléfono plegado', width: 320, height: 653 },
  { nombre: 'teléfono chico', width: 375, height: 667 },
  { nombre: 'teléfono', width: 390, height: 844 },
  { nombre: 'teléfono apaisado', width: 844, height: 390 },
  { nombre: 'tablet', width: 768, height: 1024 },
  { nombre: 'tablet grande', width: 1024, height: 1366 },
  { nombre: 'notebook', width: 1280, height: 800 },
  { nombre: 'pantalla ancha', width: 1920, height: 1080 },
] as const;

/** Recorre la página entera, que es cuando aparece lo que desborda. */
async function recorrer(page: Page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const paso = Math.max(page.viewportSize()!.height - 80, 200);
  for (let y = 0; y < alto; y += paso) {
    await page.evaluate((hasta) => window.scrollTo({ top: hasta, behavior: 'instant' }), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

for (const pantalla of PANTALLAS) {
  test.describe(`En ${pantalla.nombre} (${pantalla.width}×${pantalla.height})`, () => {
    test.use({ viewport: { width: pantalla.width, height: pantalla.height } });

    test('la página no se arrastra para el costado', async ({ page }) => {
      await page.goto('/');
      await recorrer(page);

      const desborde = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(
          doc.scrollWidth - doc.clientWidth,
          document.body.scrollWidth - doc.clientWidth,
        );
      });
      expect(desborde).toBeLessThanOrEqual(1);
    });

    test('lo que se toca entra en un dedo', async ({ page }) => {
      await page.goto('/');
      await recorrer(page);

      /*
       * El piso son los 24×24 px del criterio 2.5.8 de las WCAG 2.2. No se mide
       * el texto renderizado sino la caja del control, que es lo que recibe el
       * toque: un botón de 16 px de alto se acierta de casualidad.
       *
       * Los controles adentro de una zona con scroll horizontal —la tabla
       * comparativa de sponsors— pueden quedar fuera de pantalla, pero su caja
       * se mide igual.
       */
      const chicos = await page.evaluate(() => {
        const problemas: string[] = [];
        for (const control of document.querySelectorAll('a[href], button')) {
          const caja = control.getBoundingClientRect();
          if (caja.width === 0 || caja.height === 0) continue;
          if (caja.width < 24 || caja.height < 24) {
            const texto = (control.textContent ?? '').trim().slice(0, 30);
            problemas.push(
              `${control.tagName} «${texto}» ${Math.round(caja.width)}×${Math.round(caja.height)}`,
            );
          }
        }
        return problemas;
      });

      expect(chicos).toEqual([]);
    });

    test('las tablas entran enteras, sin arrastrarlas para el costado', async ({ page }) => {
      test.skip(
        pantalla.width < 360,
        'en un teléfono plegado las tablas sí se arrastran: no hay ancho para las dos de sponsors y las tres columnas de la tabla',
      );
      await page.goto('/');
      await recorrer(page);

      /*
       * Una tabla con scroll propio no avisa que lo tiene: con el ancho de
       * escritorio, un teléfono mostraba el puesto y el nombre del equipo y
       * ningún número, que es a lo que se viene a la sección. Se busca por el
       * estilo calculado y no por la clase de Tailwind, para que el test siga
       * valiendo si la clase cambia de nombre.
       */
      const arrastradas = await page.evaluate(() => {
        const problemas: string[] = [];
        for (const caja of document.querySelectorAll('main *')) {
          const overflow = getComputedStyle(caja).overflowX;
          if (overflow !== 'auto' && overflow !== 'scroll') continue;
          const sobra = caja.scrollWidth - caja.clientWidth;
          if (sobra > 1)
            problemas.push(
              `${caja.querySelector('caption')?.textContent?.slice(0, 40) ?? caja.className} sobra ${sobra}px`,
            );
        }
        return problemas;
      });

      expect(arrastradas).toEqual([]);
    });

    test('el encabezado se lee entero sin scrollear', async ({ page }) => {
      await page.goto('/');

      // El título y la acción principal son lo que la página vino a decir: si
      // hay que scrollear para encontrarlos, el encabezado no está haciendo su
      // trabajo. Es el caso que se rompe en un teléfono apaisado.
      // `ratio: 1` y no «se ve un pedacito»: un botón cortado por el borde de
      // abajo cuenta como visible y no lo es.
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport({ ratio: 1 });
      await expect(
        page.locator('#inicio').getByRole('button', { name: 'Inscribirse' }),
      ).toBeInViewport({ ratio: 1 });
    });
  });
}
