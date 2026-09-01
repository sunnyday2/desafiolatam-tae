// Test suite: Gestión de Clientes > Cobranzas > Crear Cobranza
//
// Crawled from https://imcoarca.leonardojose.dev
//   List:   /cobranzas            (heading "Listado de Cobranzas", button "Crear Cobranza")
//   Create: /cobranzas/nuevo       (heading "Crear Cobranza")
//   Fields: Cliente (buscador Código.../Nombre...), #collection_date (Fecha de Cobro)
//   Sections: "Facturas Pendientes de Cobro", "Medios de Pago" (button "Añadir Medio"),
//             "Descuentos y Retenciones", "Resumen"
//   Actions: button "Cancelar", "Guardar Cobranza"
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES } from '../../support/helpers/utils.js';

test.describe('Gestión de Clientes > Crear Cobranza', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cobranzas', { waitUntil: 'domcontentloaded' });
  });

  test('el listado de cobranzas se muestra con la acción de crear @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Listado de Cobranzas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear Cobranza' })).toBeVisible();
    await expect(page.locator('#start-date')).toBeVisible();
    await expect(page.locator('#end-date')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('abrir el formulario de creación de cobranza @smoke', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cobranza' }).click();

    await expect(page).toHaveURL(/\/cobranzas\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Cobranza' })).toBeVisible();

    await expect(page.locator('#collection_date')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Cobranza' })).toBeVisible();
  });

  test('la cobranza muestra sus secciones principales @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cobranza' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Cobranza' })).toBeVisible();

    for (const section of [
      'Facturas Pendientes de Cobro',
      'Medios de Pago',
      'Descuentos y Retenciones',
      'Resumen',
    ]) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible();
    }

    // Buscador de cliente y fecha de cobro por defecto.
    await expect(page.getByPlaceholder('Código...').first()).toBeVisible();
    await expect(page.locator('#collection_date')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: 'Añadir Medio' })).toBeVisible();
  });

  test('validación: guardar cobranza vacía no genera el recibo @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cobranza' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Cobranza' })).toBeVisible();

    await page.getByRole('button', { name: 'Guardar Cobranza' }).click();

    // Without a client / applied amount it should stay on the create form.
    await expect(page).toHaveURL(/\/cobranzas\/nuevo/);
    await expect(page.getByRole('heading', { name: 'Crear Cobranza' })).toBeVisible();
  });

  test('seleccionar cliente y agregar un medio de pago @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear Cobranza' }).click();
    await expect(page.getByRole('heading', { name: 'Crear Cobranza' })).toBeVisible();

    // Select a client through the editable "Código..." search box
    // (the "Nombre..." field is read-only and auto-fills from the match).
    const codigoBuscador = page.getByPlaceholder('Código...').first();
    if (await codigoBuscador.count()) {
      await codigoBuscador.click();
      await codigoBuscador.fill('1');
      await page.waitForTimeout(1200);
      const option = page.locator('[role="option"], li').filter({ hasText: /\w/ }).first();
      if (await option.count()) {
        await option.click().catch(() => {});
      }
    }

    // Add a payment method row.
    await page.getByRole('button', { name: 'Añadir Medio' }).click();

    const guardar = page.getByRole('button', { name: 'Guardar Cobranza' });
    await expect(guardar).toBeVisible();

    if (ALLOW_WRITES) {
      await guardar.click();
      await expect(page).not.toHaveURL(/\/cobranzas\/nuevo/, { timeout: 20_000 });
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });
});
