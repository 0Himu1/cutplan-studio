import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

async function create(page:Page){
  await page.goto('/projects/new?type=cabinet');
  await page.getByLabel('Project name',{exact:true}).fill('Precision cabinet');
  await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await expect(page.getByRole('region',{name:'Cabinet editor',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Dimensions',exact:true})).toBeEnabled();
  for(const name of ['Inspect','Cut list','Measure','Project'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
  await expect(page.locator('button.cad-selection')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Top',exact:true})).toHaveCount(1);
  await expect(page.locator('.cad-webgl canvas')).toBeVisible();
}
async function dimensions(page:Page,width:string){
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();
  await page.getByLabel('Width (mm)',{exact:true}).fill(width);
  await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
}
async function fits(page:Page){
  await expect(page.locator('.cad-dock[data-closing=true]')).toHaveCount(0);
  expect(await page.evaluate(()=>({x:document.documentElement.scrollWidth<=innerWidth,y:document.documentElement.scrollHeight<=innerHeight}))).toEqual({x:true,y:true});
  const dialog=page.getByRole('dialog');
  if(await dialog.count())await expect.poll(()=>dialog.evaluate(element=>{const b=element.getBoundingClientRect();return {fits:b.left>=0&&b.top>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,scroll:element.scrollHeight>element.clientHeight+1};})).toEqual({fits:true,scroll:false});
}

test('fixed workspace edits transactionally, undo/redo, saves and reloads',async({page})=>{
  await create(page);
  await fits(page);
  await dimensions(page,'950');
  await page.getByRole('button',{name:'Undo cabinet change'}).click();
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();
  await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('800');
  await page.getByLabel('Width (mm)',{exact:true}).fill('1000');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Redo cabinet change'}).click();
  await page.getByRole('button',{name:'Save browser design',exact:true}).click();
  await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();
  await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('950');
  await page.getByLabel('Width (mm)',{exact:true}).fill('1');
  await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'2D',exact:true}).click();
  await expect(page.locator('.cad-drawing')).toHaveAttribute('aria-label','Front elevation: 950 mm by 1200 mm');
  await page.getByRole('group',{name:'View navigator'}).getByRole('button',{name:'Top',exact:true}).click();
  await expect(page.locator('.cad-drawing')).toHaveAttribute('aria-label','Floor plan: 950 mm by 400 mm');
});

test('canvas context action opens short form and Escape restores focus',async({page})=>{
  await create(page);
  const canvas=page.getByLabel('Cabinet canvas',{exact:true});
  await canvas.click({button:'right',position:{x:180,y:190}});
  await mkdir('.impeccable/review/precision-cad',{recursive:true});
  await page.screenshot({path:'.impeccable/review/precision-cad/context-menu.png'});
  await page.getByRole('button',{name:'Edit dimensions',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Edit dimensions'})).toBeVisible();
  await page.screenshot({path:'.impeccable/review/precision-cad/dimensions-overlay.png'});
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Dimensions',exact:true}).focus();
  await page.keyboard.press('Enter');await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Dimensions',exact:true})).toBeFocused();
});

test('workspace and task states fit desktop tablet phone and compact zoom equivalent',async({page})=>{
  await create(page);await mkdir('.impeccable/review/precision-cad',{recursive:true});
  for(const [width,height] of [[1440,900],[1366,768],[1024,768],[768,1024],[390,844],[720,450]]){
    await page.setViewportSize({width,height});await fits(page);
    await page.screenshot({path:`.impeccable/review/precision-cad/${width}-canvas.png`});
    for(const name of ['Dimensions','Materials','Project and history']){
      await page.getByRole('button',{name,exact:true}).click();await fits(page);
      await page.keyboard.press('Escape');
    }
  }
});

test('applied recovery survives reload and stale-tab save preserves edits',async({page,context})=>{
  await create(page);await dimensions(page,'920');const url=page.url();await page.reload();
  const other=await context.newPage();await other.goto(url);await dimensions(other,'980');
  await other.getByRole('button',{name:'Save browser design',exact:true}).click();
  await expect(other.getByText('Design saved.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save browser design',exact:true}).click();
  await expect(page.locator('.cad-status')).toContainText('another tab');
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('920');
});

test('right-click selects the physical target before opening its panel actions',async({page})=>{
  await create(page);
  await page.getByRole('button',{name:'Panels',exact:true}).click();await page.keyboard.press('Escape');
  const canvas=page.locator('.cad-webgl canvas');const bounds=await canvas.boundingBox();
  await canvas.click({button:'right',position:{x:bounds!.width/2,y:bounds!.height/2}});
  await expect(page.locator('.cad-context-dialog h2')).not.toHaveText('Cabinet actions');
  await page.getByRole('button',{name:'Panel materials',exact:true}).click();
  await expect(page.getByRole('button',{name:'Choose Panel to edit',exact:true})).not.toHaveText('Choose a panel');
});
