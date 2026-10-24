import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const key = 'cutplan.guest-drafts.v1';
async function create(page: Page, name: string, type = 'cabinet') {
  await page.goto(`/projects/new?type=${type}`);
  await page.getByLabel('Project name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();
  await expect(page.getByText('Saved on this browser', { exact: true })).toBeVisible();
}

async function openProjectTools(page:Page){if(await page.locator('.cad-workspace').count()&&!await page.locator('.cad-dialog:modal').count())await page.getByRole('button',{name:'Project and history',exact:true}).click();}

test('create reopen rename refresh cancel delete and confirmed delete', async ({ page }) => {
  await create(page, 'Hallway shoe rack', 'shoe_rack');
  const url = page.url();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hallway shoe rack', exact: true })).toBeVisible();
  await openProjectTools(page);
  await page.getByRole('button', { name: 'Rename Hallway shoe rack', exact: true }).click();
  await expect(page.getByLabel('Project name', { exact: true })).toBeFocused();
  await page.getByLabel('Project name', { exact: true }).fill('Entryway storage');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByRole('heading', { name: 'Entryway storage', exact: true })).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: 'Open Entryway storage' }).click();
  await expect(page).toHaveURL(url);
  await openProjectTools(page);
  await page.getByRole('button', { name: 'Delete Entryway storage', exact: true }).click();
  await expect(page.getByRole('dialog',{name:'Delete this draft?',exact:true})).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'Delete this draft?',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete Entryway storage', exact: true })).toBeFocused();
  await openProjectTools(page);
  await page.getByRole('button', { name: 'Delete Entryway storage', exact: true }).click();
  await page.getByRole('button', { name: 'Delete draft', exact: true }).click();
  await expect(page).toHaveURL('/projects');
  await expect(page.getByRole('link', { name: 'Open Entryway storage' })).toHaveCount(0);
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'This draft is not on this browser.' })).toBeVisible();
});

for (const [type, label] of [['cabinet', 'Cabinet'], ['shoe_rack', 'Shoe rack'], ['bookshelf', 'Bookshelf'], ['table', 'Table']]) {
  test(`${label} can be selected and its draft persists`, async ({ page }) => {
    await page.goto('/projects/new');
    await page.getByRole('radio', { name: new RegExp(`^${label}`) }).check();
    await page.getByLabel('Project name', { exact: true }).fill(`My ${label}`);
    await page.getByRole('button', { name: 'Create draft' }).click();
    await expect(page.getByRole('heading', { name: `My ${label}`, exact: true })).toBeVisible();
    const data = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)!), key);
    expect(data.projects[0].furnitureType).toBe(type);
    await page.goto('/projects');
    await page.reload();
    await expect(page.getByRole('link', { name: `Open My ${label}` })).toBeVisible();
  });
}

test('invalid names and canceled creation do not create records', async ({ page }) => {
  await page.goto('/projects/new');
  await page.getByLabel('Project name', { exact: true }).fill('   ');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.locator('.form-error[role=alert]')).toHaveText('Enter a project name.');
  await expect(page.getByLabel('Project name', { exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBeNull();
});

test('write failure preserves form values and never claims a saved draft', async ({ page }) => {
  await page.addInitScript(storageKey => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (name === storageKey) throw new DOMException('Full', 'QuotaExceededError'); original.call(this, name, value); };
  }, key);
  await page.goto('/projects/new');
  await page.getByLabel('Project name', { exact: true }).fill('Keep this name');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('could not save');
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue('Keep this name');
  expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBeNull();
});

test('blocked browser storage shows a recoverable state instead of crashing', async ({ page }) => {
  await page.addInitScript(storageKey => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (name) { if (name === storageKey) throw new DOMException('Blocked', 'SecurityError'); return original.call(this, name); };
  }, key);
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Browser storage is unavailable.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New project' })).toBeDisabled();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Browser storage is unavailable.' })).toBeVisible();
});

