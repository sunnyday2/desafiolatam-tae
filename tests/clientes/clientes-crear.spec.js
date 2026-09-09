// Test suite: Gestión de Clientes > Clientes > Crear Cliente

import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix, fakeCuit } from '../../support/helpers/utils.js';
import { ClientesPage } from '../../pages/clientes.page.js';

test.describe('Gestión de Clientes > Clientes > Crear Cliente', () => {
  test.beforeEach(async ({ page }) => {
    await new ClientesPage(page).goto('/clientes');
  });

  test('el listado de clientes se muestra con la acción de crear @smoke', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await expect(clientes.heading).toBeVisible();
    await expect(clientes.createButton).toBeVisible();
    await expect(clientes.searchTerm).toBeVisible();
    await expect(clientes.table()).toBeVisible();
  });

  test('abrir el formulario de creación de cliente @smoke', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.openCreate();

    await expect(page).toHaveURL(/\/clientes\/nuevo/);
    await expect(clientes.formHeading).toBeVisible();

    // Campos principales existen
    await expect(clientes.cuit).toBeVisible();
    await expect(clientes.name).toBeVisible();
    await expect(clientes.tax).toBeVisible();
    await expect(clientes.saveButton).toBeVisible();
  });

  test('validación: no permite guardar sin campos obligatorios @regression', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.openCreate();
    await expect(clientes.formHeading).toBeVisible();

    // Intentar guardar con campos requeridos vacíos (CUIT *, Nombre *).
    await clientes.save();

    // Debe permanecer en el formulario de creación en lugar de navegar de vuelta a la lista
    await expect(page).toHaveURL(/\/clientes\/nuevo/);
    await expect(clientes.formHeading).toBeVisible();
  });

  test('completar el formulario de cliente con datos válidos @regression', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.openCreate();
    await expect(clientes.formHeading).toBeVisible();

    const suffix = uniqueSuffix();
    const cuit = fakeCuit();
    const nombre = `Cliente QA ${suffix}`;

    await clientes.fillForm({
      cuit,
      name: nombre,
      email: `qa.cliente.${suffix}@testing.com`,
      phone: '11-4444-5555',
    });

    // Validar que los valores hayan sido ingresados correctamente.
    await expect(clientes.cuit).toHaveValue(cuit);
    await expect(clientes.name).toHaveValue(nombre);
    await expect(clientes.saveButton).toBeEnabled();

    if (ALLOW_WRITES) {
      await clientes.save();
      // En caso de éxito, la app regresa a la lista de clientes.
      await expect(page).toHaveURL(/\/clientes(\?|$|\/)/);
    } else {
      // Write-guard on: validate the form is submit-ready without persisting.
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });

  test('buscar en el listado de clientes @regression', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await expect(clientes.searchTerm).toBeVisible();
    await clientes.search('a');
    // La tabla esta visible después de buscar.
    await expect(clientes.table()).toBeVisible();
  });
});
