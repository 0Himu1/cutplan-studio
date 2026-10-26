import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

test('X-ray checks visible assembled solids and pauses markers during inspection animations',async({page})=>{
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Collision inspection');await page.getByRole('button',{name:'Create draft',exact:true}).click();
 const viewport=page.locator('.cad-webgl');await expect(viewport).toHaveAttribute('data-clash-regions','0');
 const stored=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'));
 await page.getByRole('button',{name:'X-ray',exact:true}).click();await expect(viewport).toHaveAttribute('data-collision-overlay-visible','true');await expect(viewport).toHaveAttribute('data-unchecked-panels','0');
 await expect(page.getByRole('status',{name:'Panel collision check'})).toHaveText('Assembled view: no overlaps above 1 mm');
 await page.getByRole('button',{name:'Hide doors',exact:true}).click();await page.getByRole('button',{name:'Hide back',exact:true}).click();await expect(viewport).toHaveAttribute('data-clash-regions','0');
 await page.getByRole('button',{name:'Explode',exact:true}).click();await expect(viewport).toHaveAttribute('data-collision-overlay-visible','false');await expect(page.getByRole('status',{name:'Panel collision check'})).toContainText('collapse model');
 await page.getByRole('button',{name:'Explode',exact:true}).click();await expect(viewport).toHaveAttribute('data-collision-overlay-visible','true');
 await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect(viewport).toHaveAttribute('data-collision-overlay-visible','false');await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect(viewport).toHaveAttribute('data-collision-overlay-visible','true');
 await mkdir('artifacts/review/collisions',{recursive:true});await page.screenshot({path:'artifacts/review/collisions/xray-assembly.png'});
 await page.getByRole('button',{name:'X-ray',exact:true}).click();await expect(page.getByRole('status',{name:'Panel collision check'})).toHaveCount(0);await expect(viewport).toHaveAttribute('data-collision-overlay-visible','false');
 expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(stored);
});