test('corrupt data is preserved downloadable and reset only after confirmation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(storageKey => localStorage.setItem(storageKey, '{corrupt original'), key);
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Your saved drafts could not be read.' })).toBeVisible();
  const downloadWait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery copy' }).click();
  const download = await downloadWait;
  expect(await readFile((await download.path())!, 'utf8')).toBe('{corrupt original');
  await page.getByRole('button', { name: 'Reset browser drafts', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBe('{corrupt original');
  await page.getByRole('button', { name: 'Reset browser drafts', exact: true }).click();
  await page.getByRole('button', { name: 'Reset drafts', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A fresh start.' })).toBeVisible();
  expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBeNull();
});

test('a future schema cannot be silently overwritten by the new-project form', async ({ page }) => {
  const original = JSON.stringify({ schemaVersion: 5, projects: [{ future: true }] });
  await page.goto('/');
  await page.evaluate(({ storageKey, raw }) => localStorage.setItem(storageKey, raw), { storageKey: key, raw: original });
  await page.goto('/projects/new');
  await expect(page.getByRole('heading', { name: 'These drafts need a newer version of the app.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create draft' })).toBeDisabled();
  expect(await page.evaluate(storageKey => localStorage.getItem(storageKey), key)).toBe(original);
});

test('another tab updates the list and stale rename cannot overwrite a newer name', async ({ page, context }) => {
  await create(page, 'Shared browser draft');
  await page.getByRole('button', { name: 'Rename Shared browser draft', exact: true }).click();
  await page.getByLabel('Project name', { exact: true }).fill('Old tab edit');
  const other = await context.newPage();
  await other.goto(page.url());
  await other.getByRole('button',{name:'Project and history',exact:true}).click();
  await other.getByRole('button', { name: 'Rename Shared browser draft', exact: true }).click();
  await other.getByLabel('Project name', { exact: true }).fill('Newer tab edit');
  await other.getByRole('button', { name: 'Save name' }).click();
  await expect(page.locator('h1')).toHaveText('Newer tab edit');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('changed in another tab');
  expect(await other.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)!).projects[0].name, key)).toBe('Newer tab edit');
});

test('populated projects new-project picker detail and delete dialog fit phone and desktop', async ({ page }) => {
  await mkdir('artifacts/review', { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await create(page, 'Hallway storage', 'shoe_rack');
  await create(page, 'Reading corner', 'bookshelf');
  await create(page, 'Home office', 'table');
  for (const [label, width, height] of [['desktop', 1440, 1080], ['mobile', 390, 844]] as const) {
    await page.setViewportSize({ width, height });
    for (const [route, suffix] of [['/projects', 'projects'], ['/projects/new', 'create'], ['/', 'home']]) {
      await page.goto(route);
      if (route === '/projects/new') await expect(page.getByRole('button', { name: 'Create draft' })).toBeEnabled();
      else await expect(page.getByRole('link', { name: 'Open Home office' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await page.screenshot({ path: `artifacts/review/phase-02-${label}-${suffix}.png`, fullPage: true, animations: 'disabled' });
    }
    await page.getByRole('link', { name: 'Open Home office' }).click();
    await expect(page).toHaveURL(/\/projects\/[\da-f-]+$/);
    await expect(page.getByRole('heading', { name: 'Home office', exact: true, level: 1 })).toBeVisible();
    await page.screenshot({ path: `artifacts/review/phase-02-${label}-detail.png`, fullPage: true, animations: 'disabled' });
    await openProjectTools(page);await page.getByRole('button', { name: 'Delete Home office', exact: true }).click();
    await expect(page.getByRole('dialog',{name:'Delete this draft?',exact:true})).toBeVisible();
    await page.screenshot({ path: `artifacts/review/phase-02-${label}-delete.png`, fullPage: false, animations: 'disabled' });
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.screenshot({ path: 'artifacts/review/phase-02-desktop-light-projects.png', fullPage: true });
});

