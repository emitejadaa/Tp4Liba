import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * El minijuego, jugado como se juega: arrastrando.
 *
 * La suite corre con `prefers-reduced-motion`, y eso acá no es esquivar nada: en
 * ese modo el tiro se simula entero de una y el resultado aparece enseguida, en
 * vez de repartirse en cuadros. Es exactamente la misma simulación —el mismo
 * tiro da el mismo resultado— así que se puede verificar el juego sin que
 * dependa de cuántos cuadros alcanzó a dibujar la máquina. El vuelo cuadro a
 * cuadro se verifica aparte, al final, con el movimiento habilitado.
 */

const stat = (page: Page, label: string) =>
  page.locator('#minijuego dl div').filter({ hasText: label }).locator('dd');

const court = (page: Page) => page.locator('[data-testid="court"]');
const estado = (page: Page) => page.locator('#minijuego [role="status"]');

/**
 * Apunta llevando el dedo a un punto **respecto de la pelota** y suelta.
 *
 * Es la cuenta inversa a la que hace el juego: `dx` y `dy` van en unidades de
 * cancha desde la pelota, y de ahí se pasan a píxeles con la matriz de la SVG.
 * La cancha se achica con la ventana, así que sin convertir, el mismo gesto
 * sería un tiro distinto en cada pantalla.
 *
 * Arranca un poco más atrás y termina en el punto pedido: apretar no apunta, hay
 * que mover para que el gesto se arme.
 */
async function apuntar(page: Page, dx: number, dy: number) {
  const destino = await page.evaluate(
    ([bx, by]: [number, number]) => {
      const svg = document.querySelector('[data-testid="court"]') as unknown as SVGSVGElement;
      const matrix = svg.getScreenCTM()!;
      // (73, 257) es el centro de la pelota en reposo: LAUNCH en `lib/minigame/court`.
      const point = new DOMPoint(73 + bx, 257 + by).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    },
    [dx, dy] as [number, number],
  );

  await page.mouse.move(destino.x - 24, destino.y + 24);
  await page.mouse.down();
  await page.mouse.move(destino.x, destino.y, { steps: 8 });
  return destino;
}

/** Apunta y suelta: un tiro entero. */
async function tirar(page: Page, dx: number, dy: number) {
  await apuntar(page, dx, dy);
  await page.mouse.up();
}

/**
 * El gesto que sale con la puntería con la que arranca el juego: 63 grados y
 * 62% de fuerza, o sea el dedo a 128 unidades de la pelota. Es un tiro que entra.
 */
const TIRO_BUENO = { dx: 58, dy: -113.8 };

const valor = (locator: Locator, attr = 'aria-valuenow') =>
  locator.evaluate((el, name) => Number(el.getAttribute(name)), attr);

