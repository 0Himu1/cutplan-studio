import type { CabinetInput, Panel } from './cabinet.ts';
import {allocateHeight} from './cabinet-allocation.ts';

export type DrawerConfig={id:string;heightMm:number;depthMm:number};
export type CabinetSection={id:string;heightMm:number;type:'open'|'shelf'|'hanging'|'drawer'|'divider';shelfCount:number;shelfMode:'fixed'|'adjustable';external:boolean;rodOffsetMm:number;slideClearanceMm:number;drawers:DrawerConfig[];children:CabinetCompartment[]};
export type CabinetCompartment={id:string;widthMm:number;doorCount:number;sections:CabinetSection[]};
export type CabinetHardware={id:string;label:string;lengthMm:number;diameterMm:number;positionMm:[number,number,number]};
export const sectionDefault=(id:string):CabinetSection=>({id,heightMm:0,type:'open',shelfCount:1,shelfMode:'fixed',external:false,rodOffsetMm:50,slideClearanceMm:12.7,drawers:[{id:'drawer-1',heightMm:150,depthMm:0}],children:[]});
export const compartmentDefault=(id:string,widthMm:number,doorCount=2):CabinetCompartment=>({id,widthMm,doorCount,sections:[sectionDefault('section-1')]});
export function cabinetExtras(c:CabinetInput){
 const normalize=(v:CabinetCompartment):CabinetCompartment=>({id:v.id,widthMm:v.widthMm,doorCount:v.doorCount,sections:v.sections.map(s=>({id:s.id,heightMm:s.heightMm,type:s.type,shelfCount:s.shelfCount,shelfMode:s.shelfMode,external:s.external,rodOffsetMm:s.rodOffsetMm,slideClearanceMm:s.slideClearanceMm,drawers:s.drawers.map(d=>({id:d.id,heightMm:d.heightMm,depthMm:d.depthMm})),children:s.children.map(normalize)}))});
 return {...(c.doorPosition?{doorPosition:c.doorPosition}:{}),...(c.compartmentMode?{compartmentMode:c.compartmentMode}:{}),...(c.compartments?{compartments:c.compartments.map(normalize)}:{})};
}
export function cabinetInterior(c:CabinetInput){const o=c.panelOverrides??{},t=(id:string,n:number)=>o['cabinet/'+id]?.thicknessMm??n;return {width:c.widthMm-t('side-left',c.bodyThicknessMm)-t('side-right',c.bodyThicknessMm),height:c.heightMm-c.skirtingHeightMm-t('top',c.bodyThicknessMm)-t('bottom',c.bodyThicknessMm),x:t('side-left',c.bodyThicknessMm),y:c.skirtingHeightMm+t('bottom',c.bodyThicknessMm)};}
/** Legacy auto-layout groups doors in pairs, targeting at most 18 inches per leaf. */
export function cabinetCompartments(c:CabinetInput):CabinetCompartment[]{
 if(c.compartmentMode==='manual')return c.compartments??[];
 const {width}=cabinetInterior(c),doors=Math.max(1,Math.ceil(width/457.2)),count=Math.min(6,Math.max(c.compartments?.length??0,Math.ceil(doors/2))),clear=width-(count-1)*c.bodyThicknessMm;
 const weights=Array.from({length:count},(_,i)=>Math.max(1,Math.min(2,doors-i*2))),sum=weights.reduce((a,b)=>a+b,0);
 return Array.from({length:count},(_,i)=>{const leaves=weights[i],old=c.compartments?.[i];return {...(old??compartmentDefault('comp-'+(i+1),0,c.doorCount?leaves:0)),widthMm:clear*leaves/sum};});
}

export function cabinetUsableDepth(c:CabinetInput){
 const back=c.panelOverrides?.['cabinet/back']?.thicknessMm??c.backThicknessMm;
 return c.depthMm-back-(c.doorPosition==='overlay'||!cabinetCompartments(c).some(comp=>comp.doorCount)?0:c.doorThicknessMm+c.doorGapMm);
}
/** Legacy side-mounted box default; this is not a hardware-specific undermount specification. */
export function cabinetDrawerDepth(c:CabinetInput,external:boolean){return cabinetUsableDepth(c)-25.4-(external?0:c.bodyThicknessMm);}
/** Minimum allocation implied by existing contents; additions must not shrink them below this. */
export function sectionMinimumHeight(section:CabinetSection,t:number):number{
 if(section.type==='drawer')return section.drawers.reduce((sum,drawer)=>sum+drawer.heightMm,0)+Math.max(0,section.drawers.length-1)*t;
 if(section.type==='shelf')return (section.shelfCount+1)*50+section.shelfCount*t;
 if(section.type==='hanging')return Math.max(50,section.rodOffsetMm+12.5);
 if(section.type==='divider')return Math.max(50,...section.children.map(comp=>comp.sections.reduce((sum,child)=>sum+Math.max(child.heightMm,sectionMinimumHeight(child,t)),0)+Math.max(0,comp.sections.length-1)*t));
 return 50;
}

