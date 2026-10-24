import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['list']],
  outputDir: 'artifacts/test-results',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: 'chrome',
    viewport: { width: 1440, height: 1080 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    env: { AUTH_GOOGLE_ENABLED: 'false', AUTH_EMAIL_OTP_ENABLED: 'false' },
    url: 'http://127.0.0.1:3100/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
