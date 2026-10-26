import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('frame corner cutouts appear in 3D, floor plan and Sheets and survive save/reload',async({page})=>{
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Notched shelf review');await page.getByRole('button',{name:'Create draft',exact:true}).click();
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Width (mm)',{exact:true}).fill('1625.6');await page.getByLabel('Height (mm)',{exact:true}).fill('2133.6');
 await page.getByRole('group',{name:'Door position',exact:true}).getByRole('button',{name:'Outside carcass',exact:true}).click();await page.getByRole('button',{name:'Enable compartments',exact:true}).click();
 for(const comp of await page.locator('details[aria-label^="Compartment "]').all())await comp.getByLabel('Section type',{exact:true}).selectOption('shelf');
 const comp=page.locator('details[aria-label="Compartment 2"]');await comp.getByRole('switch',{name:'Automatic height',exact:true}).click();await comp.getByLabel('Section height (mm)',{exact:true}).fill('800');await comp.getByRole('button',{name:'Add section',exact:true}).click();await comp.getByRole('switch',{name:'Automatic height',exact:true}).last().click();await comp.getByLabel('Section type',{exact:true}).last().selectOption('shelf');
 await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
 await page.getByRole('button',{name:'Fit model',exact:true}).click();await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect.poll(async()=>Number(await page.locator('.cad-webgl').getAttribute('data-door-progress'))).toBeGreaterThan(.99);
 await mkdir('artifacts/review/corner-notches',{recursive:true});await page.screenshot({path:'artifacts/review/corner-notches/open-3d.png'});
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();await page.reload();
 await page.getByRole('button',{name:'2D',exact:true}).click();await page.getByRole('button',{name:'Top',exact:true}).click();await expect(page.locator('.cad-drawing polygon[data-notched=true]')).toHaveCount(4);await page.screenshot({path:'artifacts/review/corner-notches/floor-plan.png'});
 await page.getByRole('button',{name:'SHEETS',exact:true}).click();await expect(page.locator('.cut-sheet-grid polygon[data-notched=true]')).toHaveCount(4);await page.getByRole('button',{name:'Use One by one cut order',exact:true}).click();await expect(page.getByRole('button',{name:'Use One by one cut order',exact:true})).toHaveCount(0);await page.screenshot({path:'artifacts/review/corner-notches/sheets.png'});
});

