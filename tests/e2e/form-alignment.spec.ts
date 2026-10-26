import {test,expect,type Locator} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const rect=async(el:Locator)=>{const box=await el.boundingBox();expect(box).not.toBeNull();return box!;};
const aligned=(a:number,b:number)=>expect(Math.abs(a-b)).toBeLessThanOrEqual(1);

test('section labels and controls align in mm and inch/suta across sizes and themes',async({page})=>{
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Aligned fields');await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.getByRole('button',{name:'Dimensions',exact:true}).click();await page.getByLabel('Height (mm)',{exact:true}).fill('2133.6');await page.getByRole('button',{name:'Enable compartments',exact:true}).click();
 const comp=page.locator('details[aria-label="Compartment 1"]'),rows=comp.locator(':scope > [data-section-id]');await rows.first().getByLabel('Section type',{exact:true}).selectOption('open');await rows.first().getByRole('switch',{name:'Automatic height',exact:true}).click();await rows.first().getByLabel('Section height (mm)',{exact:true}).fill('304.8');await comp.getByRole('button',{name:'Add section',exact:true}).click();await rows.last().getByLabel('Section height (mm)',{exact:true}).fill('965.2');await rows.last().getByLabel('Section type',{exact:true}).selectOption('hanging');
 await mkdir('artifacts/review/form-alignment',{recursive:true});
 for(const [width,height] of [[1440,900],[390,844]])for(const unit of ['mm','in']){
  await page.setViewportSize({width,height});await page.getByLabel('Display units',{exact:true}).selectOption(unit);const depth=await rect(page.getByLabel(unit==='mm'?'Depth (mm)':'Depth inches',{exact:true})),units=await rect(page.getByLabel('Display units',{exact:true}));aligned(depth.y,units.y);aligned(depth.height,units.height);await rows.last().scrollIntoViewIfNeeded();const widthOutput=await rect(comp.getByLabel('Width',{exact:true})),doors=await rect(comp.getByLabel('Compartment doors',{exact:true}));aligned(widthOutput.y,doors.y);aligned(widthOutput.height,doors.height);
  for(const row of await rows.all()){
   const type=await rect(row.getByLabel('Section type',{exact:true})),measurement=await rect(row.getByLabel(unit==='mm'?'Section height (mm)':'Section height inches',{exact:true}));aligned(type.y,measurement.y);aligned(type.height,measurement.height);
   const typeLabel=await rect(row.locator('.config-field-label').first()),heightLabel=await rect(row.locator('.measurement-label').first());aligned(typeLabel.y,heightLabel.y);
   if(unit==='in'){const suta=await rect(row.getByLabel('Section height suta',{exact:true}));aligned(suta.y,measurement.y);aligned(suta.width,measurement.width);}
  }
  const help=await rect(page.getByRole('button',{name:'Hanging rod clearance',exact:true})),label=await rect(rows.last().locator('.cad-field-with-help .measurement-label'));aligned(help.y+help.height/2,label.y+label.height/2);
  if(unit==='in'){const type=await rect(rows.last().getByLabel('Section type',{exact:true})),heightInput=await rect(rows.last().getByRole('group',{name:'Section height (inch/suta)',exact:true})),inch=await rect(page.getByLabel('Rod offset from top inches',{exact:true})),suta=await rect(page.getByLabel('Rod offset from top suta',{exact:true}));aligned(inch.x,type.x);aligned(inch.width,type.width);aligned(suta.x,heightInput.x);aligned(inch.width,suta.width);}
  expect(await page.getByRole('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  if(unit==='in')for(const theme of ['light','dark']){await page.evaluate(value=>{document.documentElement.classList.toggle('dark',value==='dark');},theme);await page.screenshot({path:`artifacts/review/form-alignment/${width}-${theme}.png`});}
 }
 await page.getByLabel('Display units',{exact:true}).selectOption('in');await rows.first().getByRole('switch',{name:'Automatic height',exact:true}).click();await rows.first().scrollIntoViewIfNeeded();const type=await rect(rows.first().getByLabel('Section type',{exact:true})),output=await rect(rows.first().getByLabel('Height',{exact:true}));aligned(type.y,output.y);aligned(type.height,output.height);
 await rows.last().getByLabel('Section type',{exact:true}).selectOption('drawer');await rows.last().scrollIntoViewIfNeeded();const clearance=await rect(rows.last().getByLabel('Drawer slide clearance per side (mm)',{exact:true})),box=await rect(rows.last().getByLabel('Box width',{exact:true}));aligned(clearance.y,box.y);aligned(clearance.height,box.height);
});
