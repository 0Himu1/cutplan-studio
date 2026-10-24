import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('cabinet review examples expose exact parts without changing the saved draft', async ({ page }) => {
  await page.goto('/projects/new?type=cabinet');
  await page.getByLabel('Project name', { exact: true }).fill('Cabinet calculation review');
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await page.goto('/review/cabinet');
  const review=page.getByRole('region', {name:'Cabinet panel review'});
  await expect(review).toBeVisible();
  const before=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'));
  await expect(review.getByText('9 individual panels')).toBeVisible();
  await review.getByText('Shelf 1',{exact:true}).click();
  await expect(review.getByText('cabinet/shelf-1',{exact:true})).toBeVisible();
  await expect(review.getByText('760 × 374 × 18',{exact:true})).toHaveCount(2);
  await review.getByLabel('Review example').selectOption('outside-plinth');
  await expect(review.getByText('10 individual panels')).toBeVisible();
  await expect(review.getByText('Recessed plinth',{exact:true})).toBeVisible();
  await review.getByLabel('Review example').selectOption('stock-error');
  await expect(review.getByRole('alert')).toContainText('does not fit usable stock');
  await expect(review.getByText('Left side',{exact:true})).toHaveCount(0);
  await review.getByLabel('Review example').selectOption('open');
  await expect(review.getByText('6 individual panels')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(before);
  await page.reload();
  await expect(review.getByLabel('Review example')).toHaveValue('inset');
});

test('table projects open their own workspace', async ({page})=>{
  await page.goto('/projects/new?type=table');
  await page.getByLabel('Project name',{exact:true}).fill('Bookcase shell');
  await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Bookcase shell',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Build',exact:true})).toBeVisible();
});

test('cabinet review stays readable at desktop phone and tablet sizes in both themes',async({page})=>{
  await mkdir('.impeccable/review/phase-06',{recursive:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/projects/new?type=cabinet');
  await page.getByLabel('Project name',{exact:true}).fill('Cabinet panel review with a long project name for layout verification');
  await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await page.goto('/review/cabinet');
  const review=page.getByRole('region',{name:'Cabinet panel review'});
  await expect(review).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  for(const [name,width,height] of [['desktop',1440,1080],['mobile',390,844],['tablet',768,1024]] as const){
    await page.setViewportSize({width,height});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:`.impeccable/review/phase-06/${name}.png`,fullPage:true});
    await review.screenshot({style: '.skip-link { visibility: hidden; }',path:`.impeccable/review/phase-06/${name}-review.png`});
  }
  await page.setViewportSize({width:390,height:844});
  await review.getByLabel('Review example').focus();
  await page.keyboard.press('Tab');
  await expect(review.getByText('Left side',{exact:true}).locator('..').locator('..')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(review.getByText('cabinet/side-left',{exact:true})).toBeVisible();
  await review.getByText('Construction rules and review limits',{exact:true}).click();
  await review.screenshot({style: '.skip-link { visibility: hidden; }',path:'.impeccable/review/phase-06/mobile-expanded.png'});
  await review.getByLabel('Review example').selectOption('stock-error');
  await expect(review.getByRole('alert')).toBeVisible();
  await review.screenshot({style: '.skip-link { visibility: hidden; }',path:'.impeccable/review/phase-06/mobile-error.png'});
  await review.getByLabel('Review example').selectOption('inset');
  await page.getByRole('button',{name:'Toggle light and dark theme'}).click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await review.screenshot({style: '.skip-link { visibility: hidden; }',path:'.impeccable/review/phase-06/mobile-light.png'});
  await page.setViewportSize({width:1440,height:1080});
  await review.screenshot({style: '.skip-link { visibility: hidden; }',path:'.impeccable/review/phase-06/desktop-light.png'});
});

