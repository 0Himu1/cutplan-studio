import {test,expect,type Page,type Locator} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
async function create(page:Page){await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Reorder review');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByRole('button',{name:'Enable compartments',exact:true}).click();}
const rows=(comp:Locator)=>comp.locator(':scope > [data-section-id]');
async function ids(comp:Locator){return rows(comp).evaluateAll(nodes=>nodes.map(node=>(node as HTMLElement).dataset.sectionId!));}
async function drag(page:Page,comp:Locator,cancel=false){
 const handle=rows(comp).first().getByRole('button',{name:'Reorder section 1',exact:true});await handle.scrollIntoViewIfNeeded();
 const a=(await handle.boundingBox())!;
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await rows(comp).last().scrollIntoViewIfNeeded();const b=(await rows(comp).last().boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height-2,{steps:8});
 await expect(rows(comp).first()).toHaveAttribute('data-section-dragging','true');
 if(cancel)await page.keyboard.press('Escape');await page.mouse.up();
}

test('mouse drag reorders complete sections, cancels cleanly and persists as one undoable edit',async({page})=>{
 await create(page);let comp=page.locator('details[aria-label="Compartment 1"]');
 const first=rows(comp).first();await first.getByLabel('Section type',{exact:true}).selectOption('hanging');await first.getByRole('switch',{name:'Automatic height',exact:true}).click();await first.getByLabel('Section height (mm)',{exact:true}).fill('300');await comp.getByRole('button',{name:'Add section',exact:true}).click();await rows(comp).last().getByLabel('Section height (mm)',{exact:true}).fill('200');
 await page.getByRole('button',{name:'Apply measurements',exact:true}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();comp=page.locator('details[aria-label="Compartment 1"]');const before=await ids(comp);
 await drag(page,comp,true);expect(await ids(comp)).toEqual(before);await expect(page.getByRole('dialog')).toBeVisible();
 await drag(page,comp);await expect.poll(()=>ids(comp)).toEqual([...before].reverse());
 await expect(rows(comp).last().locator(':scope > summary')).toHaveCount(0);await expect(rows(comp).last().getByLabel('Section height (mm)',{exact:true})).toHaveValue('300');await expect(rows(comp).last().getByLabel('Section type',{exact:true})).toHaveValue('hanging');
 await page.getByRole('button',{name:'Apply measurements',exact:true}).click();await page.getByRole('button',{name:'Undo cabinet change',exact:true}).click();await page.getByRole('button',{name:'Redo cabinet change',exact:true}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].cabinet);expect(saved.compartments[0].sections.map((s:{id:string})=>s.id)).toEqual(before);expect(saved.compartments[0].sections[0].heightMm).toBe(300);
 await page.reload();await page.getByRole('button',{name:'Dimensions',exact:true}).click();expect(await ids(page.locator('details[aria-label="Compartment 1"]'))).toEqual([...before].reverse());
});

test('keyboard moves stay within their nested compartment and retain focus',async({page})=>{
 await create(page);const root=page.locator('details[aria-label="Compartment 1"]');await root.getByLabel('Compartment doors',{exact:true}).selectOption('0');await root.getByLabel('Section type',{exact:true}).selectOption('divider');
 const slot=page.locator('details[aria-label="Slot 1"]'),other=page.locator('details[aria-label="Slot 2"]');await slot.getByRole('button',{name:'Add section',exact:true}).click();await rows(slot).last().getByLabel('Section height (mm)',{exact:true}).fill('200');const before=await ids(slot),untouched=await ids(other);
 await rows(slot).first().getByRole('button',{name:'Reorder section 1',exact:true}).focus();await page.keyboard.press('ArrowDown');await expect.poll(()=>ids(slot)).toEqual([...before].reverse());await expect(rows(slot).last().getByRole('button',{name:'Reorder section 2',exact:true})).toBeFocused();expect(await ids(other)).toEqual(untouched);
 await page.keyboard.press('Home');expect(await ids(slot)).toEqual(before);await page.keyboard.press('ArrowUp');expect(await ids(slot)).toEqual(before);await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeEnabled();
});

test('touch handles reorder on phones without changing height budgets',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();await create(page);const comp=page.locator('details[aria-label="Compartment 1"]');await rows(comp).first().getByLabel('Section type',{exact:true}).selectOption('open');await comp.getByRole('button',{name:'Add section',exact:true}).tap();await rows(comp).last().getByLabel('Section height (mm)',{exact:true}).fill('200');const before=await ids(comp),budget=await comp.getByRole('group',{name:'Height allocation',exact:true}).innerText();
 const handle=rows(comp).first().getByRole('button',{name:'Reorder section 1',exact:true});await rows(comp).last().scrollIntoViewIfNeeded();const a=(await handle.boundingBox())!,b=(await rows(comp).last().boundingBox())!;const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height-2}]});await expect(rows(comp).first()).toHaveAttribute('data-section-dragging','true');
 await mkdir('artifacts/review/section-reorder',{recursive:true});await page.screenshot({path:'artifacts/review/section-reorder/touch-drop.png'});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>ids(comp)).toEqual([...before].reverse());expect(await comp.getByRole('group',{name:'Height allocation',exact:true}).innerText()).toBe(budget);await context.close();
});

test('long open sections auto-scroll during drag and outside drops do not change order',async({page})=>{
 await create(page);const comp=page.locator('details[aria-label="Compartment 1"]');await comp.getByRole('button',{name:'Add section',exact:true}).click();await rows(comp).last().getByLabel('Section height (mm)',{exact:true}).fill('200');await comp.getByRole('button',{name:'Add section',exact:true}).click();await rows(comp).last().getByLabel('Section height (mm)',{exact:true}).fill('200');const before=await ids(comp),handle=rows(comp).first().getByRole('button',{name:'Reorder section 1',exact:true}),scroll=page.locator('.cad-inspector-scroll');
 await handle.scrollIntoViewIfNeeded();const viewport=(await scroll.boundingBox())!,start=(await handle.boundingBox())!;await scroll.evaluate((e,offset)=>{e.scrollTop+=offset;},start.y-(viewport.y+viewport.height-180));let a=(await handle.boundingBox())!;const initial=await scroll.evaluate(e=>e.scrollTop);
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2,viewport.y+viewport.height-8,{steps:6});await expect(rows(comp).first()).toHaveAttribute('data-section-dragging','true');await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(initial+60);
 await page.keyboard.press('Escape');await page.mouse.up();expect(await ids(comp)).toEqual(before);
 await handle.scrollIntoViewIfNeeded();a=(await handle.boundingBox())!;const bounds=(await comp.boundingBox())!;await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width+100,a.y+20,{steps:6});await expect(rows(comp).first()).toHaveAttribute('data-section-dragging','true');await page.mouse.up();expect(await ids(comp)).toEqual(before);await expect(page.getByRole('dialog')).toBeVisible();
});
