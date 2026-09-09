// Test suite: Gestión de Clientes > Cobranzas > Crear Cobranza

import { test, expect } from '@playwright/test';
import { ALLOW_WRITES } from '../../support/helpers/utils.js';
import { CobranzasPage } from '../../pages/cobranzas.page.js';

test.describe('Gestión de Clientes > Crear Cobranza', () => {
  test.beforeEach(async ({ page }) => {
    await new CobranzasPage(page).goto('/cobranzas');
  });

  test('el listado de cobranzas se muestra con la acción de crear @smoke', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await expect(cobranzas.listHeading).toBeVisible();
    await expect(cobranzas.createButton).toBeVisible();
    await expect(cobranzas.startDate).toBeVisible();
    await expect(cobranzas.endDate).toBeVisible();
    // La tabla puede no estar presente si no hay cobranzas en el sistema
  });

  test('abrir el formulario de creación de cobranza @smoke', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.openCreate();

    await expect(page).toHaveURL(/\/cobranzas\/nuevo/);
    await expect(cobranzas.formHeading).toBeVisible();

    await expect(cobranzas.collectionDate).toBeVisible();
    await expect(cobranzas.saveButton).toBeVisible();
  });

  test('la cobranza muestra sus secciones principales @regression', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.openCreate();
    await expect(cobranzas.formHeading).toBeVisible();

    for (const section of [
      'Facturas Pendientes de Cobro',
      'Medios de Pago',
      'Descuentos y Retenciones',
      'Resumen',
    ]) {
      await expect(cobranzas.heading(section)).toBeVisible();
    }

    // Buscador de cliente y fecha de cobro por defecto.
    await expect(cobranzas.customerCode).toBeVisible();
    await expect(cobranzas.collectionDate).not.toHaveValue('');
    await expect(cobranzas.addPaymentButton).toBeVisible();
  });

  test('validación: guardar cobranza vacía no genera el recibo @regression', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.openCreate();
    await expect(cobranzas.formHeading).toBeVisible();

    await cobranzas.save();

    // si el cliente no está seleccionado o no hay monto aplicado,
    // debe permanecer en el formulario de creación
    await expect(page).toHaveURL(/\/cobranzas\/nuevo/);
    await expect(cobranzas.formHeading).toBeVisible();
  });

  test('seleccionar cliente y agregar un medio de pago @regression', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    await cobranzas.openCreate();
    await expect(cobranzas.formHeading).toBeVisible();

    // Seleccionar a cliente en el campo de búsqueda "Código..." 
    // (el campo "Nombre..." es de solo lectura y se completa automáticamente a partir de la coincidencia)
    await cobranzas.selectCustomer('1');

    // agregar linea con el medio de pago por defecto (efectivo) y un monto.
    await cobranzas.addPaymentMethod();

    await expect(cobranzas.saveButton).toBeVisible();

    if (ALLOW_WRITES) {
      await cobranzas.save();
      await expect(page).not.toHaveURL(/\/cobranzas\/nuevo/);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });
});
