import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
async function open(page:Page){await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Tooltip review');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Dimensions',exact:true}).click();}

test('configuration hints work on hover, focus and Escape without closing the editor',async({page})=>{
 await open(page);const help=page.getByRole('button',{name:'Size and units',exact:true});
 await help.hover();await expect(page.getByRole('tooltip')).toContainText('Display units convert');
 await page.getByRole('tooltip').hover();await expect(page.getByRole('tooltip')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Edit dimensions',exact:true})).toBeVisible();
 await page.getByLabel('Width (mm)',{exact:true}).focus();await help.focus();await expect(page.getByRole('tooltip')).toContainText('Carcass dimensions');
 const fits=await page.getByRole('tooltip').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});expect(fits).toBe(true);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Enable compartments',exact:true}).click();
 const comp=page.locator('details[aria-label="Compartment 1"]');
 await expect(comp.getByRole('group',{name:'Height allocation',exact:true}).locator('[data-space-tone="available"]')).toHaveCount(1);
 await expect(comp.locator('[data-space-tone="info"]')).toHaveCount(1);
 await comp.getByRole('button',{name:'Add section',exact:true}).click();await expect(comp.locator(':scope > [data-section-id]')).toHaveCount(2);
 await comp.getByRole('button',{name:'Remove section 2',exact:true}).click();await expect(comp.locator(':scope > [data-section-id]')).toHaveCount(1);
 await comp.getByRole('button',{name:'Remove section 1',exact:true}).hover();await expect(page.getByRole('tooltip')).toContainText('Keep at least one section');
 await page.keyboard.press('Escape');await comp.getByRole('switch',{name:'Automatic height',exact:true}).click();await comp.getByLabel('Section height (mm)',{exact:true}).fill('3000');
 await expect(comp.locator('[data-space-tone="danger"]')).toHaveCount(1);await expect(comp.locator('[data-space-tone="danger"]')).toContainText('Overflow');await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeDisabled();
});

test('compact accented form and tap hints fit light and dark phone layouts',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 await open(page);await page.getByRole('button',{name:'Size and units',exact:true}).tap();await expect(page.getByRole('tooltip')).toBeVisible();
 await page.getByLabel('Width (mm)',{exact:true}).tap();await expect(page.getByRole('tooltip')).toHaveCount(0);
 await page.getByRole('button',{name:'Enable compartments',exact:true}).tap();
 await mkdir('artifacts/review/config-hints',{recursive:true});
 for(const theme of ['light','dark']){
  await page.evaluate(value=>{localStorage.setItem('theme',value);document.documentElement.classList.toggle('dark',value==='dark');document.documentElement.classList.toggle('light',value==='light');},theme);
  const allocation=page.getByRole('group',{name:'Height allocation',exact:true});await allocation.scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/review/config-hints/phone-${theme}.png`});
  expect(await page.getByRole('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 }
 await page.setViewportSize({width:1440,height:900});await page.getByRole('group',{name:'Height allocation',exact:true}).scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Available explained',exact:true}).hover();await page.screenshot({path:'artifacts/review/config-hints/desktop.png'});
 await context.close();
});
