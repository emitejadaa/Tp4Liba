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
 * Arrastra sobre la cancha, en unidades de cancha y no en píxeles de pantalla.
 *
 * La cancha es una SVG de 460×300 que se achica con la ventana, así que un
 * arrastre de cien píxeles es un tiro distinto en cada pantalla. Convirtiendo
 * primero, el test tira siempre el mismo tiro mida lo que mida la cancha.
 */
async function arrastrar(page: Page, dx: number, dy: number) {
  /*
   * La escala sale de la matriz de la SVG y no de su rectángulo, por lo mismo
   * que en el juego: la sección vive dentro de la cámara de profundidad, así que
   * con el scroll a medio camino está inclinada y su rectángulo en pantalla no
   * dice cuánto mide una unidad de cancha. El test hace exactamente la cuenta
   * inversa a la que hace el juego.
   */
  const escala = await court(page).evaluate(
    (el) => (el as unknown as SVGSVGElement).getScreenCTM()!.a,
  );
  const caja = (await court(page).boundingBox())!;
  const desdeX = caja.x + caja.width * 0.18;
  const desdeY = caja.y + caja.height * 0.78;

  await page.mouse.move(desdeX, desdeY);
  await page.mouse.down();
  await page.mouse.move(desdeX + dx * escala, desdeY + dy * escala, { steps: 8 });
  await page.mouse.up();
}

/**
 * El arrastre que sale con la puntería con la que arranca el juego: 63 grados y
 * 62% de fuerza, que es un tiro que entra.
 */
const TIRO_BUENO = { dx: 55.9, dy: -109.7 };

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
    await arrastrar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);

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

    await arrastrar(page, 30, -100);
    const empinado = await valor(angulo);
    const flojo = await valor(fuerza);

    await arrastrar(page, 130, -50);
    expect(await valor(angulo)).toBeLessThan(empinado);
    expect(await valor(fuerza)).toBeGreaterThan(flojo);
  });

  test('un arrastre demasiado corto no tira', async ({ page }) => {
    // Apoyar el dedo y levantarlo sin mover cancela. Sin ese piso, cualquier
    // toque sobre la cancha sería un tiro flojísimo que corta la racha.
    await arrastrar(page, 3, -3);
    await expect(stat(page, 'Tiros')).toHaveText('0');
  });

  test('un tiro flojo se queda corto y corta la racha', async ({ page }) => {
    await arrastrar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
    await expect(stat(page, 'Racha')).toHaveText('1');

    await arrastrar(page, 12, -22);
    await expect(stat(page, 'Tiros')).toHaveText('2');
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(stat(page, 'Racha')).toHaveText('0');
    await expect(estado(page)).toContainText('Afuera');
  });

  test('el récord sobrevive a recargar la página', async ({ page }) => {
    await arrastrar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
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

    await arrastrar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);

    // A mitad de vuelo está en otro lado que en reposo.
    await expect.poll(donde, { timeout: 2_000 }).not.toBe(enReposo);

    // Y termina: cuenta el tiro y vuelve sola a su lugar.
    await expect(stat(page, 'Tiros')).toHaveText('1');
    await expect.poll(donde, { timeout: 6_000 }).toBe(enReposo);
  });

  test('una encestada larga confeti', async ({ page }) => {
    await page.goto('/');
    await page.locator('#minijuego').scrollIntoViewIfNeeded();

    await arrastrar(page, TIRO_BUENO.dx, TIRO_BUENO.dy);
    await expect(stat(page, 'Encestadas')).toHaveText('1');
    await expect(page.locator('[data-testid="confetti"] rect').first()).toBeVisible();
  });
});
