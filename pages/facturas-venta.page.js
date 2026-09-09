import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export class FacturasVentaPage extends BasePage {
  constructor(page) {
    super(page);
    this.listHeading = page.getByRole('heading', { name: 'Listado de Facturas de Venta' });
    this.createButton = page.getByRole('button', { name: 'Crear Factura de Venta' });
    this.formHeading = page.getByRole('heading', { name: 'Crear Factura de Venta' });
    this.editHeading = page.getByRole('heading', { name: /Editando Factura/i });
    this.series = page.locator('select[name="series"]');
    this.invoiceDate = page.locator('input[name="invoice_date"]');
    // El formulario tiene múltiples "Código..." (Pedido Origen, Cliente, Vendedor...).
    // Apuntar al campo "Código..." dentro del grupo que tiene el label "Cliente (*)".
    this.customerCode = page.locator('text=Cliente (*)').locator('..').getByPlaceholder('Código...');
    this.customerName = page.locator('text=Cliente (*)').locator('..').getByPlaceholder('Nombre...');
    this.notes = page.locator('textarea[name="notes"]');
    this.addItemButton = page.getByRole('button', { name: 'Agregar Ítem' });
    this.saveButton = page.getByRole('button', { name: 'Guardar Factura' });
  }

  async openCreate() {
    await this.createButton.click();
  }

  async selectCustomer(code) {
    if (!(await this.customerCode.count())) return;
    await this.customerCode.click();
    await this.customerCode.fill(code);
    // El buscador de cliente abre un modal con tabla de resultados al hacer click en "Buscar".
    // Usar el botón "Buscar" dentro del mismo grupo del campo Cliente (*).
    const customerSearchButton = this.page.locator('text=Cliente (*)').locator('..').getByRole('button', { name: 'Buscar' });
    await customerSearchButton.click();
    // Esperar a que aparezca el modal y hacer click en la primera celda de datos.
    const firstCell = this.page.locator('[aria-modal="true"] table tbody tr').first().locator('td').first();
    await firstCell.click();
    // Esperar a que el modal se cierre usando assertion con timeout global.
    await expect(this.page.locator('[aria-modal="true"]')).toBeHidden();
  }

  async addItem() {
    // Seleccionar la primera dirección de entrega disponible (campo requerido *).
    const deliveryAddress = this.page.locator('select').filter({ hasText: /Selecciona una dirección/ });
    if (await deliveryAddress.count()) {
      const options = await deliveryAddress.locator('option').allTextContents();
      const firstReal = options.find((o) => o.trim() && !/selecciona/i.test(o) && !/Ingresar Otra/i.test(o));
      if (firstReal) await deliveryAddress.selectOption({ label: firstReal.trim() });
    }
    await this.addItemButton.click();
    // Después de agregar el ítem, seleccionar el primer artículo disponible via modal.
    const itemRow = this.page.locator('table tbody tr').last();
    const itemSearchButton = itemRow.getByRole('button', { name: 'Buscar' });
    await itemSearchButton.click();
    const firstCell = this.page.locator('[aria-modal="true"] table tbody tr').first().locator('td').first();
    await firstCell.click();
    await expect(this.page.locator('[aria-modal="true"]')).toBeHidden();
  }

  async save() {
    await this.saveButton.click();
  }
}
