// Test suite: Gestión de Clientes > Facturas de Venta > Crear Factura de Venta
//
// Crawled from https://imcoarca.leonardojose.dev
//   List:   /facturas-de-venta          (heading "Listado de Facturas de Venta")
//   Create: /facturas-de-venta/nuevo     (heading "Crear Factura de Venta")
//   Fields: Cliente (buscador Código.../Nombre...), select[name=series] (A/B/C),
//           input[name=invoice_date] (date), input[name=delivery_date],
//           input[name=exchange_rate], #show_currency_equivalence, textarea[name=notes]
//   Actions: button "Agregar Ítem", "Cancelar", "Guardar Factura"
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES } from '../../support/helpers/utils.js';

test.describe('Facturas de Venta > Crear Factura de Venta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/facturas-de-venta', { waitUntil: 'domcontentloaded' });
  });

  test('el listado de facturas de venta se muestra con la acción de crear @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Listado de Facturas de Venta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear Factura de Venta' })).toBeVisible();
    await expect(page.locator('#start-date')).toBeVisible();
    await expect(page.locator('#end-date')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('abrir el formulario de creación de factura @smoke', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Factura de Venta' }).click();

    await expect(page).toHaveURL(/\/facturas-de-venta\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Factura de Venta' })).toBeVisible();

    // Core controls of the invoice form.
    await expect(page.locator('select[name="series"]')).toBeVisible();
    await expect(page.locator('input[name="invoice_date"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agregar Ítem' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Factura' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Items de la Factura' })).toBeVisible();
  });

  test('la factura tiene serie, fecha y buscador de cliente @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Factura de Venta' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Factura de Venta' })).toBeVisible();

    // Serie has selectable options (A/B/C).
    const series = page.locator('select[name="series"]');
    const seriesOptions = await series.locator('option').count();
    expect(seriesOptions).toBeGreaterThan(0);

    // Invoice date defaults to today (non-empty).
    await expect(page.locator('input[name="invoice_date"]')).not.toHaveValue('');

    // Cliente search field(s) present.
    await expect(page.getByPlaceholder('Código...').first()).toBeVisible();
    await expect(page.getByPlaceholder('Nombre...').first()).toBeVisible();
  });

  test('validación: guardar factura vacía no crea el comprobante @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Factura de Venta' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Factura de Venta' })).toBeVisible();

    // Attempt to save without a client or items.
    await page.getByRole('button', { name: 'Guardar Factura' }).click();

    // Should not navigate to a persisted invoice detail; stays on the create form.
    await expect(page).toHaveURL(/\/facturas-de-venta\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Factura de Venta' })).toBeVisible();
  });

  test('completar cabecera de factura (serie y fecha) @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Factura de Venta' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Factura de Venta' })).toBeVisible();

    // Choose a serie.
    const series = page.locator('select[name="series"]');
    await series.selectOption({ index: 0 });

    // The client is chosen through the editable "Código..." search box
    // (the "Nombre..." field is read-only and auto-fills from the match).
    const codigoBuscador = page.getByPlaceholder('Código...').first();
    if (await codigoBuscador.count()) {
      await codigoBuscador.click();
      await codigoBuscador.fill('1');
      await page.waitForTimeout(1200);
      // If a suggestions list appears, take the first option.
      const option = page.locator('[role="option"], li').filter({ hasText: /\w/ }).first();
      if (await option.count()) {
        await option.click().catch(() => {});
      }
    }

    const guardar = page.getByRole('button', { name: 'Guardar Factura' });
    await expect(guardar).toBeVisible();

    if (ALLOW_WRITES) {
      await page.getByRole('button', { name: 'Agregar Ítem' }).click().catch(() => {});
      await guardar.click();
      // A saved invoice typically leaves the /nuevo route.
      await expect(page).not.toHaveURL(/\/facturas-de-venta\/nuevo/, { timeout: 20_000 });
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });
});
