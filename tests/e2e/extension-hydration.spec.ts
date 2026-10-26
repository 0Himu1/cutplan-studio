import {test,expect} from '@playwright/test';

test('extension-added body attributes do not warn or break hydration across studio pages',async({page})=>{
 const hydrationErrors:string[]=[];
 page.on('console',message=>{if(message.type()==='error'&&/hydrat|server rendered/i.test(message.text()))hydrationErrors.push(message.text());});
 page.on('pageerror',error=>hydrationErrors.push(error.message));
 // Simulate the extension before hydration, without replacing the navigation response.
 await page.addInitScript(()=>{
  const observer=new MutationObserver(()=>{if(!document.body)return;document.body.setAttribute('data-new-gr-c-s-check-loaded','14.1341.0');document.body.setAttribute('data-gr-ext-installed','');observer.disconnect();});
  observer.observe(document,{childList:true,subtree:true});
 });
 for(const path of ['/','/projects','/projects/new?type=cabinet']){
  const session=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/session');
  await page.goto(path);await session;
  await expect(page.locator('body')).toHaveAttribute('data-new-gr-c-s-check-loaded','14.1341.0');
  const toggle=page.getByRole('button',{name:'Toggle light and dark theme',exact:true});
  await expect(toggle).toBeEnabled();const before=await page.locator('html').getAttribute('class');
  await toggle.click();await expect.poll(()=>page.locator('html').getAttribute('class')).not.toBe(before);
 }
 await page.getByLabel('Project name',{exact:true}).fill('Extension hydration review');
 await page.getByRole('button',{name:'Create draft',exact:true}).click();await expect(page.locator('.cad-workspace')).toBeVisible();
 await page.reload();await expect(page.locator('body')).toHaveAttribute('data-gr-ext-installed','');
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
 expect(hydrationErrors).toEqual([]);
});
