// helpers para E2E test-suite.

export const ALLOW_WRITES = process.env.IMCOARCA_ALLOW_WRITES === '1';

/** Generar sufjo único para datos de prueba. */
export function uniqueSuffix() {
  const ts = Date.now().toString().slice(-6);
  const rnd = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${ts}${rnd}`;
}

/** generar un CUIT */
export function fakeCuit() {
  const body = String(Math.floor(10000000 + Math.random() * 89999999));
  return `30-${body}-9`;
}

/**
 * Llenar el primer input visible que coincida con un placeholder dentro de un scope.
 * Returna true si un input es encontrado y rellenado.
 */
export async function fillByPlaceholder(scope, placeholder, value) {
  const input = scope.getByPlaceholder(placeholder).first();
  if (await input.count()) {
    await input.fill(value);
    return true;
  }
  return false;
}

/** Ejecutar una búsqueda en una página de lista y esperar a que la tabla se estabilice. */
export async function searchList(page, term) {
  const search = page.locator('#search-term');
  await search.fill(term);
  await page.getByRole('button', { name: 'Buscar' }).first().click();
}

/** Encontrar el localizador para la primera fila de datos de la tabla de lista. */
export function firstRow(page) {
  return page.locator('table tbody tr').first();
}

/** Número de filas de datos actualmente en la tabla de lista. */
export async function rowCount(page) {
  return page.locator('table tbody tr').count();
}

/** Click en "Editar" en una fila específica (por defecto en la primera). */
export async function openEdit(page, row) {
  const target = row ?? firstRow(page);
  await target.locator('button[title="Editar"]').click();
}

/**
 * Click "Eliminar" en una fila y volver a confirmar en un modal.
 */
export async function openDeleteModal(page, row) {
  const target = row ?? firstRow(page);
  await target.locator('button[title="Eliminar"]').click();
  const modal = page.getByRole('dialog').or(page.locator('.fixed').filter({ hasText: /Eliminar/ }));
  return modal;
}
