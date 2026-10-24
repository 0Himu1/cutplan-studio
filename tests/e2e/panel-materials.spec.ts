import {test,expect} from '@playwright/test';
const board='00000000-0000-4000-8000-000000000001',finish='00000000-0000-4000-8000-000000000002',edge='00000000-0000-4000-8000-000000000003';
const catalog={items:[{id:board,kind:'board',name:'Synthetic 24 mm board',code:'QA24',board_skus:{thickness_mm:24,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}},{id:finish,kind:'finish',name:'Synthetic blue laminate',code:'QABLUE',finish_skus:{color_code:'#3355aa',texture_url:'https://example.test/texture.png'}},{id:edge,kind:'edging',name:'Synthetic wide PVC',code:'QAEDGE',edging_skus:{width_mm:25}}],compatibility:[{board_item_id:board,finish_item_id:finish}]};
async function choose(page:import('@playwright/test').Page,label:string,choice:string){await page.getByRole('button',{name:`Choose ${label}`,exact:true}).click();await page.getByRole('dialog',{name:`Choose ${label}`,exact:true}).getByRole('button',{name:choice,exact:true}).click();}

test('panel material transaction recalculates, cancels, undoes and persists with texture fallback',async({page})=>{
  await page.route('**/api/catalog',route=>route.fulfill({json:catalog}));await page.route('https://example.test/texture.png',route=>route.abort());
  await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Material transaction QA');await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await page.getByRole('button',{name:'Materials',exact:true}).click();await choose(page,'Panel to edit','Left side');await choose(page,'Board','Synthetic 24 mm board — 24 mm');await page.getByLabel('Grain direction',{exact:true}).selectOption('height');
  await choose(page,'Front face finish','Synthetic blue laminate');await choose(page,'Back face / liner','Synthetic blue laminate');
  await choose(page,'top edge','Synthetic wide PVC');
  await page.getByRole('button',{name:'Apply materials',exact:true}).click();
  await page.getByRole('button',{name:'Undo cabinet change'}).click();await page.getByRole('button',{name:'Materials',exact:true}).click();await expect(page.getByRole('button',{name:'Choose Board',exact:true})).toHaveText('No board assigned');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Redo cabinet change'}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].cabinet);expect(saved.panelOverrides['cabinet/side-left']).toMatchObject({boardId:board,frontFinishId:finish,backFinishId:finish,grainAxis:'height',edges:{top:edge}});
  await page.reload();await page.getByRole('button',{name:'Materials',exact:true}).click();await choose(page,'Panel to edit','Left side');await expect(page.getByRole('button',{name:'Choose Board',exact:true})).toContainText('24 mm');
  await choose(page,'Board','No board assigned');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Materials',exact:true}).click();await expect(page.getByRole('button',{name:'Choose Board',exact:true})).toContainText('24 mm');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Explode',exact:true}).click();await expect(page.getByRole('button',{name:'Explode',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Fit model',exact:true}).click();
});

test('catalog failures recover and empty catalog never invents materials',async({page})=>{
  let failing=true;await page.route('**/api/catalog',route=>route.fulfill({status:failing?503:200,json:failing?{error:'offline'}:{items:[],compatibility:[]}}));
  await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Empty materials');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Materials',exact:true}).click();
  const inspector=page.getByRole('region',{name:'Panel materials',exact:true});await expect(inspector.getByRole('alert')).toBeVisible();failing=false;await inspector.getByRole('button',{name:'Retry materials'}).click();await expect(inspector.getByText(/No published materials/)).toBeVisible();
});
