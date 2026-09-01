// Global setup: log in once with the test account and persist the session
// so every spec starts already authenticated (via storageState).
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// From tests/e2e-proyecto-final/support -> repo root is three levels up.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const BASE_URL = process.env.IMCOARCA_BASE_URL || 'https://imcoarca.leonardojose.dev';
const USER = process.env.IMCOARCA_USER;
const PASS = process.env.IMCOARCA_PASS;
// Store the session under the project root .auth/ so it matches the
// storageState path in playwright.config.js.
const AUTH_DIR = path.resolve(__dirname, '..', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

export default async function globalSetup() {
  if (!USER || !PASS) {
    throw new Error(
      'Missing credentials. Set IMCOARCA_USER and IMCOARCA_PASS in the repo root .env file.'
    );
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill(USER);
  await page.locator('#password').fill(PASS);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // A successful login redirects to the dashboard.
  await page.waitForURL('**/dashboard', { timeout: 30_000 });

  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
