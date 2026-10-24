import {test,expect,type Page} from '@playwright/test';

async function create(page:Page){await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Editor transaction QA');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Dimensions',exact:true}).click();}

test('unit switches preserve canonical millimeters and shortcuts commit only applied edits',async({page})=>{
  await create(page);for(let n=0;n<4;n++){await page.getByLabel('Display units').selectOption('in');await page.getByLabel('Display units').selectOption('mm');}
  await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('800');
  await page.getByLabel('Width (mm)',{exact:true}).fill('901');await page.getByRole('button',{name:'Apply measurements'}).click();
  await expect(page.locator('.cad-dock')).toHaveCount(0);
  await page.getByLabel('Cabinet canvas',{exact:true}).focus();await page.keyboard.press('Control+z');
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('800');await page.keyboard.press('Escape');
  await expect(page.locator('.cad-dock')).toHaveCount(0);
  await page.getByLabel('Cabinet canvas',{exact:true}).focus();await page.keyboard.press('Control+Shift+z');await page.keyboard.press('Control+s');await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].cabinet);expect(saved.widthMm).toBe(901);
});

test('failed browser writes retain applied design and never claim successful save',async({page})=>{
  await create(page);await page.getByLabel('Width (mm)',{exact:true}).fill('910');await page.getByRole('button',{name:'Apply measurements'}).click();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='cutplan.guest-drafts.v1')throw new DOMException('Quota','QuotaExceededError');return original.call(this,key,value);};});
  await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.locator('.cad-status')).toContainText('could not save');
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('910');await expect(page.getByText('Design saved.',{exact:true})).toHaveCount(0);
});

test('construction steps apply once and right elevation uses the same physical dimensions',async({page})=>{
  await create(page);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Dimensions',exact:true}).click();
  await page.getByLabel('Shelves',{exact:true}).fill('3');await page.getByRole('button',{name:'Apply measurements'}).click();
  await page.getByRole('button',{name:'2D',exact:true}).click();await page.getByRole('group',{name:'View navigator'}).getByRole('button',{name:'Right',exact:true}).click();
  await expect(page.locator('.cad-drawing')).toHaveAttribute('aria-label','Right elevation: 400 mm by 1200 mm');
  await page.locator('.cad-canvas').click({button:'right',position:{x:150,y:170}});await page.getByRole('button',{name:'Cut list',exact:true}).click();await expect(page.getByText('Shelf 3',{exact:true})).toBeVisible();
});

test('WebGL failure retains a usable measured workspace',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,kind:string,...args:unknown[]){if(kind.includes('webgl'))return null;return Reflect.apply(original,this,[kind,...args]);} as typeof original;});
  await create(page);await page.keyboard.press('Escape');await expect(page.getByText('3D unavailable on this device. Measured 2D remains available.')).toBeVisible();await expect(page.locator('.cad-drawing')).toBeVisible();await expect(page.getByRole('button',{name:'3D',exact:true})).toBeDisabled();
});
