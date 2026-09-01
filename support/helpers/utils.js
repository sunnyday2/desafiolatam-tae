// Shared helpers for the IMCOARCA E2E suite.

/**
 * Whether tests are allowed to actually submit/persist records to the live ERP.
 * Off by default to avoid polluting production data. Enable with
 * IMCOARCA_ALLOW_WRITES=1 in the environment.
 */
export const ALLOW_WRITES = process.env.IMCOARCA_ALLOW_WRITES === '1';

/** Generate a short unique suffix for test data. */
export function uniqueSuffix() {
  const ts = Date.now().toString().slice(-6);
  const rnd = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${ts}${rnd}`;
}

/** Build a syntactically valid CUIT-like string (not necessarily a real CUIT). */
export function fakeCuit() {
  const body = String(Math.floor(10000000 + Math.random() * 89999999));
  return `30-${body}-9`;
}

/**
 * Fill the first visible input matching a placeholder within a scope.
 * Returns true if an input was found and filled.
 */
export async function fillByPlaceholder(scope, placeholder, value) {
  const input = scope.getByPlaceholder(placeholder).first();
  if (await input.count()) {
    await input.fill(value);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// List / row-action helpers
//
// Every list in the ERP shares the same structure:
//   - a search box  #search-term  + a "Buscar" button
//   - a table whose last "Acciones" column holds two icon buttons per row:
//       button[title="Editar"]   -> navigates to /{resource}/{id}/editar
//       button[title="Eliminar"] -> opens a confirm modal
//         ("Cancelar" / "Confirmar")
// ---------------------------------------------------------------------------

/** Run a search on a list page and wait for the table to settle. */
export async function searchList(page, term) {
  const search = page.locator('#search-term');
  await search.fill(term);
  await page.getByRole('button', { name: 'Buscar' }).first().click();
  // Give the table a moment to re-render with filtered results.
  await page.waitForTimeout(1000);
}

/** Locator for the first data row of the list table. */
export function firstRow(page) {
  return page.locator('table tbody tr').first();
}

/** Number of data rows currently in the list table. */
export async function rowCount(page) {
  return page.locator('table tbody tr').count();
}

/**
 * Wait for the list table to finish loading its rows.
 * Returns the number of data rows found (0 if the list is genuinely empty).
 * Tables load their rows asynchronously, so an immediate count can be 0
 * even when the list has data — this waits briefly for rows to appear.
 */
export async function waitForRows(page, timeout = 8000) {
  try {
    await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout });
  } catch {
    // No rows appeared within the timeout — treat as an empty list.
  }
  return page.locator('table tbody tr').count();
}

/** Click "Editar" on a given row (defaults to the first). */
export async function openEdit(page, row) {
  const target = row ?? firstRow(page);
  await target.locator('button[title="Editar"]').click();
}

/**
 * Click "Eliminar" on a row and return the confirm modal locator.
 * Does NOT confirm — the caller decides whether to Cancelar or Confirmar.
 */
export async function openDeleteModal(page, row) {
  const target = row ?? firstRow(page);
  await target.locator('button[title="Eliminar"]').click();
  const modal = page.getByRole('dialog').or(page.locator('.fixed').filter({ hasText: /Eliminar/ }));
  return modal;
}
