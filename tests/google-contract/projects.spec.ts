import { test, expect, type Page, type Route } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const projectId='0123456789abcdef01234567';
const sourceDraftId='00000000-0000-4000-8000-000000000101';
const now='2026-10-22T08:00:00.000Z';

test('signed-in account copy, immutable revisions and two-tab conflicts stay recoverable',async({page,context})=>{
  let version=1,name='Contract cloud cabinet';
  const revisions=[{id:'00000000-0000-4000-8000-000000000301',revision_number:1,created_at:now}];
  const project=()=>({id:projectId,source_draft_id:sourceDraftId,name,furniture_type:'table',version,current_revision_id:revisions[0].id,sync_status:'ready',pending_operation_id:null,created_at:now,updated_at:now});
  const detail=()=>({project:project(),revision:{id:revisions[0].id,number:version,snapshot:{schemaVersion:1,name,furnitureType:'table',stage:'project-shell'},createdAt:now},history:revisions,hasMoreHistory:false});
  async function json(route:Route,value:unknown,status=200){await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});}
  async function install(target:Page){
    await target.route('**/api/projects',async route=>{
      if(route.request().method()==='GET')return json(route,{projects:version?[project()]:[],configured:true,hasMore:false});
      const body=route.request().postDataJSON();
      if(body.expectedVersion===0)return json(route,{project:project(),alreadyClaimed:false});
      if(body.expectedVersion!==version)return json(route,{error:'This project changed in another tab. Your typed name is still here. Reload the latest project before saving again.',code:'version_conflict'},409);
      version++;name=body.snapshot.name;revisions.unshift({id:`00000000-0000-4000-8000-${String(300+version).padStart(12,'0')}`,revision_number:version,created_at:now});
      return json(route,{project:project(),alreadyClaimed:false});
    });
    await target.route(`**/api/projects/${projectId}/recover`,route=>json(route,{project:project()}));
    await target.route(`**/api/projects/${projectId}*`,route=>json(route,detail()));
  }
  await install(page);
  await page.goto('/projects/new?type=table');await page.getByLabel('Project name',{exact:true}).fill(name);await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click();await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();await page.getByRole('link',{name:'Allow contract sign-in'}).click();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await expect(page.getByRole('button',{name:'Save to account',exact:true})).toBeVisible();await page.getByRole('button',{name:'Save to account',exact:true}).click();
  await expect(page.getByRole('link',{name:'Open account project',exact:true})).toBeVisible();await page.getByRole('link',{name:'Open account project',exact:true}).click();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await expect(page.getByText('Account project · Revision 1',{exact:true})).toBeVisible();
  await page.getByLabel('Project name',{exact:true}).fill('Contract cloud cabinet v2');await page.getByRole('button',{name:'Save as new revision',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Contract cloud cabinet v2',exact:true})).toBeVisible();await page.getByRole('button',{name:'Project and history',exact:true}).click();await expect(page.getByText('Account project · Revision 2',{exact:true})).toBeVisible();
  await mkdir('.impeccable/review/phase-04',{recursive:true});
  await page.screenshot({path:'.impeccable/review/phase-04/account-detail-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:'.impeccable/review/phase-04/account-detail-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1080});await page.goto('/projects');await expect(page.getByRole('heading',{name:'Account projects',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/Open account project/})).toBeVisible();await page.screenshot({path:'.impeccable/review/phase-04/projects-desktop.png',fullPage:true});await page.goto(`/projects/cloud/${projectId}`);

  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('Keep this typed name');
  const other=await context.newPage();await install(other);await other.goto(`/projects/cloud/${projectId}`);await other.getByRole('button',{name:'Project and history',exact:true}).click();await other.getByLabel('Project name',{exact:true}).fill('Saved from the other tab');await other.getByRole('button',{name:'Save as new revision',exact:true}).click();await expect(other.getByRole('heading',{name:'Saved from the other tab',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save as new revision',exact:true}).click();await expect(page.getByText(/This project changed in another tab/)).toBeVisible();await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Keep this typed name');await expect(page.getByRole('button',{name:'Reload latest project',exact:true})).toBeVisible();
});
