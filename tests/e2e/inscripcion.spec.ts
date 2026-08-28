import { expect, test } from '@playwright/test';

test.describe('Modal de inscripción', () => {
  test('valida, confirma y cierra', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('button', { name: 'Inscribirse' }).click();

    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole('heading', { name: 'Inscribí tu equipo' })).toBeVisible();

    // Enviar vacío muestra los tres errores y no confirma.
    await dialogo.getByRole('button', { name: 'Enviar' }).click();
    await expect(dialogo.getByText('Escribí tu nombre.')).toBeVisible();
    await expect(dialogo.getByText('Necesitamos un mail para contestarte.')).toBeVisible();
    await expect(dialogo.getByText('Poné el nombre del equipo.')).toBeVisible();

    // Un mail mal escrito se rechaza.
    await dialogo.getByLabel('Mail').fill('no-es-un-mail');
    await dialogo.getByRole('button', { name: 'Enviar' }).click();
    await expect(dialogo.getByText('Ese mail no parece válido.')).toBeVisible();

    await dialogo.getByLabel('Tu nombre').fill('Emiliano');
    await dialogo.getByLabel('Mail').fill('emi@liba.com.ar');
    await dialogo.getByLabel('Nombre del equipo').fill('Los Halcones');
    await dialogo.getByRole('button', { name: 'Enviar' }).click();

    await expect(dialogo.getByText(/Anotamos a/)).toBeVisible();
    await expect(dialogo.getByText(/no envía nada por su cuenta/)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('el foco arranca en el primer campo y no se escapa del diálogo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('button', { name: 'Inscribirse' }).click();

    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByLabel('Tu nombre')).toBeFocused();

    // Tabulando muchas veces el foco sigue adentro del diálogo.
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    const dentro = await dialogo.evaluate((el) => el.contains(document.activeElement));
    expect(dentro).toBe(true);
  });

  test('desde sponsors abre el formulario de marca con el plan elegido', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sponsors').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Quiero ser sponsor' }).first().click();

    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Quiero ser sponsor' })).toBeVisible();
    await expect(dialogo.getByLabel('Nombre de la marca')).toBeVisible();
    await expect(dialogo.getByText('bronce')).toBeVisible();
  });
});
