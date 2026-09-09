import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class CobranzasPage extends BasePage {
  constructor(page) {
    super(page);
    this.listHeading = page.getByRole('heading', { name: 'Listado de Cobranzas' });
    this.createButton = page.getByRole('button', { name: 'Crear Cobranza' });
    this.formHeading = page.getByRole('heading', { name: 'Crear Cobranza' });
    this.editHeading = page.getByRole('heading', { name: 'Editar Cobranza' });
    this.collectionDate = page.locator('#collection_date');
    this.customerCode = page.getByPlaceholder('Código...').first();
    this.saveButton = page.getByRole('button', { name: 'Guardar Cobranza' });
    this.addPaymentButton = page.getByRole('button', { name: 'Añadir Medio' });
  }

  async openCreate() {
    await this.createButton.click();
  }

  async selectCustomer(code) {
    if (!(await this.customerCode.count())) return;
    await this.customerCode.click();
    await this.customerCode.fill(code);
    // El buscador de cliente abre un modal con tabla de resultados al hacer click en "Buscar".
    const customerSearchButton = this.page.locator('main').getByRole('button', { name: 'Buscar' }).first();
    await customerSearchButton.click();
    // Esperar a que aparezca el modal "Buscar Cliente" y hacer click en la primera celda de datos.
    const firstCell = this.page.locator('[aria-modal="true"] table tbody tr').first().locator('td').first();
    await firstCell.click();
    // Esperar a que el modal se cierre usando assertion con timeout global.
    await expect(this.page.locator('[aria-modal="true"]')).toBeHidden();
  }

  async addPaymentMethod() {
    await this.addPaymentButton.click();
  }

  async save() {
    await this.saveButton.click();
  }
}
