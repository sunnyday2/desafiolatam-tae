// Test suite: Inventario > Artículos
import { test, expect } from '@playwright/test';
import { ALLOW_WRITES, uniqueSuffix } from '../../support/helpers/utils.js';
import { ArticulosPage } from '../../pages/articulos.page.js';

test.describe('Inventario > Artículos', () => {
  test.beforeEach(async ({ page }) => {
    await new ArticulosPage(page).goto('/articulos');
  });

  test('el listado de artículos se muestra con sus columnas @smoke', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await expect(articulos.heading).toBeVisible();
    await expect(articulos.createButton).toBeVisible();
    await expect(articulos.table()).toBeVisible();

    // las columnas de la cabecera de la tabla deben estar presentes
    for (const header of ['Código', 'Descripción', 'Stock', 'Precio Venta', 'Estado']) {
      await expect(articulos.columnHeader(header)).toBeVisible();
    }
  });

  test('abrir el formulario de creación de artículo @smoke', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.openCreate();

    await expect(page).toHaveURL(/\/articulos\/nuevo/);
    await expect(articulos.formHeading).toBeVisible();

    await expect(articulos.sku).toBeVisible();
    await expect(articulos.name).toBeVisible();
    await expect(articulos.line).toBeVisible();
    await expect(articulos.category).toBeVisible();
    await expect(articulos.saveButton).toBeVisible();
  });

  test('validación: no permite guardar sin campos obligatorios @regression', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.openCreate();
    await expect(articulos.formHeading).toBeVisible();

    await articulos.save();

    await expect(page).toHaveURL(/\/articulos\/nuevo/);
    await expect(articulos.formHeading).toBeVisible();
  });

  test('completar el formulario de artículo con datos válidos @regression', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.openCreate();
    await expect(articulos.formHeading).toBeVisible();

    const suffix = uniqueSuffix();
    // SKU es numericó (maxímo 14 digitos)
    const skuDigits = `9${suffix}${suffix}`.slice(0, 10);
    const nombre = `Artículo QA ${suffix}`;

    await articulos.fillForm({
      sku: skuDigits,
      name: nombre,
      description: 'Artículo generado por la suite E2E de QA.',
      salePrice: '1500',
      stockQuantity: '10',
    });

    await expect(articulos.sku).not.toHaveValue('');
    await expect(articulos.name).toHaveValue(nombre);
    await expect(articulos.saveButton).toBeEnabled();

    if (ALLOW_WRITES) {
      await articulos.save();
      await expect(page).toHaveURL(/\/articulos(\?|$|\/)/);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Skipped real submit (IMCOARCA_ALLOW_WRITES != 1).',
      });
    }
  });

  test('buscar en el listado de artículos @regression', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await expect(articulos.searchTerm).toBeVisible();
    await articulos.search('a');
    await expect(articulos.table()).toBeVisible();
  });
});
