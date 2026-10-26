import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

test('right preview tools independently hide doors and back without changing the design',async({page})=>{
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Visibility review');await page.getByRole('button',{name:'Create draft',exact:true}).click();
 const viewport=page.locator('.cad-webgl'),tools=page.getByRole('navigation',{name:'Cabinet tools',exact:true});
 const doors=tools.getByRole('button',{name:'Hide doors',exact:true}),back=tools.getByRole('button',{name:'Hide back',exact:true});
 await expect.poll(async()=>Number(await viewport.getAttribute('data-visible-doors'))).toBeGreaterThan(0);await expect(viewport).toHaveAttribute('data-visible-backs','1');
 const stored=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'));
 await doors.click();await expect(doors).toHaveAttribute('aria-pressed','true');await expect(viewport).toHaveAttribute('data-visible-doors','0');await expect(viewport).toHaveAttribute('data-visible-backs','1');
 await back.click();await expect(back).toHaveAttribute('aria-pressed','true');await expect(viewport).toHaveAttribute('data-visible-backs','0');
 await page.getByRole('button',{name:'X-ray',exact:true}).click();await page.getByRole('button',{name:'Explode',exact:true}).click();await page.getByRole('button',{name:'Open doors',exact:true}).click();
 await expect.poll(async()=>Number(await viewport.getAttribute('data-explode-progress'))).toBe(1);await expect(viewport).toHaveAttribute('data-visible-doors','0');await expect(viewport).toHaveAttribute('data-visible-backs','0');
 await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).not.toContainText('Door 1');
 await mkdir('artifacts/review/panel-visibility',{recursive:true});await page.screenshot({path:'artifacts/review/panel-visibility/hidden.png'});
 await page.getByRole('button',{name:'2D',exact:true}).click();await expect(doors).toHaveCount(0);await page.getByRole('button',{name:'3D',exact:true}).click();await expect(viewport).toHaveAttribute('data-visible-backs','0');
 await doors.click();await back.click();await expect(doors).toHaveAttribute('aria-pressed','false');await expect(back).toHaveAttribute('aria-pressed','false');await expect.poll(async()=>Number(await viewport.getAttribute('data-visible-doors'))).toBeGreaterThan(0);await expect(viewport).toHaveAttribute('data-visible-backs','1');
 expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(stored);
});
