// Test suite: Rol Vendedor — acceso y restricciones en la UI

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page.js';
import { ArticulosPage } from '../../pages/articulos.page.js';
import { ClientesPage } from '../../pages/clientes.page.js';
import { CobranzasPage } from '../../pages/cobranzas.page.js';
import { FacturasVentaPage } from '../../pages/facturas-venta.page.js';

const BASE_URL = process.env.FRONTEND_BASE_URL || 'https://imcoarca.leonardojose.dev';
const VENDEDOR_USER = process.env.VENDEDOR_USER;
const VENDEDOR_PASS = process.env.VENDEDOR_PASS;

// Initialize sin la autenticación
// y login como el vendedor para esa prueba.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Rol Vendedor — acceso y restricciones', () => {
  test.beforeEach(async ({ page }) => {
    if (!VENDEDOR_USER || !VENDEDOR_PASS) {
      throw new Error('No se encontraron las credenciales. Set VENDEDOR_USER and VENDEDOR_PASS in el archivo .env.');
    }

    const login = new LoginPage(page);
    await login.open(BASE_URL);
    await login.login(VENDEDOR_USER, VENDEDOR_PASS);
  });

  test('el vendedor puede iniciar sesión y ver el dashboard @smoke', async ({ page }) => {
    const login = new LoginPage(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(login.dashboardHeading).toBeVisible();
  });

  test('el vendedor puede acceder al listado de Clientes @smoke', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.goto('/clientes');
    await expect(clientes.heading).toBeVisible();
  });

  test('el vendedor puede crear clientes (tiene permiso clientes.create) @regression', async ({ page }) => {
    const clientes = new ClientesPage(page);
    await clientes.goto('/clientes');
    // El botón "Crear Cliente" esta habilitado para ese rol.
    await expect(clientes.createButton).toBeVisible();

    await clientes.goto('/clientes/nuevo');
    await expect(clientes.formHeading).toBeVisible();
  });

  test('el vendedor puede acceder al listado de Artículos @smoke', async ({ page }) => {
    const articulos = new ArticulosPage(page);
    await articulos.goto('/articulos');
    await expect(articulos.heading).toBeVisible();
    await expect(articulos.createButton).toBeVisible();
  });

  test('el vendedor puede acceder al listado de Facturas de Venta @regression', async ({ page }) => {
    const facturas = new FacturasVentaPage(page);
    await facturas.goto('/facturas-de-venta');
    await expect(facturas.listHeading).toBeVisible();
    // El rol tiene permiso facturas.create — la acción de creación está presente.
    await expect(facturas.createButton).toBeVisible();
  });

  test('el vendedor NO puede acceder a Cobranzas (Acceso Denegado) @smoke', async ({ page }) => {
    const cobranzas = new CobranzasPage(page);
    const login = new LoginPage(page);
    await cobranzas.goto('/cobranzas');
    // el rol faltan permisos cobranzas.*, y la app bloquea la ruta.
    await expect(login.accessDeniedHeading).toBeVisible();
    await expect(cobranzas.listHeading).toHaveCount(0);
  });
});
