// Playwright configuration for the IMCOARCA E2E suite (proyecto final).
// JavaScript only, no Allure — uses the built-in HTML reporter.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load credentials from the repository root .env (two levels up:
// tests/e2e-proyecto-final -> tests -> repo root).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = process.env.IMCOARCA_BASE_URL || 'https://imcoarca.leonardojose.dev';

export default defineConfig({
  testDir: './tests',
  // Logs in once and stores the authenticated session (see use.storageState).
  globalSetup: './support/global-setup.js',

  timeout: 60_000,
  expect: { timeout: 15_000 },

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Reuse the logged-in session captured during global setup.
    storageState: '.auth/user.json',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
