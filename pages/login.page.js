export class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = page.locator('#email');
    this.password = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: 'Ingresar' });
    this.dashboardHeading = page.getByRole('heading', { name: 'Dashboard' });
    this.accessDeniedHeading = page.getByRole('heading', { name: 'Acceso Denegado' });
  }

  async open(baseUrl) {
    await this.page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  }

  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL('**/dashboard');
  }
}
