import { BasePage, selectFirstRealOption } from './base.page.js';

export class ClientesPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Listado de Clientes' });
    this.createButton = page.getByRole('button', { name: 'Crear Cliente' });
    this.formHeading = page.getByRole('heading', { name: 'Crear Nuevo Cliente' });
    this.editHeading = page.getByRole('heading', { name: 'Editar Cliente' });
    this.cuit = page.locator('#cuit');
    this.name = page.locator('#name');
    this.email = page.locator('#email');
    this.phone = page.locator('#phone');
    this.tax = page.locator('#tax');
    this.saveButton = page.getByRole('button', { name: 'Guardar Cambios' });
  }

  async openCreate() {
    await this.createButton.click();
  }

  async fillForm({ cuit, name, email, phone }) {
    await this.cuit.fill(cuit);
    await this.name.fill(name);
    if (await this.email.count() && email !== undefined) await this.email.fill(email);
    if (await this.phone.count() && phone !== undefined) await this.phone.fill(phone);
    await selectFirstRealOption(this.tax);
  }

  async save() {
    await this.saveButton.click();
  }
}