test.describe('Minijuego «Tirá al aro»', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();
  });

  test('arranca en cero y explica qué hacer', async ({ page }) => {
    await expect(stat(page, 'Encestadas')).toHaveText('0');
    await expect(stat(page, 'Tiros')).toHaveText('0');
    await expect(estado(page)).toHaveText('Arrastrá para apuntar');
  });

  test('arrastrar apunta y soltar tira', async ({ page }) => {
    await tirar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);

    await expect(stat(page, 'Tiros')).toHaveText('1');
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(stat(page, 'Racha')).toHaveText('1');
  });

  test('según cómo se arrastre, sale un tiro distinto', async ({ page }) => {
    /*
     * Es todo el control del juego: el arrastre trae los dos números que
     * definen un tiro. Para dónde apunta el dedo es el ángulo y cuánto se
     * arrastró es la fuerza, así que no hay dos tiros iguales.
     */
    const angulo = page.getByRole('progressbar', { name: 'Ángulo del tiro' });
    const fuerza = page.getByRole('progressbar', { name: 'Fuerza del tiro' });

    await tirar(page, 30, -100);
    const empinado = await valor(angulo);
    const flojo = await valor(fuerza);

    await tirar(page, 130, -50);
    expect(await valor(angulo)).toBeLessThan(empinado);
    expect(await valor(fuerza)).toBeGreaterThan(flojo);
  });

  test('soltar con el dedo encima de la pelota no tira', async ({ page }) => {
    // Es la manera de arrepentirse de un tiro que ya se estaba apuntando, y es
    // lo que evita que un toque suelto sobre la cancha salga como un tiro.
    await tirar(page, 3, -3);
    await expect(stat(page, 'Tiros')).toHaveText('0');
  });

  test('un tiro flojo se queda corto y corta la racha', async ({ page }) => {
    await tirar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
    await expect(stat(page, 'Racha')).toHaveText('1');

    await tirar(page, 18, -33);
    await expect(stat(page, 'Tiros')).toHaveText('2');
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(stat(page, 'Racha')).toHaveText('0');
    await expect(estado(page)).toContainText('Afuera');
  });

  test('apretar sin mover no tira', async ({ page }) => {
    /*
     * Apretar no apunta: hace falta mover. Sin eso, un click cualquiera sobre la
     * cancha —enfocarla para jugar con el teclado, por ejemplo— saldría como un
     * tiro a la puntería de donde se apretó, que es un tiro que nadie quiso.
     */
    const caja = (await court(page).boundingBox())!;
    await page.mouse.click(caja.x + caja.width * 0.6, caja.y + caja.height * 0.4);
    await expect(stat(page, 'Tiros')).toHaveText('0');
  });

  test('el tiro sale de dónde está el dedo, no de dónde se apretó', async ({ page }) => {
    /*
     * Es lo que hace que el gesto no tenga nada escondido. Medido desde donde se
     * apretó, dos dedos en el mismo punto de la pantalla dan tiros distintos
     * según de dónde vinieron, y no hay manera de saberlo mirando.
     */
    const angulo = page.getByRole('progressbar', { name: 'Ángulo del tiro' });
    const fuerza = page.getByRole('progressbar', { name: 'Fuerza del tiro' });

    const destino = await apuntar(page, 90, -90);
    await page.mouse.up();
    const desdeAbajo = [await valor(angulo), await valor(fuerza)];

    // El mismo punto final, llegando desde el lado opuesto.
    await page.mouse.move(destino.x + 40, destino.y - 40);
    await page.mouse.down();
    await page.mouse.move(destino.x, destino.y, { steps: 8 });
    await page.mouse.up();

    expect([await valor(angulo), await valor(fuerza)]).toEqual(desdeAbajo);
  });

  test('mientras se apunta se ve la banda que une la pelota con el dedo', async ({ page }) => {
    // Es el gesto hecho dibujo. Sin esto, apuntar pasaba entero en la cabeza de
    // quien juega: se apretaba en el vacío y la pelota estaba en la otra punta.
    const banda = page.locator('[data-testid="banda"]');
    await expect(banda).toHaveCount(0);

    await apuntar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
    await expect(banda).toBeVisible();

    await page.mouse.up();
    await expect(banda).toHaveCount(0);
  });

  test('el récord sobrevive a recargar la página', async ({ page }) => {
    await tirar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
    await expect(page.getByText('Mejor racha:')).toBeVisible();

    await page.reload();
    await page.locator('#minijuego').scrollIntoViewIfNeeded();
    await expect(page.locator('#minijuego').getByText('Mejor racha:')).toBeVisible();
    await expect(stat(page, 'Tiros')).toHaveText('0');
  });

  test('arrastrar en la cancha no scrollea la página', async ({ page }) => {
    /*
     * Es la diferencia entre que el juego se pueda jugar en un teléfono y que no.
     * Sin `touch-action: none`, el navegador se queda con el gesto antes del
     * primer `pointermove`: la página se va para abajo y el tiro nunca sale.
     */
    const touchAction = await court(page).evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe('none');
  });

  test('se puede apuntar y tirar con el teclado', async ({ page }) => {
    const cancha = page.getByRole('application');
    const angulo = page.getByRole('progressbar', { name: 'Ángulo del tiro' });

    await cancha.focus();
    const antes = await valor(angulo);
    await page.keyboard.press('ArrowUp');
    expect(await valor(angulo)).toBeGreaterThan(antes);

    await page.keyboard.press('Enter');
    await expect(stat(page, 'Tiros')).toHaveText('1');
  });

  test('la cancha se anuncia con la puntería puesta', async ({ page }) => {
    // Es lo único que oye quien juega con el teclado: no tiene ni la guía
    // punteada ni el medidor.
    await expect(page.getByRole('application')).toHaveAttribute(
      'aria-label',
      /Ángulo \d+ grados, fuerza \d+%/,
    );
  });
});

test.describe('Minijuego con movimiento', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('la pelota vuela: pasa por el aire antes de que se sepa el resultado', async ({ page }) => {
    /*
     * Con movimiento el tiro no se resuelve de golpe: la pelota recorre su arco
     * cuadro a cuadro y el resultado llega cuando cruza el aro. Si esto se
     * rompiera, el juego seguiría contando bien y no se vería volar nada.
     */
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();

    const pelota = page.locator('[data-testid="ball"]');
    const donde = () => pelota.evaluate((el) => getComputedStyle(el).transform);
    const enReposo = await donde();

    await tirar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);

    // A mitad de vuelo está en otro lado que en reposo.
    await expect.poll(donde, { timeout: 2_000 }).not.toBe(enReposo);

    // Y termina: cuenta el tiro y vuelve sola a su lugar.
    await expect(stat(page, 'Tiros')).toHaveText('1');
    await expect.poll(donde, { timeout: 6_000 }).toBe(enReposo);
  });

  test('una encestada larga confeti', async ({ page }) => {
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();

    await tirar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(page.locator('[data-testid="confetti"] rect').first()).toBeVisible();
  });
});
