import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Frozen pre-refactor CSS is a test oracle only; it is never imported by the app.
const legacy = readFileSync(new URL('./fixtures/pre-tailwind.css', import.meta.url), 'utf8')
  .replace(/@import[^;]+;/g, '').replace(/@theme inline\s*\{[^}]+\}/g, '');
const properties = ['display', 'position', 'width', 'height', 'minHeight', 'maxWidth', 'padding', 'margin', 'gap', 'gridTemplateColumns', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'backgroundColor', 'border', 'borderRadius', 'outline', 'outlineOffset', 'stroke', 'strokeWidth', 'fill'];

test('exact breakpoint edges and focused/hovered controls match the previous CSS', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['dark', 'light']) for (const width of [420, 421, 540, 541, 760, 761, 1100, 1101, 1599, 1600]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
    for (const route of ['/', '/projects/new']) {
      await page.goto(route); await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (route === '/projects/new') {
        await expect(page.getByLabel('Project name', { exact: true })).toBeEnabled();
        await page.getByLabel('Project name', { exact: true }).fill(''); await page.getByRole('button', { name: 'Create draft', exact: true }).click();
        await expect(page.locator('.form-error')).toBeVisible();
      } else {
        const action = page.getByRole('link', { name: 'New project', exact: true }); await action.focus(); await action.hover();
      }
      const measure = () => page.locator('aside, header, main, main *, footer').evaluateAll((elements, properties) => elements.map(element => {
        const style = getComputedStyle(element), rect = element.getBoundingClientRect();
        return { tag: element.tagName, size: [rect.width, rect.height], style: Object.fromEntries(properties.map(property => [property, style[property as keyof CSSStyleDeclaration]])) };
      }), properties);
      const current = await measure();
      await page.addStyleTag({ content: legacy });
      const previous = await measure();
      expect(current, `${theme} ${width}px ${route}`).toEqual(previous);
    }
  }
});
