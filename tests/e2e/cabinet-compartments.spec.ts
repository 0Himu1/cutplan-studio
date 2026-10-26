import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
async function create(page:Page){await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Compartment review');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Dimensions',exact:true}).click();}
async function fits(page:Page){const metrics=await page.getByRole('dialog').evaluate(e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,scroll:e.scrollHeight,client:e.clientHeight,width:innerWidth,height:innerHeight};});expect(metrics.top>=0&&metrics.bottom<=metrics.height+1&&metrics.left>=0&&metrics.right<=metrics.width+1&&metrics.scroll<=metrics.client+1,JSON.stringify(metrics)).toBe(true);}
async function configure(page:Page){
 await page.getByRole('group',{name:'Door position',exact:true}).getByRole('button',{name:'Outside carcass',exact:true}).click();
 await page.getByRole('button',{name:'Enable compartments',exact:true}).click();
 await page.getByRole('group',{name:'Layout mode',exact:true}).getByRole('button',{name:'Manual',exact:true}).click();
 await page.getByRole('button',{name:'Add compartment',exact:true}).click();
 const first=page.locator('details[aria-label="Compartment 1"] > section[aria-label="Section 1"]');
 await first.getByLabel('Section type',{exact:true}).selectOption('drawer');
 await first.getByRole('button',{name:'External faces',exact:true}).click();
 await first.getByRole('switch',{name:'Automatic height',exact:true}).click();
 await first.getByLabel('Section height (mm)',{exact:true}).fill('300');
 await page.locator('details[aria-label="Compartment 1"]').getByRole('button',{name:'Add section',exact:true}).click();
 await page.locator('details[aria-label="Compartment 1"] > section[aria-label="Section 2"]').getByLabel('Section type',{exact:true}).selectOption('hanging');
 await page.locator('details[aria-label="Compartment 1"] > section[aria-label="Section 2"]').getByLabel('Section height (mm)',{exact:true}).fill('700');
}
test('combined cabinet form builds external drawers and hanging compartments, persists and undoes atomically',async({page})=>{
 await create(page);await expect(page.getByRole('button',{name:'Build',exact:true})).toHaveCount(0);await configure(page);await expect(page.locator('.cad-error[role=alert]')).toHaveCount(0);await page.getByRole('button',{name:'Apply measurements',exact:true}).click();await expect(page.locator('.cad-webgl')).toHaveAttribute('data-hardware-count','1');await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].cabinet);expect(saved.doorPosition).toBe('overlay');expect(saved.compartments).toHaveLength(2);expect(saved.compartments[0].sections.map((s:{type:string})=>s.type)).toEqual(['hanging','drawer']);
 await page.reload();await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByRole('group',{name:'Layout mode',exact:true}).getByRole('button',{name:'Manual',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByLabel('Section type',{exact:true}).first()).toHaveValue('drawer');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Width (mm)',{exact:true}).fill('1');await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('800');
});
test('nested divider forms produce independent shelves and reject overflowing manual widths',async({page})=>{
 await create(page);await page.getByRole('button',{name:'Enable compartments',exact:true}).click();await page.getByRole('group',{name:'Layout mode',exact:true}).getByRole('button',{name:'Manual',exact:true}).click();await page.getByLabel('Compartment doors',{exact:true}).selectOption('0');await page.getByLabel('Section type',{exact:true}).selectOption('divider');await page.locator('details[aria-label="Slot 1"]').getByLabel('Section type',{exact:true}).selectOption('shelf');await page.getByLabel('Section shelves',{exact:true}).fill('3');await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Compartment width (mm)',{exact:true}).fill('900');await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeDisabled();await expect(page.locator('.cad-error[role=alert]')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).toContainText('Shelf');
});
test('compact cabinet pages fit mm and inch modes while thickness remains mm',async({page})=>{
 await create(page);await configure(page);await mkdir('artifacts/review/cabinet-config',{recursive:true});
 for(const [width,height] of [[1440,900],[390,844],[720,450]]){
  await page.setViewportSize({width,height});await fits(page);await page.screenshot({path:`artifacts/review/cabinet-config/drawers-${width}.png`});
  await page.getByLabel('Display units',{exact:true}).selectOption('in');await fits(page);await expect(page.getByLabel('Construction thicknesses')).toContainText('Body 18 mm');await expect(page.getByLabel('Body thickness inches',{exact:true})).toHaveCount(0);await fits(page);await fits(page);await page.getByLabel('Display units',{exact:true}).selectOption('mm');
 }
});
test('3D labels switch global units without replacing the canvas or changing saved geometry',async({page})=>{
 await create(page);await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();const saved=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'));
 await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).not.toContainText('Thickness');await page.locator('.cad-webgl canvas').evaluate(e=>e.setAttribute('data-preserved','yes'));
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Display units',{exact:true}).selectOption('in');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.cad-webgl')).toHaveAttribute('data-dimension-unit','in');await expect(page.getByRole('list',{name:'3D panel dimensions'})).toContainText('suta');await expect(page.getByRole('list',{name:'3D panel dimensions'})).not.toContainText('Thickness');await expect(page.locator('.cad-webgl canvas')).toHaveAttribute('data-preserved','yes');await expect(page.getByRole('button',{name:'Undo cabinet change',exact:true})).toBeDisabled();expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(saved);
 await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect.poll(async()=>Number(await page.locator('.cad-webgl').getAttribute('data-door-progress'))).toBe(1);await mkdir('artifacts/review/cabinet-config',{recursive:true});await page.screenshot({path:'artifacts/review/cabinet-config/panel-labels-inch.png'});
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Display units',{exact:true}).selectOption('mm');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).not.toContainText('suta');await expect(page.locator('.cad-webgl canvas')).toHaveAttribute('data-preserved','yes');
});


