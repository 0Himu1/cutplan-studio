import {materialForPanel} from '../furniture/materials.ts';
import {calculateFurniture,type FurnitureInput} from '../furniture/families.ts';
import {nestFurniture,type NestingPlan} from '../furniture/nesting.ts';
export type Policy={version:string;approved:boolean;approvalReference:string;templates:string[];engineVersion:string;machine:{version:string;approvalReference:string;maxWidthMm:number;maxHeightMm:number;spacingMm:number;marginMm:number};laborMinor:number;deliveryMinor:number;marginBps:number;taxBps:number;discountMinor:number;areas:string[];finishesIncluded:boolean;edgingIncluded:boolean;hardwareIncluded:boolean};
export type Price={itemId:string;versionId:string;unit:'sheet'|'square_meter'|'meter'|'piece';minor:string};
export type QuoteLine={kind:'board'|'finish'|'edging'|'labor'|'delivery'|'assembly_guide';label:string;quantity:string;unit:string;unitPriceMinor:string;amountMinor:string;priceVersionId?:string;itemId?:string};
export type FurnitureSummary={family:string;widthMm:number;heightMm:number;depthMm:number;panelCount:number};
export type QuoteSnapshot={summary:FurnitureSummary;schemaVersion:1;formulaVersion:'bdt-half-up-1';rounding:'line-half-up-2dp';currency:'BDT';projectId:string;revisionId:string;revisionHash:string;policyVersion:string;policy:Policy;nesting:NestingPlan;lines:QuoteLine[];subtotalMinor:string;taxMinor:string;discountMinor:string;totalMinor:string};
export const money=(minor:string)=>{const n=BigInt(minor);return `${n/100n}.${(n%100n).toString().padStart(2,'0')}`;};
export function decimalMinor(value:string):string|null {if(!/^\d{1,12}(?:\.\d{1,2})?$/.test(value))return null;const [whole,fraction='']=value.split('.');return (BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'))).toString();}
const round=(n:bigint,d:bigint)=>(n+d/2n)/d;
export function validPolicy(p:Policy|undefined):p is Policy {
 if(!p||!p.approved||!p.version||!p.approvalReference||!Array.isArray(p.templates)||!p.templates.length||!p.engineVersion||!p.machine?.version||!p.machine.approvalReference||!Array.isArray(p.areas)||!p.areas.length||p.areas.some(a=>typeof a!=='string'||a.length>80||a.length<2))return false;
 if([p.version,p.engineVersion,p.approvalReference,p.machine.version,p.machine.approvalReference].some(v=>typeof v!=='string'||v.length<1||v.length>160||/[\u0000-\u001f\u007f]/.test(v))||p.templates.length>20||p.templates.some(v=>typeof v!=='string'||v.length<1||v.length>100)||p.areas.some(v=>/[\u0000-\u001f\u007f]/.test(v)))return false;
 if([p.laborMinor,p.deliveryMinor,p.marginBps,p.taxBps,p.discountMinor].some(n=>!Number.isSafeInteger(n)||n<0||n>1000000000)||p.marginBps>10000||p.taxBps>10000)return false;
 return [p.finishesIncluded,p.edgingIncluded,p.hardwareIncluded].every(v=>typeof v==='boolean')&&[p.machine.maxWidthMm,p.machine.maxHeightMm].every(n=>Number.isFinite(n)&&n>0&&n<=100000)&&Number.isFinite(p.machine.spacingMm)&&p.machine.spacingMm>=0&&p.machine.spacingMm<=30&&Number.isFinite(p.machine.marginMm)&&p.machine.marginMm>=0&&p.machine.marginMm<=1000;
}
export function priceQuote(input:FurnitureInput,policy:Policy|undefined,prices:Price[],identity:Pick<QuoteSnapshot,'projectId'|'revisionId'|'revisionHash'>):{issues:string[];snapshot?:QuoteSnapshot} {
 const calc=calculateFurniture(input),issues=calc.blockingErrors.map(e=>e.message);
 if(!validPolicy(policy))return {issues:[...issues,'Approved pricing, construction and Dhaka delivery policy is not configured.']};
 if(!policy.templates.includes(calc.templateKey)||policy.engineVersion!==calc.engineVersion)issues.push('This construction and engine version have not been approved for ordering.');
 if(!policy.hardwareIncluded)issues.push('An approved hardware schedule and price inclusion is required.');
 const nesting=nestFurniture(input,policy.machine.spacingMm,policy.machine.marginMm);issues.push(...nesting.errors);if(nesting.unplaced.length)issues.push(`${nesting.unplaced.length} panels remain unplaced.`);
 if(nesting.sheets.some(s=>s.width>policy.machine.maxWidthMm||s.height>policy.machine.maxHeightMm))issues.push('Stock exceeds the approved manufacturing capability envelope.');
 const lines:QuoteLine[]=[];
 function add(kind:QuoteLine['kind'],label:string,quantity:bigint,denominator:bigint,price:Price|undefined){if(!price||!/^\d{1,16}$/.test(price.minor)){issues.push(`${label}: an active versioned selling price is required.`);return;}const amount=round(BigInt(price.minor)*quantity*BigInt(10000+policy!.marginBps),denominator*10000n);lines.push({kind,label,quantity:denominator===1n?quantity.toString():`${quantity/denominator}.${(quantity%denominator).toString().padStart(denominator.toString().length-1,'0')}`.replace(/0+$/,'').replace(/\.$/,''),unit:price.unit,unitPriceMinor:price.minor,amountMinor:amount.toString(),priceVersionId:price.versionId,itemId:price.itemId});}
 for(const group of nesting.groups){const spec=JSON.parse(group.stockKey),count=nesting.sheets.filter(s=>s.groupId===group.id).length;if(!count)continue;const price=prices.find(p=>p.itemId===spec[0]&&p.unit==='sheet');add('board',`Board sheets (${group.id})`,BigInt(count),1n,price);}
 for(const panel of calc.panels){const a=materialForPanel(input,panel);if(!a?.boardId)issues.push(`${panel.label}: assign a published board.`);
  if(!policy.finishesIncluded)for(const face of [a?.frontFinishId,a?.backFinishId])if(face){const price=prices.find(p=>p.itemId===face);const micrometers=BigInt(Math.round(panel.widthMm*1000))*BigInt(Math.round(panel.heightMm*1000));add('finish',`Face finish (${panel.panelId})`,micrometers,1000000000000n,price?.unit==='square_meter'?price:undefined);}
  if(!policy.edgingIncluded)for(const [edge,item] of Object.entries(a?.edges??{})){const length=['top','bottom'].includes(edge)?panel.widthMm:panel.heightMm;add('edging',`Edging (${panel.panelId}, ${edge})`,BigInt(Math.round(length*1000)),1000000n,prices.find(p=>p.itemId===item&&p.unit==='meter'));}
 }
 lines.push({kind:'labor',label:'Labor (approved inclusions)',quantity:'1',unit:'job',unitPriceMinor:String(policy.laborMinor),amountMinor:String(policy.laborMinor)},{kind:'delivery',label:'Dhaka delivery',quantity:'1',unit:'delivery',unitPriceMinor:String(policy.deliveryMinor),amountMinor:String(policy.deliveryMinor)},{kind:'assembly_guide',label:'Assembly guide',quantity:'1',unit:'guide',unitPriceMinor:'0',amountMinor:'0'});
 if(issues.length)return {issues:[...new Set(issues)]};
 const subtotal=lines.reduce((n,l)=>n+BigInt(l.amountMinor),0n),tax=round(subtotal*BigInt(policy.taxBps),10000n),discount=BigInt(policy.discountMinor),total=subtotal+tax-discount;
 if(total<0n||total>99999999999999n)return {issues:['Total exceeds supported BDT range or discount exceeds charges.']};
 return {issues:[],snapshot:{summary:{family:input.family??'cabinet',widthMm:input.widthMm,heightMm:input.heightMm,depthMm:input.depthMm,panelCount:calc.panels.length},schemaVersion:1,formulaVersion:'bdt-half-up-1',rounding:'line-half-up-2dp',currency:'BDT',...identity,policyVersion:policy.version,policy:structuredClone(policy),nesting,lines,subtotalMinor:subtotal.toString(),taxMinor:tax.toString(),discountMinor:discount.toString(),totalMinor:total.toString()}};
}
export type Address={recipient:string;phone:string;area:string;address:string};
export function addressInput(value:unknown,areas:string[]):Address|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;const a=value as Record<string,unknown>;
 if(Object.keys(a).sort().join(',')!=='address,area,phone,recipient'||Object.values(a).some(v=>typeof v!=='string'||/[\u0000-\u001f\u007f]/.test(v as string)))return null;
 const result=Object.fromEntries(Object.entries(a).map(([k,v])=>[k,(v as string).trim()])) as Address;result.phone=result.phone.replace(/[ -]/g,'').replace(/^\+88/,'');
 return result.recipient.length>=2&&result.recipient.length<=100&&/^01[3-9]\d{8}$/.test(result.phone)&&areas.includes(result.area)&&result.address.length>=12&&result.address.length<=400?result:null;
}
