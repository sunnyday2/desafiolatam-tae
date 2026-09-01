// Test suite: Gestión de Clientes > Cobranzas — Buscar / Modificar / Eliminar
//
// Crawled from https://imcoarca.leonardojose.dev
//   List row "Acciones": button[title="Editar"] -> /cobranzas/{id}/editar (heading "Editar Cobranza")
//                        button[title="Eliminar"] -> confirm modal (Cancelar / Confirmar)
//   Search: #search-term + "Buscar"  (also date filters #start-date / #end-date)
//
// Cobranzas depend on pending invoices, so destructive edit/delete tests operate on
// EXISTING records and are gated behind IMCOARCA_ALLOW_WRITES=1. The default run only
// performs safe checks (search, open edit form, open+cancel the delete modal).
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix, searchList, firstRow, waitForRows, openEdit, openDeleteModal } from '../../support/helpers/utils.js';

test.describe('Cobranzas — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cobranzas', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Cobranzas' })).toBeVisible();
  });

  // --- Search -----------------------------------------------------------------

  test('buscar cobranzas por término y ver resultados @smoke', async ({ page }) => {
    await searchList(page, '3');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nº Recibo' }).first()).toBeVisible();
  });

  test('filtrar cobranzas por rango de fechas @regression', async ({ page }) => {
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

  test('abrir el formulario de edición de una cobranza existente @regression', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay cobranzas para editar');

    await openEdit(page);
    await expect(page).toHaveURL(/\/cobranzas\/\d+\/editar/);
    await expect(page.getByRole('heading', { name: 'Editar Cobranza' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Cobranza' })).toBeVisible();
  });

  test('modificar una cobranza existente y guardar @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');
    test.skip((await waitForRows(page)) === 0, 'No hay cobranzas para editar');

    await openEdit(page);
    await expect(page.getByRole('heading', { name: 'Editar Cobranza' })).toBeVisible();

    // Re-save without structural changes (collection date is prefilled).
    await page.getByRole('button', { name: 'Guardar Cobranza' }).click();
    await expect(page).not.toHaveURL(/\/editar/, { timeout: 20_000 });
  });

  // --- Delete -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay cobranzas para eliminar');

    const before = await page.locator('table tbody tr').count();
    const modal = await openDeleteModal(page);

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator('table tbody tr')).toHaveCount(before);
  });

  test('eliminar una cobranza confirmando la acción @regression', async ({ page }) => {
    test.skip(
      !ALLOW_WRITES,
      'Eliminación real deshabilitada. Actúa sobre datos reales: habilitar solo con IMCOARCA_ALLOW_WRITES=1'
    );
    test.skip((await waitForRows(page)) === 0, 'No hay cobranzas para eliminar');

    const before = await page.locator('table tbody tr').count();
    const modal = await openDeleteModal(page);
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirmar' }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('table tbody tr')).toHaveCount(Math.max(before - 1, 0), { timeout: 20_000 });
  });
});