test('layout switches, remaining space, fixed millimeter clearances and parent resizing preserve configuration',async({page})=>{
 await create(page);await configure(page);
 const first=page.locator('details[aria-label="Compartment 1"] > section[aria-label="Section 1"]');
 await first.getByLabel('Drawer slide clearance per side (mm)',{exact:true}).fill('13');
 await page.getByLabel('Door gap (mm)',{exact:true}).fill('3');
 await page.getByLabel('Shelf side clearance (mm)',{exact:true}).fill('2');
 await page.getByLabel('Display units',{exact:true}).selectOption('in');
 await expect(first.getByLabel('Drawer slide clearance per side (mm)',{exact:true})).toHaveValue('13');
 await expect(page.getByLabel('Door gap (mm)',{exact:true})).toHaveValue('3');
 await expect(page.getByLabel('Shelf side clearance (mm)',{exact:true})).toHaveValue('2');
 await expect(first.getByLabel('Section height inches',{exact:true})).toHaveValue('11');
 await page.getByLabel('Display units',{exact:true}).selectOption('mm');
 await expect(first.getByLabel('Section height (mm)',{exact:true})).toHaveValue('300');
 await page.getByRole('group',{name:'Layout mode',exact:true}).getByRole('button',{name:'Automatic',exact:true}).click();
 await page.getByLabel('Width (mm)',{exact:true}).fill('700');
 await expect(page.locator('details[aria-label="Compartment 2"]')).toHaveCount(1);
 await expect(first.getByLabel('Section type',{exact:true})).toHaveValue('drawer');
 await expect(first.getByLabel('Section height (mm)',{exact:true})).toHaveValue('300');
 await page.getByRole('group',{name:'Layout mode',exact:true}).getByRole('button',{name:'Manual',exact:true}).click();
 await first.getByLabel('Section height (mm)',{exact:true}).fill('3000');
 await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeDisabled();
 await first.getByLabel('Section height (mm)',{exact:true}).fill('300');
 await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeEnabled();
 await first.getByLabel('Section type',{exact:true}).selectOption('hanging');
 await first.getByLabel('Section type',{exact:true}).selectOption('drawer');
 await expect(first.getByLabel('Drawer slide clearance per side (mm)',{exact:true})).toHaveValue('13');
 await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();
 await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
});
