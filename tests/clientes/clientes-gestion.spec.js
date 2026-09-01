// Test suite: Gestión de Clientes > Clientes — Buscar / Modificar / Eliminar
//
// Crawled from https://imcoarca.leonardojose.dev
//   List row "Acciones": button[title="Editar"] -> /clientes/{id}/editar (heading "Editar Cliente")
//                        button[title="Eliminar"] -> confirm modal (Cancelar / Confirmar)
//   Search: #search-term + "Buscar"
//
// By default (IMCOARCA_ALLOW_WRITES != 1) the modify test does not persist and the
// delete test only opens the modal and cancels — no real records are changed/removed.
// With IMCOARCA_ALLOW_WRITES=1 a dedicated cliente is created, edited and deleted so
// the run cleans up after itself.
import { test, expect } from '@playwright/test';
import {
  ALLOW_WRITES,
  uniqueSuffix,
  fakeCuit,
  searchList,
  firstRow,
  waitForRows,
  openEdit,
  openDeleteModal,
} from '../../support/helpers/utils.js';

test.describe('Gestión de Clientes > Clientes — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clientes', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Clientes' })).toBeVisible();
  });

  // --- Search -----------------------------------------------------------------

  test('buscar clientes por término y ver resultados @smoke', async ({ page }) => {
    await searchList(page, 'a');
    await expect(page.locator('table')).toBeVisible();
    // The header row is always present; body may or may not have matches.
    await expect(page.getByRole('columnheader', { name: 'CUIT' }).first()).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    await searchList(page, 'zzz-inexistente-' + uniqueSuffix());
    await expect(page.locator('table')).toBeVisible();
  });

  // --- Modify -----------------------------------------------------------------

  test('abrir el formulario de edición de un cliente existente @regression', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay clientes para editar');

    await openEdit(page);
    await expect(page).toHaveURL(/\/clientes\/\d+\/editar/);
    await expect(page.getByRole('heading', { name: 'Editar Cliente' })).toBeVisible();

    // Edit forms come pre-populated.
    await expect(page.locator('#name')).not.toHaveValue('');
    await expect(page.locator('#cuit')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeEnabled();
  });

  test('modificar un cliente y guardar los cambios @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    // Create a throwaway cliente to edit, so we never touch real records.
    const suffix = uniqueSuffix();
    const created = await createCliente(page, suffix);
    await page.goto('/clientes', { waitUntil: 'domcontentloaded' });
    await searchList(page, created.cuit);

    await openEdit(page);
    await expect(page.getByRole('heading', { name: 'Editar Cliente' })).toBeVisible();

    const nuevoNombre = `Cliente QA Editado ${suffix}`;
    await page.locator('#name').fill(nuevoNombre);
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Returns to the list on success.
    await expect(page).toHaveURL(/\/clientes(\?|$|\/)/, { timeout: 20_000 });

    // Cleanup: delete the throwaway cliente.
    await deleteCliente(page, created.cuit);
  });

  // --- Delete -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay clientes para eliminar');

    const before = await page.locator('table tbody tr').count();
    const modal = await openDeleteModal(page);

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    // Cancel — nothing should be deleted.
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator('table tbody tr')).toHaveCount(before);
  });

  test('eliminar un cliente confirmando la acción @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Eliminación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    // Create a throwaway cliente, then delete it via the confirm modal.
    const suffix = uniqueSuffix();
    const created = await createCliente(page, suffix);
    await page.goto('/clientes', { waitUntil: 'domcontentloaded' });
    await searchList(page, created.cuit);
    test.skip((await firstRow(page).count()) === 0, 'No se encontró el cliente recién creado');

    const modal = await openDeleteModal(page);
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirmar' }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });
  });
});

// --- Lifecycle helpers (only exercised when ALLOW_WRITES) ---------------------

async function createCliente(page, suffix) {
  const cuit = fakeCuit();
  const name = `Cliente QA ${suffix}`;
  await page.goto('/clientes/nuevo', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Crear Nuevo Cliente' })).toBeVisible();
  await page.locator('#cuit').fill(cuit);
  await page.locator('#name').fill(name);
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page).toHaveURL(/\/clientes(\?|$|\/)/, { timeout: 20_000 });
  return { cuit, name };
}

async function deleteCliente(page, searchTerm) {
  await page.goto('/clientes', { waitUntil: 'domcontentloaded' });
  await searchList(page, searchTerm);
  if ((await firstRow(page).count()) === 0) return;
  const modal = await openDeleteModal(page);
  await modal.getByRole('button', { name: 'Confirmar' }).click();
  await expect(modal).toBeHidden({ timeout: 20_000 });
}
