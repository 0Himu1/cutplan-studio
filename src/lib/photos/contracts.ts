import {calculateFurniture,defaultFurniture,familyOf,furnitureInput,type FurnitureInput,type SupportedFamily} from '../furniture/families.ts';
export const MAX_PHOTO_BYTES=10*1024*1024,MAX_PHOTO_PIXELS=20000000;
export type Purpose='space'|'reference';
export type PhotoProposal={schemaVersion:1;source:'labelled_demo';purpose:Purpose;family:SupportedFamily;confidence:'not_assessed';baseKey:string;configuration:FurnitureInput;assumptions:string[]};
export function imageKind(bytes:Uint8Array):'jpeg'|'png'|'webp'|null{
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'png';
 if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';return null;
}
export function demoPhotoProposal(family:SupportedFamily,purpose:Purpose,measurements:{widthMm:number;heightMm:number;depthMm:number},baseKey:string):PhotoProposal|null{
 if(!['cabinet','shoe_rack','bookshelf','table'].includes(family)||!['space','reference'].includes(purpose)||!baseKey||Object.values(measurements).some(v=>!Number.isFinite(v)||v<=0))return null;
 const configuration=furnitureInput({...defaultFurniture(family),...measurements});if(!configuration)return null;
 return {schemaVersion:1,source:'labelled_demo',purpose,family,confidence:'not_assessed',baseKey,configuration,assumptions:['Demonstration only: the photo was not analyzed by AI.','Dimensions come from your measurements, never from pixels.','Uses the current supported family template; no style or load inference.']};
}
export function proposalInput(value:unknown,family:SupportedFamily,baseKey:string):FurnitureInput|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;const p=value as PhotoProposal;
 if(Object.keys(p).sort().join(',')!=='assumptions,baseKey,confidence,configuration,family,purpose,schemaVersion,source'||p.schemaVersion!==1||p.source!=='labelled_demo'||p.confidence!=='not_assessed'||p.family!==family||p.baseKey!==baseKey||!['space','reference'].includes(p.purpose)||!Array.isArray(p.assumptions)||p.assumptions.length>5||p.assumptions.some(s=>typeof s!=='string'||s.length>240))return null;
 const input=furnitureInput(p.configuration);return input&&familyOf(input)===family&&!calculateFurniture(input).blockingErrors.length?input:null;
}
