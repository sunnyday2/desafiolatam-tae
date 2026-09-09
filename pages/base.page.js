import { expect } from '@playwright/test';

export class BasePage {
  constructor(page) {
    this.page = page;
    this.searchTerm = page.locator('#search-term');
    this.startDate = page.locator('#start-date');
    this.endDate = page.locator('#end-date');
    this.searchButton = page.getByRole('button', { name: 'Buscar' }).first();
  }

  async goto(path) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  table() {
    return this.page.locator('table');
  }

  rows() {
    return this.page.locator('table tbody tr');
  }

  firstRow() {
    return this.rows().first();
  }

  columnHeader(name) {
    return this.page.getByRole('columnheader', { name }).first();
  }

  heading(name) {
    return this.page.getByRole('heading', { name });
  }

  async search(term) {
    await this.searchTerm.fill(term);
    await this.searchButton.click();
  }

  async filterByDateRange(start, end) {
    await this.startDate.fill(start);
    await this.endDate.fill(end);
    await this.searchButton.click();
  }

  async openEdit(row = this.firstRow()) {
    await row.locator('button[title="Editar"]').click();
  }

  async openDelete(row = this.firstRow()) {
    await row.locator('button[title="Eliminar"]').click();
    return this.page.getByRole('dialog').or(this.page.locator('.fixed').filter({ hasText: /Eliminar/ }));
  }

  async confirmDelete(modal) {
    await modal.getByRole('button', { name: 'Confirmar' }).click();
  }

  async cancelDelete(modal) {
    await modal.getByRole('button', { name: 'Cancelar' }).click();
  }
}

export async function selectFirstRealOption(select) {
  if (!(await select.count())) return;
  // Esperar a que el select esté visible Y habilitado (puede estar disabled
  // mientras la página carga datos o mientras depende de otro campo).
  await select.waitFor({ state: 'visible' });
  await expect(select).toBeEnabled();
  const options = await select.locator('option').allTextContents();
  const firstReal = options.find((option) => option.trim() && !/selecciona/i.test(option));
  if (firstReal) await select.selectOption({ label: firstReal.trim() });
}
