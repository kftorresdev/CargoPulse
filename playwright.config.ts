import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for CargoPulse Monorepo
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:dev --prefix apps/api',
      url: 'http://localhost:3000/api/docs',
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npm start --prefix apps/web',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
