// Test suite: Rol Vendedor — acceso y restricciones en la UI
//
// The "vendedor" (sales-rep) role has a narrower permission set than the admin.
// Crawled login permissions for vendedor@testing.com:
//   - clientes: view / create / edit   (NO delete)
//   - productos: view / create / edit / delete
//   - facturas:  view / create         (NO edit / delete)
//   - dashboard, leads, remitos, pedidos, etc.
//   - NO cobranzas permission  -> /cobranzas shows "Acceso Denegado"
//
// These UI tests log in as the vendedor (NOT the shared admin session) and verify
// what the role can reach and what it is blocked from.
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.IMCOARCA_BASE_URL || 'https://imcoarca.leonardojose.dev';
const VENDEDOR_USER = process.env.IMCOARCA_VENDEDOR_USER || 'vendedor@testing.com';
const VENDEDOR_PASS = process.env.IMCOARCA_VENDEDOR_PASS || 'Tae@2026';

// Do not reuse the admin storageState for this file — start unauthenticated
// and log in as the vendedor within the suite.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Rol Vendedor — acceso y restricciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill(VENDEDOR_USER);
    await page.locator('#password').fill(VENDEDOR_PASS);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
  });

  test('el vendedor puede iniciar sesión y ver el dashboard @smoke', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('el vendedor puede acceder al listado de Clientes @smoke', async ({ page }) => {
    await page.goto(`${BASE_URL}/clientes`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Clientes' })).toBeVisible();
  });

  test('el vendedor puede crear clientes (tiene permiso clientes.create) @regression', async ({ page }) => {
    await page.goto(`${BASE_URL}/clientes`, { waitUntil: 'domcontentloaded' });
    // The "Crear Cliente" action is available for this role.
    await expect(page.getByRole('button', { name: 'Crear Cliente' })).toBeVisible();

    await page.goto(`${BASE_URL}/clientes/nuevo`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Cliente' })).toBeVisible();
  });

  test('el vendedor puede acceder al listado de Artículos @smoke', async ({ page }) => {
    await page.goto(`${BASE_URL}/articulos`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Artículos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear Artículo' })).toBeVisible();
  });

  test('el vendedor puede acceder al listado de Facturas de Venta @regression', async ({ page }) => {
    await page.goto(`${BASE_URL}/facturas-de-venta`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Listado de Facturas de Venta' })).toBeVisible();
    // Has facturas.create — the create action is present.
    await expect(page.getByRole('button', { name: 'Crear Factura de Venta' })).toBeVisible();
  });

  test('el vendedor NO puede acceder a Cobranzas (Acceso Denegado) @smoke', async ({ page }) => {
    await page.goto(`${BASE_URL}/cobranzas`, { waitUntil: 'domcontentloaded' });
    // The role lacks cobranzas.* permissions, so the app blocks the route.
    await expect(page.getByRole('heading', { name: 'Acceso Denegado' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listado de Cobranzas' })).toHaveCount(0);
  });
});
