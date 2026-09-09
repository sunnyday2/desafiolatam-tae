import { BasePage, selectFirstRealOption } from './base.page.js';

export class ArticulosPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Listado de Artículos' });
    this.createButton = page.getByRole('button', { name: 'Crear Artículo' });
    this.formHeading = page.getByRole('heading', { name: 'Crear Nuevo Artículo' });
    this.editHeading = page.getByRole('heading', { name: 'Editar Artículo' });
    this.sku = page.locator('#sku');
    this.name = page.locator('#name');
    this.description = page.locator('#description');
    this.line = page.locator('#line');
    this.category = page.locator('#category');
    this.salePrice = page.locator('#sale_price');
    this.stockQuantity = page.locator('#stock_quantity');
    this.saveButton = page.getByRole('button', { name: 'Guardar Cambios' });
  }

  async openCreate() {
    await this.createButton.click();
  }

  async fillForm({ sku, name, description, salePrice, stockQuantity }) {
    await this.sku.fill(sku);
    await this.name.fill(name);
    if (await this.description.count() && description !== undefined) await this.description.fill(description);
    await selectFirstRealOption(this.line);
    await selectFirstRealOption(this.category);
    if (await this.salePrice.count() && salePrice !== undefined) await this.salePrice.fill(salePrice);
    if (await this.stockQuantity.count() && stockQuantity !== undefined) await this.stockQuantity.fill(stockQuantity);
  }

  async save() {
    await this.saveButton.click();
  }
}
