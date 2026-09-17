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
    // Se mide el contenedor de la pelota, que es lo que el parallax desplaza.
    const pelota = page.locator('#inicio [data-testid="hero-ball"]');

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

  test('el fuego de racha aparece recién a las tres encestadas', async ({ page }) => {
    /*
     * El tiro con el que arranca el juego entra, así que tres veces «Tirar»
     * alcanzan para prender el fuego. El botón se apaga mientras la pelota está
     * en el aire, y esperar a que vuelva es exactamente esperar a que el tiro se
     * resuelva: no hace falta ningún tiempo fijo, que en una máquina lenta sería
     * un test que falla solo.
     */
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();

    const fuego = page.locator('#minijuego svg[viewBox="0 0 40 64"]');
    await expect(fuego).toHaveCount(0);

    const tirar = page.getByRole('button', { name: 'Tirar' });
    const racha = page.locator('#minijuego dl div').filter({ hasText: 'Racha' }).locator('dd');

    for (let tiro = 1; tiro <= 3; tiro += 1) {
      await tirar.click();
      await expect(tirar).toBeEnabled();
      await expect(racha).toHaveText(String(tiro));
    }

    await expect(fuego).toHaveCount(1);
    await expect(page.getByText('Racha encendida')).toBeVisible();
  });
});

test.describe('Pelota del encabezado', () => {
  test('gira sola, sin que nadie la toque', async ({ page }) => {
    await page.goto('/');

    // Las costuras se recalculan cuadro a cuadro desde la geometría de la
    // esfera, así que el trazado cambia justamente porque la pelota está girando.
    const costura = page.locator('#inicio [data-seam]').first();
    const trazado = () => costura.getAttribute('d');

    const antes = await trazado();
    expect(antes).toBeTruthy();
    await expect.poll(trazado, { timeout: 5_000 }).not.toBe(antes);
  });

  test('es un dibujo vectorial y no un lienzo rasterizado', async ({ page }) => {
    await page.goto('/');

    // Un lienzo llega a pantalla ya rasterizado y se ve lavado en el borde; las
    // cuatro costuras son trazos, y se ven nítidas a cualquier tamaño.
    await expect(page.locator('#inicio canvas')).toHaveCount(0);
    await expect(page.locator('#inicio [data-testid="hero-ball"] svg')).toHaveCount(1);
    await expect(page.locator('#inicio [data-seam]')).toHaveCount(4);
  });

  test('no se agranda al scrollear ni se sale de su sección', async ({ page }) => {
    /*
     * Es el defecto que la hizo rehacer: crecía a 1,35 y bajaba 220 px, así que
     * a media pantalla de scroll la sección la cortaba al ras por el borde de
     * abajo y el resto quedaba atrás del nav.
     */
    await page.goto('/');
    const pelota = page.locator('#inicio [data-testid="hero-ball"]');
    const inicio = page.locator('#inicio');

    // La pelota entra creciendo de 0,85 a 1: hay que dejarla llegar antes de
    // tomarle la medida, o lo que se compara es contra un cuadro de la entrada.
    await page.waitForTimeout(1_200);
    const anchoInicial = (await pelota.boundingBox())!.width;

    await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'instant' }));
    await page.waitForTimeout(900);

    const caja = (await pelota.boundingBox())!;
    const seccion = (await inicio.boundingBox())!;

    expect(caja.width).toBeCloseTo(anchoInicial, 0);
    expect(caja.y + caja.height).toBeLessThanOrEqual(seccion.y + seccion.height + 1);
  });
});

test.describe('Pelota del encabezado con movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('se dibuja igual, pero se queda quieta', async ({ page }) => {
    await page.goto('/');

    // No es que desaparezca: el mismo dibujo, sin bucle de animación detrás.
    const costura = page.locator('#inicio [data-seam]').first();
    await expect(page.locator('#inicio [data-seam]')).toHaveCount(4);

    const antes = await costura.getAttribute('d');
    expect(antes).toBeTruthy();
    await page.waitForTimeout(900);
    expect(await costura.getAttribute('d')).toBe(antes);
  });
});

