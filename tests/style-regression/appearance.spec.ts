import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const draft = { id: 'a1111111-1111-4111-8111-111111111111', name: 'Hallway storage', furnitureType: 'cabinet', createdAt: '2026-10-21T10:00:00.000Z', updatedAt: '2026-10-21T10:00:00.000Z', version: 1 };
const output = `artifacts/tailwind/${process.env.STYLE_CAPTURE === 'before' ? 'before' : 'after'}`;

for (const width of [390, 900, 1440]) for (const theme of ['dark', 'light']) {
  test(`appearance ${width} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    await page.addInitScript(({ theme }) => { localStorage.setItem('theme', theme); }, { theme });
    const prefix = `${width}-${theme}`;
    await mkdir(output, { recursive: true });
    async function capture(name: string) {
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `${output}/${prefix}-${name}.png`, fullPage: true, animations: 'disabled', caret: 'hide' });
      const metrics = await page.locator('main, aside, header, footer, main *, dialog, dialog *').evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element), rect = element.getBoundingClientRect();
        return { tag: element.tagName, hook: element.getAttribute('class')?.split(' ')[0], box: [rect.x, rect.y, rect.width, rect.height], color: style.color, background: style.backgroundColor, border: style.border, radius: style.borderRadius, font: style.font, padding: style.padding, margin: style.margin, display: style.display, gap: style.gap, outline: style.outline, stroke: style.stroke, fill: style.fill };
      }));
      await writeFile(`${output}/${prefix}-${name}.json`, JSON.stringify(metrics, null, 2));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    }
    await page.goto('/'); await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.getByText('Create your first project to start a browser draft.')).toBeVisible(); await capture('home');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(page.getByRole('button', { name: 'Sign in with Google', exact: true })).toBeEnabled(); await capture('auth-dialog');
    await page.keyboard.press('Escape');
    await page.goto('/projects'); await expect(page.getByText('A fresh start.')).toBeVisible(); await capture('empty-projects');
    await page.goto('/orders'); await capture('orders');
    await page.goto('/projects/new'); await expect(page.getByLabel('Project name', { exact: true })).toBeEnabled(); await capture('new');
    await page.getByLabel('Project name', { exact: true }).fill(''); await page.getByRole('button', { name: 'Create draft', exact: true }).click(); await expect(page.locator('.form-error[role=alert]')).toBeVisible(); await capture('validation');
    await page.evaluate(draft => localStorage.setItem('cutplan.guest-drafts.v1', JSON.stringify({ schemaVersion: 1, projects: [draft] })), draft);
    await page.goto('/projects'); await expect(page.getByRole('heading', { name: draft.name, exact: true })).toBeVisible(); await capture('projects');
    await page.getByRole('button', { name: `Rename ${draft.name}`, exact: true }).click(); await capture('rename');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.getByRole('button', { name: `Delete ${draft.name}`, exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await capture('delete'); await page.keyboard.press('Escape');
    await page.goto(`/projects/${draft.id}`); await expect(page.getByRole('heading', { name: draft.name, exact: true })).toBeVisible(); await capture('detail');
    await page.goto('/login?authError=canceled&returnTo=%2Fprojects'); await expect(page.locator('.form-error[role=alert]')).toBeVisible(); await expect(page.getByRole('button', { name: 'Sign in with Google', exact: true })).toBeEnabled(); await capture('login-error');
    await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click(); await page.getByRole('link', { name: 'Allow contract sign-in' }).click();
    await page.getByRole('link', { name: 'My account', exact: true }).click(); await expect(page.getByLabel('Display name', { exact: true })).toBeVisible(); await capture('account');
    await page.getByRole('button', { name: 'Sign out of this browser' }).click(); await expect(page).toHaveURL('/projects');
    await page.evaluate(() => localStorage.setItem('cutplan.guest-drafts.v1', '{invalid'));
    await page.reload(); await expect(page.getByRole('region', { name: 'Browser draft recovery' })).toBeVisible(); await capture('recovery');
  });
}

