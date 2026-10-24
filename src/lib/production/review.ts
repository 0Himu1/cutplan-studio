import {calculateFurniture,furnitureInput,type FurnitureInput} from '../furniture/families.ts';
import {nestFurniture,validateNesting,type NestingPlan,type Sheet} from '../furniture/nesting.ts';
export const PRODUCTION_RELEASE_ENABLED=false;
export const POSTPROCESSOR='rectangular-skin-review-1';
export type ReviewProfile={id:string;version:string;synthetic:true;dialect:'review-iso-subset';origin:'sheet-bottom-left-stock-top';widthMm:number;heightMm:number;maxThicknessMm:number;toolDiameterMm:number;feedMmMin:number;plungeMmMin:number;spindleRpm:number;safeZMm:number;passDepthMm:number;retainedSkinMm:number;holdDown:'unqualified-review-only';operations:['rectangular_profile']};
export type FrozenJob={revisionId:string;revisionHash:string;engineVersion:string;templateKey:string;input:FurnitureInput;nesting:NestingPlan};
export type ReviewFile={sheetId:string;name:string;text:string;sha256:string;lines:number};
export type ReviewPackage={schemaVersion:1;purpose:'simulation_only';machineUseAllowed:false;postprocessor:string;revisionId:string;revisionHash:string;inputHash:string;nestingHash:string;profileHash:string;frozen:FrozenJob;profile:ReviewProfile;packageHash:string;files:ReviewFile[]};
export async function digest(value:unknown){const bytes=new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
export const syntheticProfile:ReviewProfile={id:'synthetic-review',version:'1',synthetic:true,dialect:'review-iso-subset',origin:'sheet-bottom-left-stock-top',widthMm:1300,heightMm:2500,maxThicknessMm:40,toolDiameterMm:3,feedMmMin:1200,plungeMmMin:300,spindleRpm:12000,safeZMm:12,passDepthMm:4,retainedSkinMm:1,holdDown:'unqualified-review-only',operations:['rectangular_profile']};
export function freezeReview(input:FurnitureInput):FrozenJob{const c=calculateFurniture(input);return {revisionId:'synthetic-revision',revisionHash:'synthetic-not-an-accepted-order',engineVersion:c.engineVersion,templateKey:c.templateKey,input:structuredClone(input),nesting:nestFurniture(input)};}
export function productionIssues(job:FrozenJob,p:ReviewProfile):string[]{
 const issues:string[]=[],input=furnitureInput(job.input),calc=calculateFurniture(job.input),n=job.nesting;
 if(!input||calc.blockingErrors.length||job.engineVersion!==calc.engineVersion||job.templateKey!==calc.templateKey||!job.revisionId||!job.revisionHash)issues.push('Invalid or unsupported frozen revision.');
 if(!n||n.inputKey!==JSON.stringify(input)||n.algorithm!=='shelf-first-fit-1'||n.errors.length||n.unplaced.length||!n.sheets.length||n.sheets.length>100||calc.panels.length>500)issues.push('Frozen nesting is incomplete or belongs to another design.');
 if(n)issues.push(...validateNesting(n,calc.panels,input??undefined));
 if(!p||p.synthetic!==true||p.dialect!=='review-iso-subset'||p.origin!=='sheet-bottom-left-stock-top'||p.holdDown!=='unqualified-review-only'||p.operations?.join(',')!=='rectangular_profile')return [...issues,'Only the explicit synthetic review profile is supported.'];
 for(const [key,min,max] of [['widthMm',1,10000],['heightMm',1,10000],['maxThicknessMm',1,100],['toolDiameterMm',.1,30],['feedMmMin',1,20000],['plungeMmMin',1,3000],['spindleRpm',1000,30000],['safeZMm',1,100],['passDepthMm',.1,10],['retainedSkinMm',.5,5]] as const){const v=p[key];if(!Number.isFinite(v)||v<min||v>max)issues.push(`Profile ${key} is invalid.`);}
 if(p.plungeMmMin>p.feedMmMin||!Number.isInteger(p.spindleRpm))issues.push('Invalid plunge feed or spindle speed.');
 if(n){if(!Number.isFinite(n.kerf)||!Number.isFinite(n.margin)||n.kerf<p.toolDiameterMm||n.margin<p.toolDiameterMm)issues.push('Accepted spacing or margin cannot accommodate the tool.');
 for(const s of n.sheets){if(s.width>p.widthMm||s.height>p.heightMm||!Number.isFinite(s.width)||!Number.isFinite(s.height)||s.width<=0||s.height<=0||!/^[a-z0-9-]{1,80}$/.test(s.id)||!s.placements.length)issues.push('Sheet exceeds machine bounds or has an invalid identity.');
 for(const a of s.placements){if([a.x,a.y,a.width,a.height].some(v=>!Number.isFinite(v)))issues.push('Non-finite placement.');const panel=calc.panels.find(v=>v.panelId===a.panelId);if(!panel||panel.thicknessMm>p.maxThicknessMm||panel.thicknessMm<=p.retainedSkinMm||Math.ceil((panel.thicknessMm-p.retainedSkinMm)/p.passDepthMm)>40)issues.push('Stock thickness or pass count is unsupported.');}}
 if(new Set(n.sheets.map(s=>s.id)).size!==n.sheets.length)issues.push('Duplicate sheet identity.');}
 return [...new Set(issues)];
}
const fixed=(n:number)=>n.toFixed(3);
/** Simulation only: bottom-left sheet XY, stock-top Z, external tool-center rectangle, retained skin; no through-cut. */
function sheetText(s:Sheet,job:FrozenJob,p:ReviewProfile):string{
 const lines=['; SIMULATION ONLY - NOT FOR MACHINE USE','G21','G90','G17',`G0 Z${fixed(p.safeZMm)}`,`M3 S${p.spindleRpm}`],panels=calculateFurniture(job.input).panels,r=p.toolDiameterMm/2;
 for(const a of s.placements){const panel=panels.find(v=>v.panelId===a.panelId)!,depth=panel.thicknessMm-p.retainedSkinMm,count=Math.ceil(depth/p.passDepthMm),x=a.x-r,y=a.y-r,w=a.width+2*r,h=a.height+2*r;
  lines.push(`; PANEL ${panel.panelId}`);
  for(let pass=1;pass<=count;pass++){lines.push(`G0 Z${fixed(p.safeZMm)}`,`G0 X${fixed(x)} Y${fixed(y)}`,`G1 Z${fixed(-Math.min(depth,pass*p.passDepthMm))} F${fixed(p.plungeMmMin)}`,`G1 X${fixed(x+w)} Y${fixed(y)} F${fixed(p.feedMmMin)}`,`G1 X${fixed(x+w)} Y${fixed(y+h)} F${fixed(p.feedMmMin)}`,`G1 X${fixed(x)} Y${fixed(y+h)} F${fixed(p.feedMmMin)}`,`G1 X${fixed(x)} Y${fixed(y)} F${fixed(p.feedMmMin)}`,`G0 Z${fixed(p.safeZMm)}`);}
 }
 lines.push('M5','M30');return lines.join('\n')+'\n';
}
/** Separate strict parser checks every motion, setup, cut loop and safe retract; rejects unknown words and code. */
export function simulate(text:string,sheet:Sheet,job:FrozenJob,p:ReviewProfile):string[]{
 const errors:string[]=[],lines=text.split('\n').filter(l=>l&&!l.startsWith(';'));let z=NaN,x=NaN,y=NaN,spindle=false,started=false,cut=0,loopStart:[number,number]|null=null,lastDepth=0;
 const expectedSetup=['G21','G90','G17'];let setup=0,ended=false;
 for(const line of lines){
  if(ended){errors.push('Commands after program end.');break;}
  if(setup<3){if(line!==expectedSetup[setup++])errors.push('Invalid modal setup.');continue;}
  if(line===`M3 S${p.spindleRpm}`){if(spindle||started||z!==p.safeZMm)errors.push('Unsafe spindle start.');spindle=true;continue;}
  if(line==='M5'){if(!spindle||cut!==0||z!==p.safeZMm)errors.push('Unsafe spindle stop.');spindle=false;continue;}
  if(line==='M30'){if(spindle||z!==p.safeZMm||cut)errors.push('Unsafe end state.');ended=true;continue;}
  let m=/^(G0|G1) Z(-?\d+\.\d{3})(?: F(\d+\.\d{3}))?$/.exec(line);
  if(m){const next=Number(m[2]);if(m[1]==='G0'){if(next!==p.safeZMm||m[3])errors.push('Unsafe rapid Z.');if(cut){if(cut!==4||!loopStart||Math.abs(x-loopStart[0])>.002||Math.abs(y-loopStart[1])>.002)errors.push('Open contour.');cut=0;loopStart=null;}}else{if(!spindle||!Number.isFinite(x)||z!==p.safeZMm||next>=0||next< -p.maxThicknessMm||Number(m[3])!==p.plungeMmMin||cut)errors.push('Unsafe plunge.');loopStart=[x,y];lastDepth=next;started=true;}
   z=next;continue;
  }
  m=/^(G0|G1) X(-?\d+\.\d{3}) Y(-?\d+\.\d{3})(?: F(\d+\.\d{3}))?$/.exec(line);
  if(m){const nx=Number(m[2]),ny=Number(m[3]),r=p.toolDiameterMm/2;if(nx-r<-.002||ny-r<-.002||nx+r>sheet.width+.002||ny+r>sheet.height+.002||nx+r>p.widthMm+.002||ny+r>p.heightMm+.002)errors.push('Tool exceeds stock or machine.');if(m[1]==='G0'){if(z!==p.safeZMm||m[4]||cut||loopStart)errors.push('Unsafe rapid XY.');}else{if(!spindle||z>=0||z!==lastDepth||!loopStart||Number(m[4])!==p.feedMmMin||(++cut)>4)errors.push('Unsafe cutting move.');}x=nx;y=ny;continue;}
  errors.push('Unsupported instruction.');
 }
 if(!ended||!started||setup!==3)errors.push('Incomplete program.');
 // Exact geometry audit also verifies panel coverage, pass depths/order and immutable placement preservation.
 if(text!==sheetText(sheet,job,p))errors.push('Toolpath differs from the frozen rectangular plan.');
 return [...new Set(errors)];
}
export async function buildReview(job:FrozenJob,p:ReviewProfile):Promise<ReviewPackage>{
 const issues=productionIssues(job,p);if(issues.length)throw new Error(issues.join(' '));
 const files:ReviewFile[]=[];
 for(const sheet of job.nesting.sheets){const text=sheetText(sheet,job,p),errors=simulate(text,sheet,job,p);if(errors.length)throw new Error(errors.join(' '));files.push({sheetId:sheet.id,name:sheet.id+'.simulation.txt',text,sha256:await digest(text),lines:text.split('\n').length-1});}
 const manifest={schemaVersion:1 as const,purpose:'simulation_only' as const,machineUseAllowed:false as const,postprocessor:POSTPROCESSOR,revisionId:job.revisionId,revisionHash:job.revisionHash,inputHash:await digest(job.input),nestingHash:await digest(job.nesting),profileHash:await digest(p),frozen:structuredClone(job),profile:structuredClone(p),files};
 return {...manifest,packageHash:await digest(manifest)};
}
