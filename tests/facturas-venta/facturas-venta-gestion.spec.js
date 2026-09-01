// Test suite: Gestión de Clientes > Facturas de Venta — Buscar / Modificar / Eliminar
//
// Crawled from https://imcoarca.leonardojose.dev
//   List row "Acciones": button[title="Editar"] -> /facturas-de-venta/{id}/editar
//                          (heading "Editando Factura {number}")
//                        button[title="Eliminar"] -> confirm modal (Cancelar / Confirmar)
//   Search: #search-term + "Buscar"  (also date filters #start-date / #end-date)
//
// Facturas can't be created from scratch cheaply (they need a client + items), so the
// destructive edit/delete tests operate on EXISTING records and are therefore gated
// behind IMCOARCA_ALLOW_WRITES=1. The default run only performs safe, read-only checks
// (search, open edit form, open+cancel the delete modal).
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix, searchList, firstRow, waitForRows, openEdit, openDeleteModal } from '../../support/helpers/utils.js';

test.describe('Facturas de Venta — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/facturas-de-venta', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Facturas de Venta' })).toBeVisible();
  });

  // --- Search -----------------------------------------------------------------

  test('buscar facturas por término y ver resultados @smoke', async ({ page }) => {
    await searchList(page, 'A');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nº Factura' }).first()).toBeVisible();
  });

  test('filtrar facturas por rango de fechas @regression', async ({ page }) => {
    // The list exposes Desde/Hasta date filters.
    await expect(page.locator('#start-date')).toBeVisible();
    await expect(page.locator('#end-date')).toBeVisible();
    await page.locator('#start-date').fill('2020-01-01');
    await page.locator('#end-date').fill('2035-12-31');
    await page.getByRole('button', { name: 'Buscar' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('table')).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    await searchList(page, 'zzz-inexistente-' + uniqueSuffix());
    await expect(page.locator('table')).toBeVisible();
  });

  // --- Modify -----------------------------------------------------------------

  test('abrir el formulario de edición de una factura existente @regression', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay facturas para editar');

    await openEdit(page);
    await expect(page).toHaveURL(/\/facturas-de-venta\/\d+\/editar/);
    // Heading is "Editando Factura {number}".
    await expect(page.getByRole('heading', { name: /Editando Factura/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Factura' })).toBeVisible();
  });

  test('modificar una factura existente y guardar @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');
    test.skip((await waitForRows(page)) === 0, 'No hay facturas para editar');

    await openEdit(page);
    await expect(page.getByRole('heading', { name: /Editando Factura/i })).toBeVisible();

    // Adjust the observations note (a low-risk field) and save.
    const notes = page.locator('textarea[name="notes"]');
    if (await notes.count()) {
      await notes.fill(`Observación QA ${uniqueSuffix()}`);
    }
    await page.getByRole('button', { name: 'Guardar Factura' }).click();
    // A successful save leaves the edit form.
    await expect(page).not.toHaveURL(/\/editar/, { timeout: 20_000 });
  });

  // --- Delete -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay facturas para eliminar');

    const before = await page.locator('table tbody tr').count();
    const modal = await openDeleteModal(page);

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator('table tbody tr')).toHaveCount(before);
  });

  test('eliminar una factura confirmando la acción @regression', async ({ page }) => {
    test.skip(
      !ALLOW_WRITES,
      'Eliminación real deshabilitada. Actúa sobre datos reales: habilitar solo con IMCOARCA_ALLOW_WRITES=1'
    );
    test.skip((await waitForRows(page)) === 0, 'No hay facturas para eliminar');

    const before = await page.locator('table tbody tr').count();
    const modal = await openDeleteModal(page);
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirmar' }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });
    // One fewer row after deletion (best-effort check).
    await expect(page.locator('table tbody tr')).toHaveCount(Math.max(before - 1, 0), { timeout: 20_000 });
  });
});
