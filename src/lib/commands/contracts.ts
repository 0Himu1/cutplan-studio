import {calculateFurniture,familyOf,furnitureInput,type FurnitureInput} from '../furniture/families.ts';
import {configurationKey} from '../furniture/editor.ts';
export type Command={op:'setDimension';axis:'widthMm'|'heightMm'|'depthMm';mm:number}|{op:'addShelf'|'removeShelf'};
export type CommandProposal={schemaVersion:1;source:'local_command_demo';baseKey:string;commands:Command[]};
/** Provider output is untrusted. Reconstruct only allowlisted fields; never spread it into a design. */
export function applyCommands(value:unknown,input:FurnitureInput):FurnitureInput|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const p=value as CommandProposal;
 if(Object.keys(p).sort().join(',')!=='baseKey,commands,schemaVersion,source'||p.schemaVersion!==1||p.source!=='local_command_demo'||p.baseKey!==configurationKey(input)||!Array.isArray(p.commands)||p.commands.length<1||p.commands.length>4)return null;
 let next=structuredClone(input);
 for(const c of p.commands){
  if(!c||typeof c!=='object'||Array.isArray(c))return null;
  if(c.op==='setDimension'){
   if(Object.keys(c).sort().join(',')!=='axis,mm,op'||!['widthMm','heightMm','depthMm'].includes(c.axis)||!Number.isFinite(c.mm)||c.mm<=0||c.mm>10000)return null;
   next={...next,[c.axis]:c.mm};
  }else if(c.op==='addShelf'||c.op==='removeShelf'){
   if(Object.keys(c).join(',')!=='op'||familyOf(next)==='table')return null;
   next={...next,shelfCount:next.shelfCount+(c.op==='addShelf'?1:-1)};
  }else return null;
 }
 const valid=furnitureInput(next);
 return valid&&!calculateFurniture(valid).blockingErrors.length&&configurationKey(valid)!==configurationKey(input)?valid:null;
}
/** Deliberately small offline grammar. No provider, eval, code execution or hidden side effects. */
export function proposeCommand(text:string,input:FurnitureInput):CommandProposal|null{
 if(typeof text!=='string'||text.length>200)return null;
 const commands:Command[]=[];
 for(const part of text.trim().toLowerCase().split(/\s*;\s*/)){
  if(part==='add a shelf'||part==='add shelf')commands.push({op:'addShelf'});
  else if(part==='remove a shelf'||part==='remove shelf')commands.push({op:'removeShelf'});
  else{const m=/^(?:set )?(width|height|depth)(?: to)? (\d{1,5}(?:\.\d{1,3})?) (mm|cm|in)$/.exec(part);if(!m)return null;commands.push({op:'setDimension',axis:(m[1]+'Mm') as 'widthMm'|'heightMm'|'depthMm',mm:Math.round(Number(m[2])*(m[3]==='cm'?10:m[3]==='in'?25.4:1)*1000)/1000});}
 }
 const p:CommandProposal={schemaVersion:1,source:'local_command_demo',baseKey:configurationKey(input),commands};
 return applyCommands(p,input)?p:null;
}
