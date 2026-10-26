import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('partition frame appears in the form, 3D dimensions, 2D and sheets and survives saving',async({page})=>{
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Door frame review');await page.getByRole('button',{name:'Create draft',exact:true}).click();
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Width (mm)',{exact:true}).fill('1625.6');await page.getByLabel('Height (mm)',{exact:true}).fill('2133.6');
 await page.getByRole('group',{name:'Door position',exact:true}).getByRole('button',{name:'Outside carcass',exact:true}).click();await page.getByRole('button',{name:'Enable compartments',exact:true}).click();
 await expect(page.getByRole('button',{name:'Door-frame clearance',exact:true})).toHaveCount(2);await expect(page.locator('.cad-error[role=alert]')).toHaveCount(0);await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
 await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).toContainText('Door frame 2: W 76.2 mm');
 await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect.poll(async()=>Number(await page.locator('.cad-webgl').getAttribute('data-door-progress'))).toBeGreaterThan(.99);
 await page.getByRole('button',{name:'Fit model',exact:true}).click();
 await mkdir('artifacts/review/door-frames',{recursive:true});await page.screenshot({path:'artifacts/review/door-frames/open-3d.png'});
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).toContainText('Door frame 2');
 await page.getByRole('button',{name:'2D',exact:true}).click();await expect(page.getByRole('button',{name:'Select Door frame 2',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'SHEETS',exact:true}).click();await expect(page.getByText('Door frame 2',{exact:false}).first()).toBeVisible();await page.screenshot({path:'artifacts/review/door-frames/sheets.png'});
});
