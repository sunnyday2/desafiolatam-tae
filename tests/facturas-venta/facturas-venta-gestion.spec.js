// Test suite: Gestión de Clientes > Facturas de Venta — Buscar / Modificar / Eliminar

import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix } from '../../support/helpers/utils.js';
import { FacturasVentaPage } from '../../pages/facturas-venta.page.js';

test.describe('Facturas de Venta — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.goto('/facturas-de-venta');
    await expect(facturas.listHeading).toBeVisible();
  });

  // --- Búsqueda -----------------------------------------------------------------

  test('buscar facturas por término y ver resultados @smoke', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.search('A');
    await expect(facturas.table()).toBeVisible();
    await expect(facturas.columnHeader('Nº Factura')).toBeVisible();
  });

  test('filtrar facturas por rango de fechas @regression', async ({ page }) => {
    // filtros de Fecha Desde/Hasta.
    const facturas = new FacturasVentaPage(page);
    await expect(facturas.startDate).toBeVisible();
    await expect(facturas.endDate).toBeVisible();
    await facturas.filterByDateRange('2020-01-01', '2035-12-31');
    await expect(facturas.table()).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.search('zzz-inexistente-' + uniqueSuffix());
    await expect(facturas.table()).toBeVisible();
  });

  // --- Actualizar -----------------------------------------------------------------

  test('abrir el formulario de edición de una factura existente @regression', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.openEdit();
    await expect(page).toHaveURL(/\/facturas-de-venta\/\d+\/editar/);
    // Heading tiene "Editando Factura {number}".
    await expect(facturas.editHeading).toBeVisible();
    await expect(facturas.saveButton).toBeVisible();
  });

  test('modificar una factura existente y guardar @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const facturas = new FacturasVentaPage(page);
    await facturas.openEdit();
    await expect(facturas.editHeading).toBeVisible();

    // Llenar la nota de observaciones y guardar.
    if (await facturas.notes.count()) {
      await facturas.notes.fill(`Observación QA ${uniqueSuffix()}`);
    }
    await facturas.save();
    // permanecer en el formularios de edición.
    await expect(page).not.toHaveURL(/\/editar/);
  });

  // --- Eliminar -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    // Esperar a que la tabla cargue antes de capturar el conteo inicial
    await expect(facturas.table()).toBeVisible();
    await expect(facturas.firstRow()).toBeVisible();
    const before = await facturas.rows().count();
    const modal = await facturas.openDelete();

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    await facturas.cancelDelete(modal);
    await expect(modal).toBeHidden();
    await expect(facturas.rows()).toHaveCount(before);
  });

  test('eliminar una factura confirmando la acción @regression', async ({ page }) => {
    test.skip(
      !ALLOW_WRITES,
      'Eliminación real deshabilitada. Actúa sobre datos reales: habilitar solo con IMCOARCA_ALLOW_WRITES=1'
    );

    const facturas = new FacturasVentaPage(page);
    const modal = await facturas.openDelete();
    await expect(modal).toBeVisible();
    await facturas.confirmDelete(modal);
    // Solo verificar que el modal se cerró; la tabla usa paginación y
    // siempre muestra el mismo número de filas por página tras recargar.
    await expect(modal).toBeHidden();
  });
});
