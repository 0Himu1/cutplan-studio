import { calculateFurniture, furnitureInput, type FurnitureInput } from './families.ts';
import type { Panel } from './cabinet.ts';
export type Placement={panelId:string;x:number;y:number;width:number;height:number;rotation:0|90};
export type Sheet={id:string;groupId:string;stockKey:string;width:number;height:number;placements:Placement[]};
export type NestingPlan={schemaVersion:1;manufacturingApproved:false;algorithm:'shelf-first-fit-1';inputKey:string;kerf:number;margin:number;sheets:Sheet[];unplaced:{panelId:string;reason:string}[];groups:{id:string;stockKey:string;label:string}[];utilization:number;nonPanelArea:number;errors:string[]};
/** Deterministic rectangular preview; spacing is applied once between finished panel bounds. */
export function nestFurniture(input:FurnitureInput,kerf=4,margin=input.stockMarginMm):NestingPlan {
 const plan:NestingPlan={schemaVersion:1,manufacturingApproved:false,algorithm:'shelf-first-fit-1',inputKey:JSON.stringify(furnitureInput(input)),kerf,margin,sheets:[],unplaced:[],groups:[],utilization:0,nonPanelArea:0,errors:[]};
 const calc=calculateFurniture(input);
 if(calc.blockingErrors.length){plan.errors=calc.blockingErrors.map(e=>e.message);return plan;}
 if(!Number.isFinite(kerf)||kerf<0||kerf>30||!Number.isFinite(margin)||margin<0||margin>1000){plan.errors.push('Use spacing 0–30 mm and margin 0–1000 mm.');return plan;}
 const groups=new Map<string,{panels:Panel[];width:number;height:number}>();
 for(const panel of calc.panels){const a=input.panelOverrides?.[panel.panelId];const width=a?.stockWidthMm??input.stockWidthMm,height=a?.stockHeightMm??input.stockHeightMm;
  const key=JSON.stringify([a?.boardId??'unassigned',panel.thicknessMm,width,height,a?.frontFinishId??null,a?.backFinishId??null,panel.grainAxis]);
  const group=groups.get(key)??{panels:[],width,height};group.panels.push(panel);groups.set(key,group);
 }
 let area=0;
 for(const [key,g] of [...groups].sort(([a],[b])=>a.localeCompare(b))){const id='group-'+(plan.groups.length+1);const spec=JSON.parse(key);plan.groups.push({id,stockKey:key,label:`${spec[0]==='unassigned'?'Unassigned board':spec[0]} · ${spec[1]} mm · ${g.width} × ${g.height} · ${spec[6]} grain`});
  const bins:{sheet:Sheet;rows:{y:number;height:number;x:number}[]}[]=[];
  for(const p of g.panels.sort((a,b)=>b.widthMm*b.heightMm-a.widthMm*a.heightMm||a.panelId.localeCompare(b.panelId))){
   const orientations=p.allowedRotationsDeg.map(rotation=>({rotation,width:rotation===0?p.widthMm:p.heightMm,height:rotation===0?p.heightMm:p.widthMm})).filter(o=>o.width<=g.width-2*margin&&o.height<=g.height-2*margin);
   if(!orientations.length){plan.unplaced.push({panelId:p.panelId,reason:'Panel does not fit usable stock in an allowed grain orientation.'});continue;}
   let placed=false;
   for(let n=0;n<=bins.length&&!placed;n++){
    if(n===bins.length){const sheet:Sheet={id:`${id}-sheet-${n+1}`,groupId:id,stockKey:key,width:g.width,height:g.height,placements:[]};bins.push({sheet,rows:[]});plan.sheets.push(sheet);}
    const bin=bins[n];
    for(const o of orientations){let row=bin.rows.find(row=>o.height<=row.height&&row.x+o.width<=g.width-margin);
     if(!row){const last=bin.rows.at(-1),y=last?last.y+last.height+kerf:margin;if(y+o.height>g.height-margin)continue;row={y,height:o.height,x:margin};bin.rows.push(row);}
     bin.sheet.placements.push({panelId:p.panelId,x:row.x,y:row.y,width:o.width,height:o.height,rotation:o.rotation});row.x+=o.width+kerf;area+=p.widthMm*p.heightMm;placed=true;break;
    }
   }
  }
 }
 const purchased=plan.sheets.reduce((sum,s)=>sum+s.width*s.height,0);plan.utilization=purchased?area/purchased:0;plan.nonPanelArea=purchased-area;
 plan.errors=validateNesting(plan,calc.panels,input);return plan;
}
/** Independent conservation, containment, orientation and separation audit. */
export function validateNesting(plan:NestingPlan,panels:Panel[],input?:FurnitureInput):string[]{
 const errors:string[]=[],seen=new Set<string>(),byId=new Map(panels.map(p=>[p.panelId,p]));
 for(const sheet of plan.sheets)for(const a of sheet.placements){const p=byId.get(a.panelId);if(seen.has(a.panelId)||!p){errors.push('Duplicate or unknown panel.');continue;}seen.add(a.panelId);
  if(input){const assignment=input.panelOverrides?.[p.panelId],width=assignment?.stockWidthMm??input.stockWidthMm,height=assignment?.stockHeightMm??input.stockHeightMm;const expected=JSON.stringify([assignment?.boardId??'unassigned',p.thicknessMm,width,height,assignment?.frontFinishId??null,assignment?.backFinishId??null,p.grainAxis]);if(sheet.stockKey!==expected||sheet.width!==width||sheet.height!==height||!plan.groups.some(g=>g.id===sheet.groupId&&g.stockKey===expected))errors.push('Panel is assigned to incompatible stock.');}
  if(!p.allowedRotationsDeg.includes(a.rotation)||a.width!==(a.rotation===0?p.widthMm:p.heightMm)||a.height!==(a.rotation===0?p.heightMm:p.widthMm))errors.push('Invalid panel orientation or dimensions.');
  if(a.x<plan.margin||a.y<plan.margin||a.x+a.width>sheet.width-plan.margin||a.y+a.height>sheet.height-plan.margin)errors.push('Placement exceeds usable stock.');
  for(const b of sheet.placements)if(a!==b&&a.x<b.x+b.width+plan.kerf&&b.x<a.x+a.width+plan.kerf&&a.y<b.y+b.height+plan.kerf&&b.y<a.y+a.height+plan.kerf)errors.push('Panel collision or insufficient spacing.');
 }
 for(const p of plan.unplaced){if(seen.has(p.panelId)||!byId.has(p.panelId))errors.push('Invalid unplaced accounting.');seen.add(p.panelId);}
 if(seen.size!==panels.length)errors.push('Missing panel instances.');return [...new Set(errors)];
}
