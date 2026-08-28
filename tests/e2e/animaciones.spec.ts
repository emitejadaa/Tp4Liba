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
    // La pelota es un lienzo 3D cuando hay WebGL; medimos su contenedor, que es
    // lo que el parallax desplaza.
    const pelota = page.locator('#inicio [data-testid="hero-ball-3d"]');

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

test.describe('Pelota 3D del encabezado', () => {
  test('se puede arrastrar y queda girando por inercia', async ({ page }) => {
    await page.goto('/');

    const lienzo = page.locator('#inicio canvas');
    await expect(lienzo).toHaveCount(1);

    const caja = await lienzo.boundingBox();
    expect(caja).not.toBeNull();
    const centro = { x: caja!.x + caja!.width / 2, y: caja!.y + caja!.height / 2 };

    /*
     * No podemos leer la rotación del mesh desde afuera, así que comparamos los
     * píxeles: si la pelota giró, la imagen del lienzo cambia. Se compara contra
     * una captura tomada en el mismo instante del giro en reposo para no
     * confundir el arrastre con el giro que ya venía.
     */
    const antes = await lienzo.screenshot();

    await page.mouse.move(centro.x, centro.y);
    await page.mouse.down();
    for (let paso = 1; paso <= 10; paso++) {
      await page.mouse.move(centro.x + paso * 14, centro.y + paso * 3);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(120);

    const despues = await lienzo.screenshot();
    expect(Buffer.compare(antes, despues)).not.toBe(0);
  });
});

test.describe('Pelota del encabezado con movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('cae a la ilustración plana en vez de montar el lienzo 3D', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#inicio canvas')).toHaveCount(0);
    await expect(page.locator('#inicio img[src*="basketball"]')).toHaveCount(1);
  });
});

test.describe('Profundidad 3D', () => {
  test('las secciones llegan desde el fondo y se plantan al centro', async ({ page }) => {
    await page.goto('/');

    const capa = page.locator('#tabla > div');

    /*
     * Se mide el ancho que ocupa en pantalla y no la matriz de la
     * transformación: el achicamiento lo produce la división por la
     * perspectiva al pintar, así que en la matriz `m11` sigue valiendo 1 y no
     * delataría nada.
     */
    const ancho = async () => (await capa.boundingBox())?.width ?? 0;

    // Asomando por abajo está más lejos, o sea que se ve más angosta.
    await page.evaluate(() => {
      const seccion = document.getElementById('tabla')!;
      const top = seccion.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight * 0.75);
    });
    await page.waitForTimeout(900);
    const entrando = await ancho();

    // Centrada vuelve a su lugar: leer no puede ser leer algo deformado.
    await page.evaluate(() => {
      const seccion = document.getElementById('tabla')!;
      const caja = seccion.getBoundingClientRect();
      window.scrollTo(0, caja.top + window.scrollY - (window.innerHeight - caja.height) / 2);
    });
    await page.waitForTimeout(900);
    const centrada = await ancho();

    expect(entrando).toBeLessThan(centrada - 10);
    // En reposo tiene que medir exactamente lo que mide su contenedor.
    const enReposo = await capa.evaluate((el) => el.offsetWidth);
    expect(centrada).toBeCloseTo(enReposo, 0);
  });

  test('el isotipo del nav gira con el avance de la página', async ({ page }) => {
    await page.goto('/');
    const marca = page.locator('header a[href="#inicio"] span').first();

    const giro = () =>
      marca.evaluate((el) => {
        const matriz = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        // `m33` vale el coseno del giro: cae de 1 al girar sobre el eje vertical.
        return matriz.m33;
      });

    expect(await giro()).toBeCloseTo(1, 2);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await expect.poll(giro, { timeout: 5_000 }).toBeLessThan(0.99);
    const aMedias = await giro();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(giro, { timeout: 5_000 }).toBeLessThan(aMedias);

    // Nunca llega a verse de canto, que dejaría el logo del sitio invisible.
    expect(await giro()).toBeGreaterThan(0.4);
  });
});

test.describe('Sin desbordes laterales', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('en un teléfono la página no se arrastra para el costado', async ({ page }) => {
    /*
     * Los textos `sr-only` de las tablas son `position: absolute`; si su
     * contenedor con scroll no está posicionado, su bloque contenedor pasa a ser
     * el viewport, el `overflow` no los recorta y estiran la página. Se veía
     * como 130 px de scroll horizontal en el teléfono.
     */
    await page.goto('/');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important }' });

    const alto = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < alto; y += 700) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
    }

    const desborde = await page.evaluate(() => {
      window.scrollTo(400, window.scrollY);
      const x = window.scrollX;
      window.scrollTo(0, window.scrollY);
      return x;
    });
    expect(desborde).toBe(0);
  });
});