test.describe('Profundidad 3D', () => {
  test('las secciones llegan desde el fondo y se plantan al centro', async ({ page }) => {
    await page.goto('/');

    const capa = page.locator('#tabla [data-depth-layer]');

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
    await page.waitForTimeout(1_400);
    const centrada = await ancho();

    expect(entrando).toBeLessThan(centrada - 10);
    // En reposo tiene que medir lo que mide su contenedor. La tolerancia es de
    // un par de píxeles porque la caja la reporta el compositor después de una
    // transformación 3D, no el layout, y ahí el subpíxel es inevitable.
    const enReposo = await capa.evaluate((el) => el.offsetWidth);
    expect(Math.abs(centrada - enReposo)).toBeLessThan(2);
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

test.describe('Planos de profundidad', () => {
  test('el fondo de cada sección se mueve a distinta velocidad que el contenido', async ({
    page,
  }) => {
    await page.goto('/');

    /*
     * Los tres planos decorativos los mueve el motor de scroll-craft leyendo el
     * avance de la sección. Lo que arma la perspectiva no es que se muevan, sino
     * que se muevan **distinto**: si los tres viajaran lo mismo serían un fondo
     * pegado, no tres planos a distinta distancia.
     */
    const desplazamientos = async () =>
      page.evaluate(() => {
        const seccion = document.getElementById('torneo')!;
        return [...seccion.querySelectorAll('[data-sc-parallax]')].map(
          (plano) => new DOMMatrixReadOnly(getComputedStyle(plano).transform).m42,
        );
      });

    const irA = (fraccion: number) =>
      page.evaluate((f) => {
        const seccion = document.getElementById('torneo')!;
        const top = seccion.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top - window.innerHeight * f, behavior: 'instant' });
      }, fraccion);

    await irA(0.8);
    await page.waitForTimeout(400);
    const arriba = await desplazamientos();

    await irA(0.1);
    await page.waitForTimeout(400);
    const abajo = await desplazamientos();

    expect(arriba).toHaveLength(3);
    const recorridos = arriba.map((valor, indice) => abajo[indice]! - valor);

    // Ninguno se queda quieto...
    for (const recorrido of recorridos) expect(Math.abs(recorrido)).toBeGreaterThan(5);
    // ...y el de adelante viaja para el otro lado que los del fondo.
    expect(Math.sign(recorridos[0]!)).not.toBe(Math.sign(recorridos[2]!));
  });

  test('el fondo de la página cambia de tono a lo largo del recorrido', async ({ page }) => {
    await page.goto('/');

    const fondo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.waitForTimeout(400);
    const enElInicio = await fondo();

    await page.evaluate(() => {
      const seccion = document.getElementById('cancha')!;
      window.scrollTo({
        top: seccion.getBoundingClientRect().top + window.scrollY,
        behavior: 'instant',
      });
    });
    await page.waitForTimeout(500);

    expect(await fondo()).not.toBe(enElInicio);
  });
});

test.describe('Pase entre secciones', () => {
  test('el salto del nav pasa tapado por la solapa y termina en la sección', async ({ page }) => {
    await page.goto('/');

    /*
     * La solapa dura menos de un segundo, así que en vez de espiarla desde
     * afuera —donde cada consulta es un viaje de ida y vuelta— se mide desde
     * adentro de la página: un bucle de cuadros anota cuánto llegó a tapar.
     *
     * `m33` es el coseno del giro sobre el eje horizontal: vale 1 con la solapa
     * plana contra la pantalla y casi 0 cuando está de canto. Multiplicado por
     * la opacidad, un valor cerca de 1 significa «tapó de verdad».
     */
    await page.evaluate(() => {
      const solapa = document.querySelector('[data-testid="section-flap"]')!;
      const ventana = window as unknown as { __cobertura: number };
      ventana.__cobertura = 0;
      const mirar = () => {
        const estilo = getComputedStyle(solapa);
        const giro = new DOMMatrixReadOnly(estilo.transform).m33;
        ventana.__cobertura = Math.max(ventana.__cobertura, Number(estilo.opacity) * giro);
        requestAnimationFrame(mirar);
      };
      mirar();
    });

    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Reglamento' })
      .click();

    await expect(page.locator('#reglamento')).toBeInViewport();
    expect(page.url()).toContain('#reglamento');

    const cobertura = await page.evaluate(
      () => (window as unknown as { __cobertura: number }).__cobertura,
    );
    expect(cobertura).toBeGreaterThan(0.9);
  });

  test('con movimiento reducido el salto es el de siempre, sin solapa', async ({ browser }) => {
    const contexto = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await contexto.newPage();
    await page.goto('/');

    await expect(page.locator('[data-testid="section-flap"]')).toHaveCount(0);
    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Tabla' })
      .click();
    await expect(page.locator('#tabla')).toBeInViewport();

    await contexto.close();
  });
});

test.describe('Las secciones se presentan', () => {
  test('el contenido no sube exactamente lo que sube el scroll', async ({ page }) => {
    /*
     * Un documento plano es justo eso: todo se desplaza 1:1 con la rueda. Acá la
     * sección se queda atrás al entrar y se adelanta al salir, y ese desfasaje es
     * lo que hace leer que el contenido se mueve en vez de que se mueva la vista.
     */
    await page.goto('/');
    // El avance de cada sección lo publica el motor de scroll-craft: hasta que
    // no montó, la cámara de profundidad no tiene de dónde leer.
    await page.locator('html.sc-ready').waitFor();
    const capa = page.locator('#reglamento [data-depth-layer]');

    await page.evaluate(() => {
      const seccion = document.getElementById('reglamento')!;
      const top = seccion.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - window.innerHeight * 0.9, behavior: 'instant' });
    });
    await page.waitForTimeout(1_200);
    const antes = (await capa.boundingBox())!.y;

    const paso = 260;
    await page.evaluate((px) => window.scrollBy({ top: px, behavior: 'instant' }), paso);
    await page.waitForTimeout(1_200);
    const despues = (await capa.boundingBox())!.y;

    const recorrido = antes - despues;
    expect(Math.abs(recorrido - paso)).toBeGreaterThan(12);
  });

  test('con movimiento reducido no se mueve nada de eso', async ({ browser }) => {
    const contexto = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await contexto.newPage();
    await page.goto('/');

    const capa = page.locator('#reglamento [data-depth-layer]');
    await page.evaluate(() => {
      const seccion = document.getElementById('reglamento')!;
      const top = seccion.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - window.innerHeight * 0.9, behavior: 'instant' });
    });
    await page.waitForTimeout(400);
    const antes = (await capa.boundingBox())!.y;

    const paso = 260;
    await page.evaluate((px) => window.scrollBy({ top: px, behavior: 'instant' }), paso);
    await page.waitForTimeout(400);
    const despues = (await capa.boundingBox())!.y;

    expect(antes - despues).toBeCloseTo(paso, 0);

    await contexto.close();
  });
});

test.describe('Sin el motor de scroll', () => {
  test.use({ javaScriptEnabled: false });

  test('la página sigue completa y nada queda recortado', async ({ page }) => {
    /*
     * Sin JavaScript no hay motor de scroll —ni React—, así que lo que queda es
     * el HTML del servidor solo. Ninguna animación de la página puede ser la
     * dueña de mostrar contenido: si esto se rompe, la landing pierde secciones
     * enteras justo cuando algo ya falló, que es la peor situación posible.
     */
    await page.goto('/');

    await expect(page.locator('#torneo')).toBeVisible();
    // Acotado a la sección: «Formato» también es el principio de «Formato de
    // juego», el primer ítem del reglamento, y el nombre accesible se busca por
    // subcadena.
    const torneo = page.locator('#torneo');
    for (const tarjeta of ['Formato', 'Partidos', 'Horarios', 'Inscripción']) {
      await expect(torneo.getByRole('heading', { name: tarjeta })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Ver boxscore/ })).toHaveCount(4);

    // Y sin el motor tampoco se arrastra para el costado.
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(1);
  });
});
