import {calculateFurniture,type FurnitureInput} from '../furniture/families.ts';
import {nestPanels,type PackingAlgorithm} from './legacy/nesting/nesting-engine.ts';
import {generateGCode} from './legacy/gcode/gcode-generator.ts';
import type {GCodeAlgorithm} from './legacy/gcode/gcode-path-optimizer.ts';
import type {Panel,Circle,Notch,PocketEngraving} from './legacy/types/common.ts';
import type {NestedBin} from './legacy/types/nesting.ts';

export type JobPart=Panel&{sourceId:string;thickness:number;grain:'none'|'width'|'height';category:string};
export type JobStock={width:number;height:number;thickness:number;boardId?:string;materialName?:string};
export type CuttingSettings={algorithm:PackingAlgorithm;rotation:boolean;spacing:number;toolDiameter:number;margin:number;orientation:'horizontal'|'vertical';cutOrder:GCodeAlgorithm;passes:number;safeZ:number;feed:number;plunge:number;spindle:number;depth:number;feedPercent:number;power:number;electricity:number;stocks:Record<string,JobStock>;customParts:JobPart[];parts:Record<string,Partial<Pick<JobPart,'name'|'width'|'height'|'quantity'|'pocketEngraving'|'notches'>>>};
export const defaultCuttingSettings:CuttingSettings={algorithm:'optimized',rotation:true,spacing:4,toolDiameter:3,margin:10,orientation:'horizontal',cutOrder:'scan-line',passes:4,safeZ:12,feed:2000,plunge:800,spindle:18000,depth:0,feedPercent:100,power:13,electricity:14,stocks:{},parts:{},customParts:[]};
export type JobSheet=NestedBin&{id:string;groupId:string;thickness:number;label:string};
export type CuttingJob={sheets:JobSheet[];parts:JobPart[];unplaced:{panelId:string;reason:string}[];errors:string[];groups:{id:string;label:string;stock:JobStock}[];utilization:number;area:number};
const finite=(n:number,min:number,max:number)=>Number.isFinite(n)&&n>=min&&n<=max;
export function cuttingSettingsIssues(s:CuttingSettings){
 const errors:string[]=[];
 if(!['basic','maxrects','guillotine','optimized'].includes(s.algorithm)||!['nearest-neighbor','2-opt','scan-line','one-by-one'].includes(s.cutOrder)||!['horizontal','vertical'].includes(s.orientation))errors.push('Choose a supported nesting, cut order and orientation.');
 for(const [name,value,min,max]of [['Panel spacing',s.spacing,0,30],['Tool diameter',s.toolDiameter,.1,30],['Outer margin',s.margin,0,1000],['Passes',s.passes,1,40],['Safe Z',s.safeZ,1,100],['Feed rate',s.feed,1,20000],['Plunge rate',s.plunge,1,3000],['Spindle speed',s.spindle,1000,30000],['Cut depth',s.depth,0,100],['Feed override',s.feedPercent,1,100],['Machine power',s.power,0,100],['Electricity price',s.electricity,0,1000]] as const)if(!finite(value,min,max))errors.push(`${name}: use ${min}–${max}.`);
 if(!Number.isInteger(s.passes)||!Number.isInteger(s.spindle))errors.push('Pass count and spindle speed must be whole numbers.');
 return errors;
}
export function cuttingJob(input:FurnitureInput,s:CuttingSettings):CuttingJob{
 const calc=calculateFurniture(input),job:CuttingJob={sheets:[],parts:[],unplaced:[],errors:[...calc.blockingErrors.map(e=>e.message),...cuttingSettingsIssues(s)],groups:[],utilization:0,area:0};
 if(job.errors.length)return job;
 const grouped=new Map<string,JobPart[]>();
 for(const p of calc.panels){const a=input.panelOverrides?.[p.panelId],stock={width:a?.stockWidthMm??input.stockWidthMm,height:a?.stockHeightMm??input.stockHeightMm,thickness:p.thicknessMm};
  const key=JSON.stringify([a?.boardId??'unassigned',stock.width,stock.height,stock.thickness,a?.frontFinishId??'',a?.backFinishId??'',p.grainAxis,p.materialSlot]);
  const part:JobPart={id:p.panelId,sourceId:p.panelId,name:p.label,width:p.widthMm,height:p.heightMm,quantity:1,boardType:key,thickness:p.thicknessMm,grain:p.grainAxis,category:p.materialSlot,...s.parts[p.panelId]};
  if(!finite(part.width,1,10000)||!finite(part.height,1,10000)||!Number.isInteger(part.quantity)||part.quantity<0||part.quantity>100){job.errors.push(`Invalid worksheet dimensions or quantity for ${p.label}.`);continue;}
  job.parts.push(part);grouped.set(key,[...(grouped.get(key)??[]),part]);
 }
 for(const extra of s.customParts??[]){const base=grouped.get(extra.boardType)?.[0];if(!base||!/^worksheet-[a-z0-9-]+$/.test(extra.id)||typeof extra.name!=='string'||extra.name.length>120||!finite(extra.width,1,10000)||!finite(extra.height,1,10000)||!Number.isInteger(extra.quantity)||extra.quantity<0||extra.quantity>100){job.errors.push('Invalid additional worksheet part.');continue;}const part={...base,...extra,thickness:base.thickness,grain:base.grain,category:base.category,sourceId:''};job.parts.push(part);grouped.get(extra.boardType)!.push(part);}
 if(job.parts.reduce((n,p)=>n+p.quantity,0)>512)job.errors.push('A worksheet supports up to 512 part instances.');
 if(job.errors.length)return job;
 for(const [key,parts]of grouped){const original=JSON.parse(key),stock=s.stocks[key]??{width:original[1],height:original[2],thickness:original[3]},id='stock-'+(job.groups.length+1),label=`${stock.materialName??parts[0].category} · ${stock.thickness} mm · ${stock.width} × ${stock.height} · ${parts[0].grain} grain`;
  job.groups.push({id:key,label,stock});
  if(!finite(stock.width,1,10000)||!finite(stock.height,1,10000)||!finite(stock.thickness,.1,100)||stock.width<=2*s.margin||stock.height<=2*s.margin){job.errors.push('Stock must have positive usable dimensions and thickness.');continue;}
  const rotation=s.rotation&&parts[0].grain==='none'&&!parts.some(p=>p.pocketEngraving?.enabled||p.notches?.length),fit:Panel[]=[];
  for(const p of parts)for(let i=0;i<p.quantity;i++){const instance={...p,id:p.id+'#'+(i+1),name:p.id+'#'+(i+1),quantity:1};if((p.width<=stock.width-2*s.margin&&p.height<=stock.height-2*s.margin)||(rotation&&p.height<=stock.width-2*s.margin&&p.width<=stock.height-2*s.margin))fit.push(instance);else job.unplaced.push({panelId:instance.id,reason:'Panel does not fit usable stock in an allowed grain orientation.'});}
  // Grain is part of the stock key, so locked and freely rotating parts never share a packing call.
  const bins=nestPanels(fit,stock.width,stock.height,s.spacing,rotation,s.margin,s.algorithm);
  const seen=new Set<string>();
  for(const [index,bin]of bins.entries()){
   for(const r of bin.rects){if(seen.has(r.name)||!fit.some(p=>p.id===r.name))job.errors.push('Duplicate or unknown nested part.');seen.add(r.name);
    if([r.x,r.y,r.width,r.height].some(n=>!Number.isFinite(n))||r.x<s.margin-.001||r.y<s.margin-.001||r.x+r.width>stock.width-s.margin+.001||r.y+r.height>stock.height-s.margin+.001)job.errors.push('Placement exceeds usable stock.');
    const source=fit.find(p=>p.id===r.name)!;if(!source||!((r.width===source.width&&r.height===source.height)||(rotation&&r.width===source.height&&r.height===source.width)))job.errors.push('Invalid rotation or part size.');
    for(const other of bin.rects)if(r!==other&&r.x<other.x+other.width+s.spacing-.001&&other.x<r.x+r.width+s.spacing-.001&&r.y<other.y+other.height+s.spacing-.001&&other.y<r.y+r.height+s.spacing-.001)job.errors.push('Panel collision or insufficient spacing.');
   }
   if(bin.rects.length)job.sheets.push({...bin,id:`${id}-sheet-${index+1}`,groupId:key,thickness:stock.thickness,label});
  }
  for(const p of fit)if(!seen.has(p.id))job.unplaced.push({panelId:p.id,reason:'Nesting engine could not place this part.'});
 }
 job.area=job.parts.reduce((n,p)=>n+p.width*p.height*p.quantity,0);const purchased=job.sheets.reduce((n,b)=>n+b.width*b.height,0),placed=job.sheets.reduce((n,b)=>n+b.rects.reduce((a,r)=>a+r.width*r.height,0),0);job.utilization=purchased?placed/purchased:0;job.errors=[...new Set(job.errors)];return job;
}
export function generateSheetCode(sheet:JobSheet,s:CuttingSettings){
 const issues=cuttingSettingsIssues(s);if(issues.length)throw new Error(issues.join(' '));
 if(s.spacing<s.toolDiameter||s.margin<s.toolDiameter)throw new Error('G-code requires panel spacing and outer margin at least equal to tool diameter.');
 const depth=s.depth||sheet.thickness;if(depth>sheet.thickness)throw new Error('Cut depth exceeds stock thickness.');
 for(const r of sheet.rects){if(r.notches?.length&&s.cutOrder!=='one-by-one')throw new Error('Notched parts require One by one cut order.');validateOperations(r.pocketEngraving,r.notches,r.width,r.height,depth,s.toolDiameter);}
 const code=generateGCode([structuredClone(sheet)],depth,s.orientation,s.passes,s.toolDiameter,s.cutOrder,s.safeZ,{feedRate:s.feed*s.feedPercent/100,plungeRate:s.plunge,spindleSpeed:s.spindle});
 if(/NaN|Infinity/.test(code))throw new Error('Non-finite toolpath.');
 return '; UNQUALIFIED WORKSHEET - VERIFY CONTROLLER, TOOLING AND HOLD-DOWN BEFORE MACHINE USE\n'+code;
}
export function validateOperations(pocket:PocketEngraving|undefined,notches:Notch[]|undefined,w:number,h:number,depth:number,tool:number){
 if(pocket?.enabled){const horizontal=['top-back','bottom-back'].includes(pocket.side),span=horizontal?w:h,cross=horizontal?h:w;if(!['left-back','right-back','top-back','bottom-back'].includes(pocket.side)||!finite(pocket.width,tool,cross)||!finite(pocket.depth,.1,depth)||!finite(pocket.offsetFromEdge,pocket.width/2,cross-pocket.width/2)||!finite(pocket.gapStart??0,0,span)||!finite(pocket.gapEnd??0,0,span)||(pocket.gapStart??0)+(pocket.gapEnd??0)>=span)throw new Error('Pocket width, depth, offset or end gaps exceed this panel.');}
 if((notches?.length??0)>4)throw new Error('At most four corner notches per panel.');
 for(const n of notches??[])if(!['top-left','top-right','bottom-left','bottom-right'].includes(n.side)||!finite(n.width,tool,w/2)||!finite(n.height,tool,h/2))throw new Error('Notch must fit within half the panel width and height.');
}
export function partsCsv(parts:JobPart[],unit:'mm'|'in'){
 const scale=unit==='in'?25.4:1,escape=(v:string)=>'"'+(/^[=+@\t\r-]/.test(v)?"'":'')+v.replaceAll('"','""')+'"';
 return `Name,Type,Width (${unit}),Height (${unit}),Quantity,Material,Thickness (mm)\n`+parts.map(p=>[escape(p.name),'Panel',p.width/scale,p.height/scale,p.quantity,escape(p.category),p.thickness].join(',')).join('\n');
}
export type {Circle,Notch,PocketEngraving,GCodeAlgorithm,PackingAlgorithm};
