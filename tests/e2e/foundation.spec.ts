import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('workspace routes navigate and show honest empty states', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your space. Your furniture.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'New project', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL('/projects');
  await expect(page.getByRole('link', { name: 'Projects', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('There are no saved projects here yet.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Orders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nothing on its way just yet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to your workspace' }).click();
  await expect(page).toHaveURL('/');
  expect(errors).toEqual([]);
});

test('theme switch persists after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('keyboard skip link reaches main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('health route returns no secrets and security headers', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: 'ok', application: 'cutplan-studio' });
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
});

test('missing page offers a route back', async ({ page }) => {
  const response = await page.goto('/missing-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page is not here.' })).toBeVisible();
  await page.getByRole('link', { name: 'Go to workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Your space. Your furniture.' })).toBeVisible();
});

test('desktop phone tablet and light views fit and produce review evidence', async ({ page }) => {
  await mkdir('artifacts/review', { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [name, width, height] of [['desktop', 1440, 1080], ['mobile', 390, 844], ['tablet', 768, 1024]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
    await page.screenshot({ path: `artifacts/review/${name}.png`, fullPage: true, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.screenshot({ path: 'artifacts/review/desktop-light.png', fullPage: true, animations: 'disabled' });
});
