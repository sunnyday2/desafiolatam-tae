// Test suite: Gestión de Clientes > Clientes — Buscar / Modificar / Eliminar

import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix, fakeCuit } from '../../support/helpers/utils.js';
import { ClientesPage } from '../../pages/clientes.page.js';

test.describe('Gestión de Clientes > Clientes — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.goto('/clientes');
    await expect(clientes.heading).toBeVisible();
  });

  // --- Búsqueda -----------------------------------------------------------------

  test('buscar clientes por término y ver resultados @smoke', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.search('a');
    await expect(clientes.table()).toBeVisible();
    // el encabezado siempre está presente; el cuerpo puede o no tener nada
    await expect(clientes.columnHeader('CUIT')).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.search('zzz-inexistente-' + uniqueSuffix());
    await expect(clientes.table()).toBeVisible();
  });

  // --- Modify -----------------------------------------------------------------

  test('abrir el formulario de edición de un cliente existente @regression', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.openEdit();
    await expect(page).toHaveURL(/\/clientes\/\d+\/editar/);
    await expect(clientes.editHeading).toBeVisible();

    // los formularios de modificación viene prellenado.
    await expect(clientes.name).not.toHaveValue('');
    await expect(clientes.cuit).not.toHaveValue('');
    await expect(clientes.saveButton).toBeEnabled();
  });

  test('modificar un cliente y guardar los cambios @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    // Crear un cliente de prueba para modificar, para no tocar registros reales
    const suffix = uniqueSuffix();
    const created = await createCliente(page, suffix);
    const clientes = new ClientesPage(page);
    await clientes.goto('/clientes');
    await clientes.search(created.cuit);

    await clientes.openEdit();
    await expect(clientes.editHeading).toBeVisible();

    const nuevoNombre = `Cliente QA Editado ${suffix}`;
    await clientes.name.fill(nuevoNombre);
    await clientes.save();

    // devolver una lista en caso de éxito.
    await expect(page).toHaveURL(/\/clientes(\?|$|\/)/);

    // Limpiar: eliminar el cliente de prueba
    await deleteCliente(page, created.cuit);
  });

  // --- Delete -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    const clientes = new ClientesPage(page);
    // Esperar a que la tabla cargue antes de capturar el conteo inicial
    await expect(clientes.table()).toBeVisible();
    await expect(clientes.firstRow()).toBeVisible();
    const before = await clientes.rows().count();
    const modal = await clientes.openDelete();

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    // Cancelar — no se elimina.
    await clientes.cancelDelete(modal);
    await expect(modal).toBeHidden();
    await expect(clientes.rows()).toHaveCount(before);
  });

  test('eliminar un cliente confirmando la acción @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Eliminación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    // Crear un cliente de prueba exclusivo para este test y buscarlo.
    const suffix = uniqueSuffix();
    const created = await createCliente(page, suffix);
    const clientes = new ClientesPage(page);
    await clientes.goto('/clientes');
    await clientes.search(created.cuit);
    // Esperar a que la fila aparezca antes de continuar.
    await expect(clientes.firstRow()).toBeVisible();

    const modal = await clientes.openDelete();
    await expect(modal).toBeVisible();
    await clientes.confirmDelete(modal);
    await expect(modal).toBeHidden();

    // Re-buscar para verificar que el cliente fue eliminado.
    await clientes.search(created.cuit);
    await expect(clientes.rows()).toHaveCount(0);
  });
});

// --- Helpers solo estan ejecutados, cuando ALLOW_WRITES ---------------------

async function createCliente(page, suffix) {
  const cuit = fakeCuit();
  const name = `Cliente QA ${suffix}`;
  const clientes = new ClientesPage(page);
  await clientes.goto('/clientes/nuevo');
  await expect(clientes.formHeading).toBeVisible();
  await clientes.fillForm({ cuit, name });
  await clientes.save();
  await expect(page).toHaveURL(/\/clientes(\?|$|\/)/);
  return { cuit, name };
}

async function deleteCliente(page, searchTerm) {
  const clientes = new ClientesPage(page);
  await clientes.goto('/clientes');
  await clientes.search(searchTerm);
  if ((await clientes.firstRow().count()) === 0) return;
  const modal = await clientes.openDelete();
  await clientes.confirmDelete(modal);
  await expect(modal).toBeHidden();
}