/** Validate untrusted saved trees before recursion, allocation or geometry generation. */
export function validCompartments(value:unknown):value is CabinetCompartment[]{
 let nodes=0;const ids=new Set<string>();
 const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const num=(x:unknown,min=0,max=100000)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 const id=(x:unknown,path:string)=>{if(typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,32}$/.test(x)||ids.has(path+'/'+x))return false;ids.add(path+'/'+x);return true;};
 const list=(v:unknown,depth:number,path:string):boolean=>Array.isArray(v)&&v.length>0&&v.length<=6&&depth<=3&&v.every(c=>{
  if(++nodes>64||!obj(c)||Object.keys(c).some(k=>!['id','widthMm','doorCount','sections'].includes(k))||!id(c.id,path)||!num(c.widthMm)||!num(c.doorCount,0,2)||!Number.isInteger(c.doorCount)||(depth>0&&c.doorCount!==0)||!Array.isArray(c.sections)||!c.sections.length||c.sections.length>8)return false;
  return c.sections.every(s=>{
   if(++nodes>64||!obj(s)||Object.keys(s).some(k=>!['id','heightMm','type','shelfCount','shelfMode','external','rodOffsetMm','slideClearanceMm','drawers','children'].includes(k))||!id(s.id,path+'/'+c.id)||!num(s.heightMm)||!['open','shelf','hanging','drawer','divider'].includes(String(s.type))||!num(s.shelfCount,0,20)||!Number.isInteger(s.shelfCount)||!['fixed','adjustable'].includes(String(s.shelfMode))||typeof s.external!=='boolean'||!num(s.rodOffsetMm)||!num(s.slideClearanceMm,0,30)||!Array.isArray(s.drawers)||s.drawers.length>6||!Array.isArray(s.children))return false;
   if(s.type==='drawer'&&!s.drawers.length)return false;
   if(!s.drawers.every(d=>obj(d)&&!Object.keys(d).some(k=>!['id','heightMm','depthMm'].includes(k))&&id(d.id,path+'/'+c.id+'/'+s.id)&&num(d.heightMm,50)&&num(d.depthMm)))return false;
   return s.type==='divider'?list(s.children,depth+1,path+'/'+c.id+'/'+s.id):s.children.length===0;
  });
 });return list(value,0,'root');
}

