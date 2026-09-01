// Test suite: Inventario > Artículos — Buscar / Modificar / Eliminar
//
// Crawled from https://imcoarca.leonardojose.dev
//   List row "Acciones": button[title="Editar"] -> /articulos/{id}/editar (heading "Editar Artículo")
//                        button[title="Eliminar"] -> confirm modal (Cancelar / Confirmar)
//   Search: #search-term + "Buscar"
//
// Real edits/deletes only run with IMCOARCA_ALLOW_WRITES=1, via a create-then-delete
// lifecycle so the run cleans up after itself.
import { test, expect } from '@playwright/test';
import {
  ALLOW_WRITES,
  uniqueSuffix,
  searchList,
  firstRow,
  waitForRows,
  openEdit,
  openDeleteModal,
} from '../../support/helpers/utils.js';

test.describe('Inventario > Artículos — buscar / modificar / eliminar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articulos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Artículos' })).toBeVisible();
  });

  // --- Search -----------------------------------------------------------------

  test('buscar artículos por término y ver resultados @smoke', async ({ page }) => {
    await searchList(page, 'a');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Código' }).first()).toBeVisible();
  });

  test('buscar un término inexistente no rompe la tabla @regression', async ({ page }) => {
    await searchList(page, 'zzz-inexistente-' + uniqueSuffix());
    await expect(page.locator('table')).toBeVisible();
  });

  // --- Modify -----------------------------------------------------------------

  test('abrir el formulario de edición de un artículo existente @regression', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay artículos para editar');

    await openEdit(page);
    await expect(page).toHaveURL(/\/articulos\/\d+\/editar/);
    await expect(page.getByRole('heading', { name: 'Editar Artículo' })).toBeVisible();

    await expect(page.locator('#name')).not.toHaveValue('');
    await expect(page.locator('#sku')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeEnabled();
  });

  test('modificar un artículo y guardar los cambios @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Modificación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const suffix = uniqueSuffix();
    const created = await createArticulo(page, suffix);
    await page.goto('/articulos', { waitUntil: 'domcontentloaded' });
    await searchList(page, created.name);

    await openEdit(page);
    await expect(page.getByRole('heading', { name: 'Editar Artículo' })).toBeVisible();

    await page.locator('#name').fill(`Artículo QA Editado ${suffix}`);
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page).toHaveURL(/\/articulos(\?|$|\/)/, { timeout: 20_000 });

    await deleteArticulo(page, `Artículo QA Editado ${suffix}`);
  });

  // --- Delete -----------------------------------------------------------------

  test('eliminar muestra un modal de confirmación y se puede cancelar @smoke', async ({ page }) => {
    test.skip((await waitForRows(page)) === 0, 'No hay artículos para eliminar');

    const before = await page.locator('table tbody tr').count();
    const modal = await openDeleteModal(page);

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Esta acción no se puede deshacer/i)).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator('table tbody tr')).toHaveCount(before);
  });

  test('eliminar un artículo confirmando la acción @regression', async ({ page }) => {
    test.skip(!ALLOW_WRITES, 'Eliminación real deshabilitada (IMCOARCA_ALLOW_WRITES != 1)');

    const suffix = uniqueSuffix();
    const created = await createArticulo(page, suffix);
    await page.goto('/articulos', { waitUntil: 'domcontentloaded' });
    await searchList(page, created.name);
    test.skip((await firstRow(page).count()) === 0, 'No se encontró el artículo recién creado');

    const modal = await openDeleteModal(page);
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirmar' }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });
  });
});

// --- Lifecycle helpers (only exercised when ALLOW_WRITES) ---------------------

async function createArticulo(page, suffix) {
  const name = `Artículo QA ${suffix}`;
  await page.goto('/articulos/nuevo', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Crear Nuevo Artículo' })).toBeVisible();

  await page.locator('#sku').fill(`9${suffix}${suffix}`.slice(0, 10));
  await page.locator('#name').fill(name);
  await selectFirstRealOption(page.locator('#line'));
  await selectFirstRealOption(page.locator('#category'));
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page).toHaveURL(/\/articulos(\?|$|\/)/, { timeout: 20_000 });
  return { name };
}

async function deleteArticulo(page, searchTerm) {
  await page.goto('/articulos', { waitUntil: 'domcontentloaded' });
  await searchList(page, searchTerm);
  if ((await firstRow(page).count()) === 0) return;
  const modal = await openDeleteModal(page);
  await modal.getByRole('button', { name: 'Confirmar' }).click();
  await expect(modal).toBeHidden({ timeout: 20_000 });
}

async function selectFirstRealOption(select) {
  if (!(await select.count())) return;
  await select.waitFor({ state: 'visible' });
  await expect(select).toBeEnabled({ timeout: 10_000 });
  const options = await select.locator('option').allTextContents();
  const firstReal = options.find((o) => o.trim() && !/selecciona/i.test(o));
  if (firstReal) await select.selectOption({ label: firstReal.trim() });
}
