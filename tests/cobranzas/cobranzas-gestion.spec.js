// Test suite: Gestión de Clientes > Cobranzas — Buscar / Modificar / Eliminar

import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix } from '../../support/helpers/utils.js';
import { CobranzasPage } from '../../pages/cobranzas.page.js';

// --- Helpers de ciclo de vida ------------------------------------------------

async function createCobranza(page) {
  const cobranzas = new CobranzasPage(page);
  await cobranzas.goto('/cobranzas/nuevo');
  await expect(cobranzas.formHeading).toBeVisible();
  await cobranzas.selectCustomer('1');
  await cobranzas.addPaymentMethod();
  await cobranzas.save();
  // La app redirige al listado tras guardar con éxito.
  await expect(page).not.toHaveURL(/\/cobranzas\/nuevo/);
  await expect(cobranzas.listHeading).toBeVisible();
  // Leer el número de recibo de la primera fila (la más reciente, orden descendente).
  const firstCell = cobranzas.rows().first().locator('td').first();
  await expect(firstCell).toBeVisible();
  const reciboNum = await firstCell.innerText();
  return reciboNum.trim();
}

async function deleteCobranza(page, reciboNum) {
  if (!reciboNum) return;
  const cobranzas = new CobranzasPage(page);
  await cobranzas.goto('/cobranzas');
  await expect(cobranzas.listHeading).toBeVisible();
  await cobranzas.search(reciboNum);
  if ((await cobranzas.rows().count()) === 0) return;
  const modal = await cobranzas.openDelete();
  await cobranzas.confirmDelete(modal);
  await expect(modal).toBeHidden();
}

// --- Suite ------------------------------------------------------------------

test.describe('Cobranzas — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.goto('/cobranzas');
    await expect(cobranzas.listHeading).toBeVisible();
  });

  // --- Búsqueda ---------------------------------------------------------------

  test('buscar cobranzas por término y ver resultados @smoke', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.search('3');
    await expect(cobranzas.listHeading).toBeVisible();
    const hasTable = await cobranzas.table().count();
    if (hasTable) {
      await expect(cobranzas.columnHeader('Nº Recibo')).toBeVisible();
    }
  });

  test('filtrar cobranzas por rango de fechas @regression', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await expect(cobranzas.startDate).toBeVisible();
    await expect(cobranzas.endDate).toBeVisible();
    await cobranzas.filterByDateRange('2020-01-01', '2035-12-31');
    await expect(cobranzas.listHeading).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.search('zzz-inexistente-' + uniqueSuffix());
    await expect(cobranzas.listHeading).toBeVisible();
  });

  // --- Actualizar -------------------------------------------------------------

  test('abrir el formulario de edición de una cobranza existente @regression', async ({ page }) => {
    const reciboNum = await createCobranza(page);

    const cobranzas = new CobranzasPage(page);
    await cobranzas.goto('/cobranzas');
    await expect(cobranzas.listHeading).toBeVisible();
    await cobranzas.search(reciboNum);

    await cobranzas.openEdit();
    await expect(page).toHaveURL(/\/cobranzas\/\d+\/editar/);
    await expect(cobranzas.editHeading).toBeVisible();
    await expect(cobranzas.saveButton).toBeVisible();

    // Limpiar.
    await deleteCobranza(page, reciboNum);
  });

  test('modificar una cobranza existente y guardar @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const reciboNum = await createCobranza(page);

    const cobranzas = new CobranzasPage(page);
    await cobranzas.goto('/cobranzas');
    await expect(cobranzas.listHeading).toBeVisible();
    await cobranzas.search(reciboNum);

    await cobranzas.openEdit();
    await expect(cobranzas.editHeading).toBeVisible();

    // Guardar sin cambios (la fecha de cobro está prellenada).
    await cobranzas.save();
    await expect(page).not.toHaveURL(/\/editar/);

    // Limpiar.
    await deleteCobranza(page, reciboNum);
  });

  // --- Eliminar ---------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    const reciboNum = await createCobranza(page);

    const cobranzas = new CobranzasPage(page);
    await cobranzas.goto('/cobranzas');
    await expect(cobranzas.listHeading).toBeVisible();
    await cobranzas.search(reciboNum);

    await expect(cobranzas.firstRow()).toBeVisible();
    const before = await cobranzas.rows().count();
    const modal = await cobranzas.openDelete();

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    // Cancelar — no se elimina.
    await cobranzas.cancelDelete(modal);
    await expect(modal).toBeHidden();
    await expect(cobranzas.rows()).toHaveCount(before);

    // Limpiar.
    await deleteCobranza(page, reciboNum);
  });

  test('eliminar una cobranza confirmando la acción @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Eliminación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const reciboNum = await createCobranza(page);

    const cobranzas = new CobranzasPage(page);
    await cobranzas.goto('/cobranzas');
    await expect(cobranzas.listHeading).toBeVisible();
    await cobranzas.search(reciboNum);

    await expect(cobranzas.firstRow()).toBeVisible();
    const modal = await cobranzas.openDelete();
    await expect(modal).toBeVisible();
    await cobranzas.confirmDelete(modal);
    await expect(modal).toBeHidden();
    // La fila ya no aparece en los resultados de la búsqueda.
    await expect(cobranzas.rows()).toHaveCount(0);
  });
});
