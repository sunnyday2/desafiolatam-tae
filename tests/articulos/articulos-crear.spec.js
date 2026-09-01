// Test suite: Inventario > Artículos
//
// Crawled from https://imcoarca.leonardojose.dev
//   List:   /articulos           (heading "Listado de Artículos", button "Crear Artículo")
//   Create: /articulos/nuevo      (heading "Crear Nuevo Artículo")
//   Fields: #sku (Código SKU *), #name (Nombre *), textarea#description,
//           select#line (Línea *), select#category (Categoría *), #unit,
//           select#is_active, #sale_price, #cost_price, #stock_quantity
//   Submit: button "Guardar Cambios"
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix } from '../../support/helpers/utils.js';

test.describe('Inventario > Artículos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articulos', { waitUntil: 'domcontentloaded' });
  });

  test('el listado de artículos se muestra con sus columnas @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Listado de Artículos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear Artículo' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Key column headers exist.
    for (const header of ['Código', 'Descripción', 'Stock', 'Precio Venta', 'Estado']) {
      await expect(page.getByRole('columnheader', { name: header }).first()).toBeVisible();
    }
  });

  test('abrir el formulario de creación de artículo @smoke', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Artículo' }).click();

    await expect(page).toHaveURL(/\/articulos\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Artículo' })).toBeVisible();

    await expect(page.locator('#sku')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#line')).toBeVisible();
    await expect(page.locator('#category')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeVisible();
  });

  test('validación: no permite guardar sin campos obligatorios @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Artículo' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Artículo' })).toBeVisible();

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Stays on the create form because SKU/Nombre/Línea/Categoría are required.
    await expect(page).toHaveURL(/\/articulos\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Artículo' })).toBeVisible();
  });

  test('completar el formulario de artículo con datos válidos @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Artículo' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Artículo' })).toBeVisible();

    const suffix = uniqueSuffix();
    // The SKU field is numeric (maxlength 14) and applies an auto-mask
    // (e.g. "0000.0019.0020"), so use digits and read back the masked value.
    const skuDigits = `9${suffix}${suffix}`.slice(0, 10);
    const nombre = `Artículo QA ${suffix}`;

    await page.locator('#sku').fill(skuDigits);
    await page.locator('#name').fill(nombre);

    if (await page.locator('#description').count()) {
      await page.locator('#description').fill('Artículo generado por la suite E2E de QA.');
    }

    // Línea * and Categoría * — select the first real option.
    await selectFirstRealOption(page.locator('#line'));
    await selectFirstRealOption(page.locator('#category'));

    if (await page.locator('#sale_price').count()) {
      await page.locator('#sale_price').fill('1500');
    }
    if (await page.locator('#stock_quantity').count()) {
      await page.locator('#stock_quantity').fill('10');
    }

    // SKU is auto-masked by the app; just assert it captured our digits (non-empty).
    await expect(page.locator('#sku')).not.toHaveValue('');
    await expect(page.locator('#name')).toHaveValue(nombre);

    const guardar = page.getByRole('button', { name: 'Guardar Cambios' });
    await expect(guardar).toBeEnabled();

    if (ALLOW_WRITES) {
      await guardar.click();
      await expect(page).toHaveURL(/\/articulos(\?|$|\/)/, { timeout: 20_000 });
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });

  test('buscar en el listado de artículos @regression', async ({ page }) => {
    await expect(page.locator('#search-term')).toBeVisible();
    await page.locator('#search-term').fill('a');
    await page.getByRole('button', { name: 'Buscar' }).first().click();
    await expect(page.locator('table')).toBeVisible();
  });
});

/** Select the first option of a <select> that is not the placeholder.
 * The Línea/Categoría selects start disabled for ~1.5s while their options
 * load asynchronously, so wait until the control is enabled first. */
async function selectFirstRealOption(select) {
  if (!(await select.count())) return;
  await select.waitFor({ state: 'visible' });
  // Wait for the control to become enabled (options finished loading).
  await expect(select).toBeEnabled({ timeout: 10_000 });

  const options = await select.locator('option').allTextContents();
  const firstReal = options.find((o) => o.trim() && !/selecciona/i.test(o));
  if (firstReal) await select.selectOption({ label: firstReal.trim() });
}
