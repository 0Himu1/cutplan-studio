import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

async function create(page:Page,family:string){await page.goto(`/projects/new?type=${family}`);await page.getByLabel('Project name',{exact:true}).fill(`${family} review`);await page.getByRole('button',{name:'Create draft',exact:true}).click();await expect(page.locator('.cad-webgl canvas')).toBeVisible();}
const design=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].design);

test('shoe rack edits shelves, doors and skirting, saves canonical geometry and recovers after reload',async({page})=>{
 await create(page,'shoe_rack');await page.getByRole('button',{name:'Build',exact:true}).click();await page.getByLabel('Shelves',{exact:true}).fill('4');await page.getByLabel('Inset doors',{exact:true}).selectOption('0');await page.getByLabel('Raised bottom (mm)',{exact:true}).fill('100');await page.getByRole('button',{name:'Apply measurements'}).click();
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();expect(await design(page)).toMatchObject({family:'shoe_rack',shelfCount:4,doorCount:0,skirtingHeightMm:100});
 await page.reload();await page.getByRole('button',{name:'2D',exact:true}).click();await expect(page.getByRole('img',{name:'Front elevation: 813 mm by 1000 mm'})).toBeVisible();
 await page.locator('.cad-canvas').click({button:'right',position:{x:150,y:170}});await page.getByRole('button',{name:'Cut list',exact:true}).click();await expect(page.getByText('Left side',{exact:true})).toBeVisible();
});

test('bookshelf adjustable shelves and bounded wall preview require fixing information',async({page})=>{
 await create(page,'bookshelf');await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Height (mm)',{exact:true}).fill('900');await page.getByLabel('Depth (mm)',{exact:true}).fill('250');await page.getByRole('button',{name:'Apply measurements'}).click();
 await page.getByRole('button',{name:'Build',exact:true}).click();await expect(page.getByLabel('Inset doors',{exact:true})).toHaveCount(0);
 await page.getByLabel('Mounting',{exact:true}).selectOption('wall');await expect(page.getByRole('button',{name:'Apply measurements'})).toBeDisabled();await page.getByLabel('Wall substrate',{exact:true}).selectOption('concrete');await page.getByLabel('Fixing requirements',{exact:true}).fill('Installer must approve anchors and design loads');await page.getByLabel('Shelf support',{exact:true}).selectOption('adjustable');await page.getByRole('button',{name:'Apply measurements'}).click();
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();expect(await design(page)).toMatchObject({family:'bookshelf',mounting:'wall',shelfMode:'adjustable',doorCount:0,shelfSideClearanceMm:2});await page.reload();
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Width (mm)',{exact:true}).fill('900');await expect(page.getByRole('dialog').getByRole('alert')).toContainText('span');await expect(page.getByRole('button',{name:'Apply measurements'})).toBeDisabled();await page.keyboard.press('Escape');
});

test('explode/collapse and door motion animate without changing design; X-ray and panel labels render',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await create(page,'shoe_rack');const before=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'));
 const host=page.locator('.cad-webgl');await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect.poll(async()=>Number(await host.getAttribute('data-door-progress'))).toBeGreaterThan(0);await expect.poll(async()=>Number(await host.getAttribute('data-door-progress'))).toBe(1);
 await page.getByRole('button',{name:'Explode',exact:true}).click();const moving=Number(await host.getAttribute('data-explode-progress'));expect(moving).toBeLessThan(1);await expect.poll(async()=>Number(await host.getAttribute('data-explode-progress'))).toBe(1);
 await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'}).getByRole('listitem')).toHaveCount(11);await page.getByRole('button',{name:'X-ray',exact:true}).click();await expect(host).toHaveAttribute('data-xray','true');
 await mkdir('.impeccable/review/phases-10-11',{recursive:true});await page.screenshot({path:'.impeccable/review/phases-10-11/shoe-rack-xray-exploded-dimensions.png'});
 await page.getByRole('button',{name:'Explode',exact:true}).click();await expect.poll(async()=>Number(await host.getAttribute('data-explode-progress'))).toBe(0);await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect.poll(async()=>Number(await host.getAttribute('data-door-progress'))).toBe(0);
 expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(before);await expect(page.getByRole('button',{name:'Undo shoe rack change'})).toBeDisabled();
});

test('family toolbars and short construction steps fit phone and desktop without scrolling',async({page})=>{
 for(const family of ['shoe_rack','bookshelf']){
  await create(page,family);
  for(const [width,height] of [[1366,768],[390,844],[720,450]]){
   await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   for(const name of ['Dimensions','Build','Materials']){
    await page.getByRole('button',{name,exact:true}).click();const dialog=page.getByRole('dialog');expect(await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight+1&&r.top>=0&&el.scrollHeight<=el.clientHeight+1;})).toBe(true);await page.keyboard.press('Escape');
   }
   await mkdir('.impeccable/review/phases-10-11',{recursive:true});await page.screenshot({path:`.impeccable/review/phases-10-11/${family}-${width}.png`});
  }
 }
});

test('new family materials retain their panel namespace and recalculate neighboring dimensions',async({page})=>{
 const board='00000000-0000-4000-8000-000000000501';
 await page.route('**/api/catalog',route=>route.fulfill({json:{items:[{id:board,kind:'board',name:'Family test board',board_skus:{thickness_mm:24,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}}],compatibility:[]}}));
 for(const family of ['shoe_rack','bookshelf']){
  await create(page,family);await page.getByRole('button',{name:'Materials',exact:true}).click();
  await page.getByRole('button',{name:'Choose Panel to edit',exact:true}).click();await page.getByRole('dialog',{name:'Choose Panel to edit',exact:true}).getByRole('button',{name:'Left side',exact:true}).click();
  await page.getByRole('button',{name:'Choose Board',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Panel materials',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Choose Board',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Choose Board',exact:true}).click();await page.getByRole('dialog',{name:'Choose Board',exact:true}).getByRole('button',{name:'Family test board — 24 mm',exact:true}).click();await page.getByRole('button',{name:'Apply materials',exact:true}).click();
  await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();expect((await design(page)).panelOverrides[family+'/side-left'].thicknessMm).toBe(24);await page.reload();
  await page.getByRole('button',{name:'Show dimensions',exact:true}).click();await expect(page.getByRole('list',{name:'3D panel dimensions'})).toContainText(family==='shoe_rack'?'W 767 mm · H 324 mm':'W 558 mm · H 294 mm');
 }
});

test('reduced motion reaches the same presentation endpoints without changing the saved model',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await create(page,'cabinet');const host=page.locator('.cad-webgl');
 await page.getByRole('button',{name:'Explode',exact:true}).click();await expect(host).toHaveAttribute('data-explode-progress','1.000');await page.getByRole('button',{name:'Explode',exact:true}).click();await expect(host).toHaveAttribute('data-explode-progress','0.000');
 await page.getByRole('button',{name:'Open doors',exact:true}).click();await expect(host).toHaveAttribute('data-door-progress','1.000');
 await page.getByRole('button',{name:'X-ray',exact:true}).click();await expect(host).toHaveAttribute('data-xray','true');await page.getByRole('button',{name:'X-ray',exact:true}).click();await expect(host).toHaveAttribute('data-xray','false');
});
