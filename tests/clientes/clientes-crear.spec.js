// Test suite: Gestión de Clientes > Clientes > Crear Cliente
//
// Crawled from https://imcoarca.leonardojose.dev
//   List:   /clientes            (heading "Listado de Clientes", button "Crear Cliente")
//   Create: /clientes/nuevo      (heading "Crear Nuevo Cliente")
//   Fields: #cuit (CUIT *), #name (Nombre o Razón Social *), select#tax,
//           #email, #phone, #address, #city, select#district ...
//   Submit: button "Guardar Cambios"
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix, fakeCuit } from '../../support/helpers/utils.js';

test.describe('Gestión de Clientes > Clientes > Crear Cliente', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'domcontentloaded' });
  });

  test('el listado de clientes se muestra con la acción de crear @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Listado de Clientes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear Cliente' })).toBeVisible();
    await expect(page.locator('#search-term')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('abrir el formulario de creación de cliente @smoke', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cliente' }).click();

    await expect(page).toHaveURL(/\/clientes\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Cliente' })).toBeVisible();

    // Core fields are present.
    await expect(page.locator('#cuit')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#tax')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeVisible();
  });

  test('validación: no permite guardar sin campos obligatorios @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cliente' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Cliente' })).toBeVisible();

    // Attempt to save with empty required fields (CUIT *, Nombre *).
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Should remain on the create form rather than navigating back to the list.
    await expect(page).toHaveURL(/\/clientes\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Cliente' })).toBeVisible();
  });

  test('completar el formulario de cliente con datos válidos @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cliente' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Cliente' })).toBeVisible();

    const suffix = uniqueSuffix();
    const cuit = fakeCuit();
    const nombre = `Cliente QA ${suffix}`;

    await page.locator('#cuit').fill(cuit);
    await page.locator('#name').fill(nombre);

    // Optional but common fields (fill only if present).
    if (await page.locator('#email').count()) {
      await page.locator('#email').fill(`qa.cliente.${suffix}@testing.com`);
    }
    if (await page.locator('#phone').count()) {
      await page.locator('#phone').fill('11-4444-5555');
    }

    // Condición Tributaria — pick the first real option if available.
    const tax = page.locator('#tax');
    if (await tax.count()) {
      const options = await tax.locator('option').allTextContents();
      const firstReal = options.find((o) => o.trim() && !/selecciona/i.test(o));
      if (firstReal) await tax.selectOption({ label: firstReal.trim() });
    }

    // Verify values were entered correctly.
    await expect(page.locator('#cuit')).toHaveValue(cuit);
    await expect(page.locator('#name')).toHaveValue(nombre);

    const guardar = page.getByRole('button', { name: 'Guardar Cambios' });
    await expect(guardar).toBeEnabled();

    if (ALLOW_WRITES) {
      await guardar.click();
      // On success the app returns to the clientes list.
      await expect(page).toHaveURL(/\/clientes(\?|$|\/)/, { timeout: 20_000 });
    } else {
      // Write-guard on: validate the form is submit-ready without persisting.
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });

  test('buscar en el listado de clientes @regression', async ({ page }) => {
    await expect(page.locator('#search-term')).toBeVisible();
    await page.locator('#search-term').fill('a');
    await page.getByRole('button', { name: 'Buscar' }).first().click();
    // The table remains rendered after searching.
    await expect(page.locator('table')).toBeVisible();
  });
});
