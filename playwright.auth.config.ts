import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/auth-contract', fullyParallel: false, workers: 1, retries: 0,
  timeout: 60_000, expect: { timeout: 15_000 },
  reporter: [['list']], outputDir: 'artifacts/auth-contract-results',
  use: { baseURL: 'http://127.0.0.1:3101', channel: 'chrome', viewport: { width: 1440, height: 1080 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/auth-contract-server.mjs', url: 'http://127.0.0.1:3101/api/health', reuseExistingServer: false, timeout: 120_000 }
});
