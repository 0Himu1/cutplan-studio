import { test, expect, type Route } from '@playwright/test';
import { defaultFurniture } from '../../src/lib/furniture/families';
import { furnitureSnapshot, type ProjectSnapshot } from '../../src/lib/projects/contracts';

for(const family of ['shoe_rack','bookshelf','table'] as const)test(`${family} account saves, material preservation, rename and immutable history`,async({page})=>{
  const projectId='0123456789abcdef01234567',source='00000000-0000-4000-8000-000000000101',now='2026-10-22T08:00:00Z';
  const materialId='00000000-0000-4000-8000-000000000501';
  const material={boardId:materialId,thicknessMm:24,stockWidthMm:1219,stockHeightMm:2438,grainAxis:'none' as const};
  await page.route('**/api/catalog',route=>route.fulfill({json:{items:[{id:materialId,kind:'board',name:'Synthetic contract board',board_skus:{thickness_mm:24,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}}],compatibility:[]}}));
  let version=1;
  const snapshots:ProjectSnapshot[]=[furnitureSnapshot('Account furniture',{...defaultFurniture(family),panelOverrides:{[family+'/side-left']:material}})];
  const rev=(n:number)=>`00000000-0000-4000-8000-${String(300+n).padStart(12,'0')}`;
  const metadata=()=>({id:projectId,source_draft_id:source,name:snapshots.at(-1)!.name,furniture_type:family,version,current_revision_id:rev(version),sync_status:'ready',pending_operation_id:null,created_at:now,updated_at:now});
  const json=(route:Route,value:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  await page.route(`**/api/projects/${projectId}*`,async route=>{
    const query=new URL(route.request().url()).searchParams.get('revision');
    const number=query?Number(query.slice(-3))-300:version;
    await json(route,{project:metadata(),revision:{id:rev(number),number,snapshot:snapshots[number-1],createdAt:now},history:snapshots.map((_,i)=>({id:rev(i+1),revision_number:i+1,created_at:now})).reverse(),hasMoreHistory:false});
  });
  await page.route('**/api/projects',async route=>{
    if(route.request().method()==='GET')return json(route,{projects:[metadata()],configured:true,hasMore:false});
    const body=route.request().postDataJSON();
    if(body.expectedVersion!==version)return json(route,{error:'This project changed in another tab. Reload the latest project.',code:'version_conflict'},409);
    snapshots.push(body.snapshot);version++;
    return json(route,{project:metadata(),alreadyClaimed:false});
  });
  await page.goto('/projects/new?type=table');await page.getByLabel('Project name',{exact:true}).fill('Authentication draft');await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click();await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();await page.getByRole('link',{name:'Allow contract sign-in'}).click();
  await page.goto(`/projects/cloud/${projectId}`);
  await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue(family==='shoe_rack'?'813':family==='table'?'1200':'600');await page.getByLabel('Width (mm)',{exact:true}).fill(family==='shoe_rack'?'840':family==='table'?'1240':'640');await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
  await page.getByRole('button',{name:'Save design revision',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
  expect(snapshots[1].stage==='furniture-design'&&snapshots[1].configuration.panelOverrides?.[family+'/side-left'].boardId).toBe(materialId);expect(snapshots[1].stage==='furniture-design'&&snapshots[1].configuration.widthMm).toBe(family==='shoe_rack'?840:family==='table'?1240:640);
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('Renamed cabinet');await page.getByRole('button',{name:'Save as new revision',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Renamed cabinet',exact:true})).toBeVisible();expect(snapshots[2].stage==='furniture-design'&&snapshots[2].configuration.widthMm).toBe(family==='shoe_rack'?840:family==='table'?1240:640);
  await page.reload();await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue(family==='shoe_rack'?'840':family==='table'?'1240':'640');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'History',exact:true}).click();await page.getByRole('button',{name:/^Revision 1/}).click();
  await expect(page.getByText('Read-only revision',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue(family==='shoe_rack'?'813':family==='table'?'1200':'600');await expect(page.getByLabel('Width (mm)',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Save design revision',exact:true})).toHaveCount(0);
});
