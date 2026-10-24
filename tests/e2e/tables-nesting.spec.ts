import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {defaultFurniture} from '../../src/lib/furniture/families';
test('table variants save and reopen; sheet view keeps all controls within the canvas',async({page})=>{
 await page.goto('/projects/new?type=table');await page.getByLabel('Project name',{exact:true}).fill('Panel table review');await page.getByRole('button',{name:'Create draft',exact:true}).click();await expect(page.locator('.cad-webgl canvas')).toBeVisible();
 await expect(page.getByRole('button',{name:'Open doors',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Build',exact:true}).click();await page.getByLabel('Table type',{exact:true}).selectOption('side');await page.getByRole('button',{name:'Apply measurements',exact:true}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).toContainText('W 600 mm · H 500 mm');
 await page.getByRole('button',{name:'SHEETS',exact:true}).click();await expect(page.getByRole('region',{name:'Sheet nesting preview'})).toBeVisible();await expect(page.getByRole('article',{name:/Sheet 1 of/})).toBeVisible();await page.getByRole('button',{name:'Nesting and G-code settings',exact:true}).click();await page.getByLabel('Panel spacing (mm)',{exact:true}).fill('6');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Unplaced (0)',exact:true}).click();await expect(page.getByText('Every panel is placed.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Unplaced (0)',exact:true}).click();
 for(const [width,height] of [[1366,768],[390,844],[720,450]]){await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('.cad-sheets').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);await mkdir('.impeccable/review/phases-12-13',{recursive:true});await page.screenshot({path:`.impeccable/review/phases-12-13/sheets-${width}.png`});}
 await page.getByRole('button',{name:'3D',exact:true}).click();await expect(page.locator('.cad-webgl canvas')).toBeVisible();
});

test('oversized grain-locked panels remain explicit and can fit after margin adjustment',async({page})=>{
 const id='00000000-0000-4000-8000-000000000101';const design={...defaultFurniture('table'),grainAxis:'width'};
 await page.addInitScript(({id,design})=>localStorage.setItem('cutplan.guest-drafts.v1',JSON.stringify({schemaVersion:4,projects:[{id,name:'Grain boundary',furnitureType:'table',version:1,createdAt:'2026-10-23T00:00:00Z',updatedAt:'2026-10-23T00:00:00Z',design}]})),{id,design});
 await page.goto('/projects/'+id);await page.getByRole('button',{name:'SHEETS',exact:true}).click();await page.getByRole('button',{name:'Unplaced (1)',exact:true}).click();await expect(page.getByRole('button',{name:'table/top#1',exact:true})).toBeVisible();await expect(page.getByText(/does not fit usable stock/)).toBeVisible();
 await page.getByRole('button',{name:'Nesting and G-code settings',exact:true}).click();await page.getByLabel('Outer margin (mm)',{exact:true}).fill('0');await expect(page.getByRole('button',{name:'Unplaced (0)',exact:true})).toBeVisible();await expect(page.getByText('Every panel is placed.',{exact:true})).toBeVisible();
 await page.getByLabel('Panel spacing (mm)',{exact:true}).fill('-1');await expect(page.getByRole('region',{name:'Sheet nesting preview'}).getByRole('alert')).toContainText('spacing');
});
