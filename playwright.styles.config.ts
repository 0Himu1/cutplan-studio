import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/style-regression',
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: 'artifacts/style-test-results',
  use: { baseURL: 'http://127.0.0.1:3101', channel: 'chrome', screenshot: 'only-on-failure' },
  webServer: {
    command: 'node scripts/auth-contract-server.mjs',
    url: 'http://127.0.0.1:3101/api/health',
    timeout: 180_000,
    reuseExistingServer: false,
    env: { CONTRACT_GOOGLE: 'true' }
  }
});
