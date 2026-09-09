// Test suite: Gestión de Clientes > Facturas de Venta > Crear Factura de Venta

import { test, expect } from '@playwright/test';
import { FacturasVentaPage } from '../../pages/facturas-venta.page.js';

test.describe('Facturas de Venta > Crear Factura de Venta', () => {
  test.beforeEach(async ({ page }) => {
    await new FacturasVentaPage(page).goto('/facturas-de-venta');
  });

  test('el listado de facturas de venta se muestra con la acción de crear @smoke', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await expect(facturas.listHeading).toBeVisible();
    await expect(facturas.createButton).toBeVisible();
    await expect(facturas.startDate).toBeVisible();
    await expect(facturas.endDate).toBeVisible();
    await expect(facturas.table()).toBeVisible();
  });

  test('abrir el formulario de creación de factura @smoke', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.openCreate();

    await expect(page).toHaveURL(/\/facturas-de-venta\/nuevo/);
    await expect(facturas.formHeading).toBeVisible();

    // Los controles principales del formulario de factura.
    await expect(facturas.series).toBeVisible();
    await expect(facturas.invoiceDate).toBeVisible();
    await expect(facturas.addItemButton).toBeVisible();
    await expect(facturas.saveButton).toBeVisible();
    await expect(facturas.heading('Items de la Factura')).toBeVisible();
  });

  test('la factura tiene serie, fecha y buscador de cliente @regression', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.openCreate();
    await expect(facturas.formHeading).toBeVisible();

    // Serie tiene las opciones (A/B/C).
    const seriesOptions = await facturas.series.locator('option').count();
    expect(seriesOptions).toBeGreaterThan(0);

    // fecha de factura por defecto es la fecha actual (no vacía).
    await expect(facturas.invoiceDate).not.toHaveValue('');

    // Campo de búsqueda de cliente este presente.
    await expect(facturas.customerCode).toBeVisible();
    await expect(facturas.customerName).toBeVisible();
  });

  test('validación: guardar factura vacía no crea el comprobante @regression', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.openCreate();
    await expect(facturas.formHeading).toBeVisible();

    // Intentar a guardar sin un cliente o un artículo.
    await facturas.save();

    // no permite cambiar la URL y se queda en el formulario con detalle de la factura
    await expect(page).toHaveURL(/\/facturas-de-venta\/nuevo/);
    await expect(facturas.formHeading).toBeVisible();
  });

  test('completar cabecera de factura (serie y fecha) @regression', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.openCreate();
    await expect(facturas.formHeading).toBeVisible();

    // elegir una serie.
    await facturas.series.selectOption({ index: 0 });

    // El cliente se elige a través del cuadro de búsqueda editable "Código..."
    // (el campo "Nombre..." es de solo lectura y se completa automáticamente a partir de la coincidencia).
    await facturas.selectCustomer('1');

    // Verificar que el cliente fue seleccionado y el botón de guardar está disponible.
    await expect(facturas.customerName).not.toHaveValue('');
    await expect(facturas.saveButton).toBeVisible();
    await expect(facturas.saveButton).toBeEnabled();
  });
});
