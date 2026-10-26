import {test,expect} from '@playwright/test';
const board='00000000-0000-4000-8000-000000000001',finish='00000000-0000-4000-8000-000000000002',edge='00000000-0000-4000-8000-000000000003';
const catalog={items:[{id:board,kind:'board',name:'Synthetic 24 mm board',code:'QA24',board_skus:{thickness_mm:24,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}},{id:finish,kind:'finish',name:'Synthetic blue laminate',code:'QABLUE',finish_skus:{color_code:'#3355aa',texture_url:'https://example.test/texture.png'}},{id:edge,kind:'edging',name:'Synthetic wide PVC',code:'QAEDGE',edging_skus:{width_mm:25}}],compatibility:[{board_item_id:board,finish_item_id:finish}]};
async function choose(page:import('@playwright/test').Page,label:string,choice:string){if(label==='Panel to edit')await page.getByRole('button',{name:'Individual panel',exact:true}).click();await page.getByLabel(label,{exact:true}).selectOption({label:choice});}

test('panel material transaction recalculates, cancels, undoes and persists with texture fallback',async({page})=>{
  await page.route('**/api/catalog',route=>route.fulfill({json:catalog}));await page.route('https://example.test/texture.png',route=>route.abort());
  await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Material transaction QA');await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await page.getByRole('button',{name:'Materials',exact:true}).click();await choose(page,'Panel to edit','Left side');await choose(page,'Board','Synthetic 24 mm board');await page.getByLabel('Grain direction',{exact:true}).selectOption('height');
  await page.getByText('Face finishes',{exact:true}).click();await choose(page,'Front face finish','Synthetic blue laminate');await choose(page,'Back face / liner','Synthetic blue laminate');
  await page.getByText('Edge banding',{exact:true}).click();await choose(page,'Top edge','Synthetic wide PVC');
  await page.getByRole('button',{name:'Apply materials',exact:true}).click();
  await page.getByRole('button',{name:'Undo cabinet change'}).click();await page.getByRole('button',{name:'Materials',exact:true}).click();await expect(page.getByLabel('Board',{exact:true})).toHaveValue('');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Redo cabinet change'}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].cabinet);expect(saved.panelOverrides['cabinet/side-left']).toMatchObject({boardId:board,frontFinishId:finish,backFinishId:finish,grainAxis:'height',edges:{top:edge}});
  await page.reload();await page.getByRole('button',{name:'Materials',exact:true}).click();await choose(page,'Panel to edit','Left side');await expect(page.getByLabel('Board',{exact:true})).toHaveValue(board);
  await choose(page,'Board','Use cabinet default');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Materials',exact:true}).click();await expect(page.getByLabel('Board',{exact:true})).toHaveValue(board);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Explode',exact:true}).click();await expect(page.getByRole('button',{name:'Explode',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Fit model',exact:true}).click();
});

test('catalog failures recover and empty catalog never invents materials',async({page})=>{
  let failing=true;await page.route('**/api/catalog',route=>route.fulfill({status:failing?503:200,json:failing?{error:'offline'}:{items:[],compatibility:[]}}));
  await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Empty materials');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Materials',exact:true}).click();
  const inspector=page.getByRole('region',{name:'Materials workspace',exact:true});await expect(inspector.getByRole('alert')).toBeVisible();failing=false;await inspector.getByRole('button',{name:'Retry'}).click();await expect(inspector.getByText(/No published boards/)).toBeVisible();
});