type Add=(id:string,label:string,role:Panel['role'],slot:Panel['materialSlot'],w:number,h:number,t:number,position:Panel['pose']['positionMm'],rotation:Panel['pose']['rotationRad'],hingeSide?:'left'|'right')=>void;
/** All panel cuts and 3D poses share this tree traversal. Rods are hardware, never sheet parts. */
export function buildCompartments(c:CabinetInput,add:Add,error:(field:string,message:string)=>void):CabinetHardware[]{
 const hardware:CabinetHardware[]=[],t=c.bodyThicknessMm,bt=c.panelOverrides?.['cabinet/back']?.thicknessMm??c.backThicknessMm,dt=c.doorThicknessMm,g=c.doorGapMm,overlay=c.doorPosition==='overlay',inner=cabinetInterior(c);
 const compartments=cabinetCompartments(c);
 const depth=cabinetUsableDepth(c);
 if(compartments.some(v=>v.doorCount)&&g<=0)error('doorGapMm','Doors require a positive perimeter and meeting gap.');
 function group(comps:CabinetCompartment[],x:number,y:number,w:number,h:number,path:string,doors:boolean,covered=false){
  const clear=w-(comps.length-1)*t,total=comps.reduce((n,v)=>n+v.widthMm,0);
  if(Math.abs(total-clear)>.1){error('compartments','Compartment widths plus divider thickness must match the available width.');return;}
  let cx=x;
  comps.forEach((comp,ci)=>{
   const id=path+'/'+comp.id,cw=comp.widthMm,allocation=allocateHeight(comp.sections.map(s=>s.heightMm),h,t);
   if(cw<50||!allocation.valid){error('compartments',`Compartment ${ci+1}: reserve ${allocation.dividers} mm for horizontal dividers. Reduce manual heights or select automatic height to fill the remaining space; every section needs 50 mm clear height.`);return;}
   if(ci){add(id+'/partition','Compartment partition','divider','body',depth,h,t,[cx-t/2,y+h/2,bt+depth/2],[0,-Math.PI/2,0]);}
   let sy=y;
   comp.sections.forEach((sec,si)=>{
    const sh=allocation.resolved[si],sid=id+'/'+sec.id,label=`${ci+1}.${si+1}`;
    if(sh<50){error('compartments','Every section needs at least 50 mm clear height.');return;}
    if(si)add(sid+'/separator','Section separator '+label,'shelf','body',cw,depth,t,[cx+cw/2,sy-t/2,bt+depth/2],[-Math.PI/2,0,0]);
    if(sec.type==='shelf'){
     const clearance=sec.shelfMode==='adjustable'?c.shelfSideClearanceMm:0,opening=(sh-sec.shelfCount*t)/(sec.shelfCount+1);
     if(opening<50)error('compartments','Shelves must leave at least 50 mm clear openings.');
     for(let k=0;k<sec.shelfCount;k++)add(sid+'/shelf-'+(k+1),`${sec.shelfMode==='adjustable'?'Adjustable shelf':'Shelf'} ${label}.${k+1}`,'shelf','body',cw-2*clearance,depth,t,[cx+cw/2,sy+opening*(k+1)+t*k+t/2,bt+depth/2],[-Math.PI/2,0,0]);
    }
    if(sec.type==='hanging'){
     if(sec.rodOffsetMm<12.5||sec.rodOffsetMm>sh-12.5||depth<50)error('compartments','The 25 mm hanging rod must fit inside its section.');
     hardware.push({id:sid+'/rod',label:'Hanging rod '+label,lengthMm:cw,diameterMm:25,positionMm:[cx+cw/2,sy+sh-sec.rodOffsetMm,bt+depth/2]});
    }
    if(sec.type==='divider')group(sec.children,cx,sy,cw,sh,sid,false,covered||(doors&&comp.doorCount>0));
    if(sec.type==='drawer'){
     if(covered&&sec.external)error('compartments','Nested external drawers require open parent compartments. Use internal drawers or remove parent doors.');
     let dy=sy;const boxW=cw-2*sec.slideClearanceMm;
     for(const drawer of sec.drawers){const did=sid+'/'+drawer.id,dh=drawer.heightMm,dd=drawer.depthMm||cabinetDrawerDepth(c,sec.external),faceFront=sec.external?c.depthMm+g+dt:c.depthMm-(overlay?0:dt+g)-g,front=faceFront-dt-g;
      if(dy+dh>sy+sh+.1||dh<bt+50||dd<2*t+50||dd>front-bt||boxW<2*t+50)error('compartments','Drawer boxes must fit the section width, height and usable depth.');
      const z=front-dd/2,sideH=dh-bt-25.4;
      if(dy>sy)add(did+'/separator','Drawer support '+label,'shelf','body',cw,76.2,t,[cx+cw/2,dy-t/2,front-38.1],[-Math.PI/2,0,0]);
      add(did+'/bottom','Drawer bottom '+label,'drawer','back',boxW,dd,bt,[cx+cw/2,dy+bt/2,z],[-Math.PI/2,0,0]);
      add(did+'/left','Drawer left '+label,'drawer','body',dd,sideH,t,[cx+sec.slideClearanceMm+t/2,dy+bt+sideH/2,z],[0,-Math.PI/2,0]);
      add(did+'/right','Drawer right '+label,'drawer','body',dd,sideH,t,[cx+cw-sec.slideClearanceMm-t/2,dy+bt+sideH/2,z],[0,-Math.PI/2,0]);
      for(const end of ['back','front'] as const){const faceH=end==='front'?Math.min(sideH,Math.max(76.2,sideH-63.5)):sideH;add(did+'/'+end,'Drawer box '+end+' '+label,'drawer','body',boxW-2*t,faceH,t,[cx+cw/2,dy+bt+faceH/2,end==='back'?front-dd+t/2:front-t/2],[0,0,0]);}
      add(did+'/face','Drawer face '+label,'drawer','front',cw-2*g,dh-2*g,dt,[cx+cw/2,dy+dh/2,faceFront-dt/2],[0,0,0]);
      dy+=dh+t;
     }
    }
    // External drawer sections replace doors over their own height; other sections receive independent leaves.
    if(doors&&comp.doorCount&&!(sec.type==='drawer'&&sec.external)){
     const left=overlay?(ci===0?0:cx-t/2):cx,right=overlay?(ci===comps.length-1?c.widthMm:cx+cw+t/2):cx+cw,doorW=(right-left-(comp.doorCount+1)*g)/comp.doorCount;
     const bottom=overlay&&si===0?c.skirtingHeightMm:sy,top=overlay&&si===comp.sections.length-1?c.heightMm:sy+sh;
     for(let k=0;k<comp.doorCount;k++)add(sid+'/door-'+(k+1),'Door '+label+'.'+(k+1),'door','front',doorW,top-bottom-2*g,dt,[left+g+doorW/2+k*(doorW+g),bottom+(top-bottom)/2,overlay?c.depthMm+g+dt/2:c.depthMm-dt/2],[0,0,0],k===0?'left':'right');
    }
    sy+=sh+t;
   });cx+=cw+t;
  });
 }
 if(depth<50)error('compartments','The layout needs at least 50 mm usable depth.');
 group(compartments,inner.x,inner.y,inner.width,inner.height,'layout',true);
 return hardware;
}
