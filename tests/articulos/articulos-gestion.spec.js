// Test suite: Inventario > Artículos — Buscar / Modificar / Eliminar

import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix } from '../../support/helpers/utils.js';
import { ArticulosPage } from '../../pages/articulos.page.js';

test.describe('Inventario > Artículos — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.goto('/articulos');
    await expect(articulos.heading).toBeVisible();
  });

  // --- Busqueda -----------------------------------------------------------------

  test('buscar artículos por término y ver resultados @smoke', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.search('a');
    await expect(articulos.table()).toBeVisible();
    await expect(articulos.columnHeader('Código')).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.search('zzz-inexistente-' + uniqueSuffix());
    await expect(articulos.table()).toBeVisible();
  });

  // --- Actualización -----------------------------------------------------------------

  test('abrir el formulario de edición de un artículo existente @regression', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.openEdit();
    await expect(page).toHaveURL(/\/articulos\/\d+\/editar/);
    await expect(articulos.editHeading).toBeVisible();

    await expect(articulos.name).not.toHaveValue('');
    await expect(articulos.sku).not.toHaveValue('');
    await expect(articulos.saveButton).toBeEnabled();
  });

  test('modificar un artículo y guardar los cambios @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const suffix = uniqueSuffix();
    const created = await createArticulo(page, suffix);
    const articulos = new ArticulosPage(page);
    await articulos.goto('/articulos');
    await articulos.search(created.name);

    await articulos.openEdit();
    await expect(articulos.editHeading).toBeVisible();

    await articulos.name.fill(`Artículo QA Editado ${suffix}`);
    await articulos.save();
    await expect(page).toHaveURL(/\/articulos(\?|$|\/)/);

    await deleteArticulo(page, `Artículo QA Editado ${suffix}`);
  });

  // --- Eliminación -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    // Esperar a que la tabla cargue antes de capturar el conteo inicial
    await expect(articulos.table()).toBeVisible();
    await expect(articulos.firstRow()).toBeVisible();
    const before = await articulos.rows().count();
    const modal = await articulos.openDelete();

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    await articulos.cancelDelete(modal);
    await expect(modal).toBeHidden();
    await expect(articulos.rows()).toHaveCount(before);
  });

  test('eliminar un artículo confirmando la acción @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Eliminación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const suffix = uniqueSuffix();
    const created = await createArticulo(page, suffix);
    const articulos = new ArticulosPage(page);
    await articulos.goto('/articulos');
    await articulos.search(created.name);
    // Esperar a que la fila aparezca antes de continuar.
    await expect(articulos.firstRow()).toBeVisible();

    const modal = await articulos.openDelete();
    await expect(modal).toBeVisible();
    await articulos.confirmDelete(modal);
    await expect(modal).toBeHidden();

    // Re-buscar para verificar que el artículo fue eliminado.
    await articulos.search(created.name);
    await expect(articulos.rows()).toHaveCount(0);
  });
});

// --- Lifecycle helpers (only exercised when ALLOW_WRITES) ---------------------

async function createArticulo(page, suffix) {
  const name = `Artículo QA ${suffix}`;
  const articulos = new ArticulosPage(page);
  await articulos.goto('/articulos/nuevo');
  await expect(articulos.formHeading).toBeVisible();
  await articulos.fillForm({ sku: `9${suffix}${suffix}`.slice(0, 10), name });
  await articulos.save();
  await expect(page).toHaveURL(/\/articulos(\?|$|\/)/);
  return { name };
}

async function deleteArticulo(page, searchTerm) {
  const articulos = new ArticulosPage(page);
  await articulos.goto('/articulos');
  await articulos.search(searchTerm);
  if ((await articulos.firstRow().count()) === 0) return;
  const modal = await articulos.openDelete();
  await articulos.confirmDelete(modal);
  await expect(modal).toBeHidden();
}

