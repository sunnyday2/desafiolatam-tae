// Global setup: log in una vez y mantener la sesión
// cada spec iniciará ya autenticado (via storageState).
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.FRONTEND_BASE_URL || 'https://imcoarca.leonardojose.dev';
const USER = process.env.ADMIN_USER;
const PASS = process.env.ADMIN_PASS;
// Guardar la sesión en la raiz del proyecto .auth/ 
// para que Playwright la use automáticamente en cada spec.
const AUTH_DIR = path.resolve(__dirname, '..', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

export default async function globalSetup() {
  if (!USER || !PASS) {
    throw new Error(
      'No se encontraron las credenciales. Set ADMIN_USER and ADMIN_PASS in the repo root .env file.'
    );
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const launchOptions = {};
  if (process.env.PLAYWRIGHT_CHROMIUM_CHANNEL) {
    launchOptions.channel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL;
  }
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill(USER);
  await page.locator('#password').fill(PASS);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // A successful login redirects to the dashboard.
  await page.waitForURL('**/dashboard');

  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
