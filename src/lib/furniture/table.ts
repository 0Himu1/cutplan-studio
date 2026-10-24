import type { Calculation, Panel } from './cabinet.ts';
import type { FurnitureInput } from './families.ts';
import { CABINET_FIXTURES } from './cabinet-fixtures.ts';
import { parseOverrides } from './materials.ts';

/** Rectangular panel trestle, intentionally excludes unsupported legs, drawers and shaped tops. */
export function calculateTable(c: FurnitureInput): Calculation {
  const r:Calculation={schemaVersion:1,engineVersion:'casework-review-1.0.0',templateKey:'table-panel-trestle-v1',manufacturingApproved:false,eligibleForQuote:false,panels:[],blockingErrors:[],warnings:['Proposed panel-trestle preview. Joints, fixing, stability and load capacity need approval. No quote or machine release.']};
  const fail=(field:string,message:string)=>r.blockingErrors.push({field,message});
  const base=CABINET_FIXTURES[0].input;
  for(const key of Object.keys(c))if(![...Object.keys(base),'family','tableKind','panelOverrides'].includes(key))fail(key,'Unsupported table option.');
  for(const [key,value] of Object.entries(base))if(typeof value==='number'&&(typeof c[key as keyof FurnitureInput]!=='number'||!Number.isFinite(c[key as keyof FurnitureInput])||Math.abs(Number(c[key as keyof FurnitureInput]))>100000))fail(key,'Use finite measurements within the supported range.');
  if(!['study','dining','side'].includes(c.tableKind??''))fail('tableKind','Choose study, dining or side table.');
  if(c.doorCount!==0||c.shelfCount!==0||c.skirtingHeightMm!==0)fail('construction','Tables do not support doors, shelves or a plinth.');
  if(!['none','width','height'].includes(c.grainAxis)||!['inset','outside'].includes(c.backPosition))fail('grainAxis','Invalid table options.');
  for(const key of ['backThicknessMm','doorThicknessMm','shelfSideClearanceMm','doorGapMm','plinthSetbackMm'] as const)if(c[key]!==base[key])fail(key,'This casework option is inactive for panel tables.');
  const overrides=c.panelOverrides??{};
  if((c.panelOverrides!==undefined&&!parseOverrides(c.panelOverrides))||!parseOverrides(overrides)||Object.keys(overrides).some(id=>!/^table\/(top|side-left|side-right|back)$/.test(id)))fail('panelOverrides','Use assignments belonging to this table.');
  const bounds=c.tableKind==='side'?[300,800,300,800,350,750]:c.tableKind==='dining'?[900,1800,600,1000,700,800]:[800,1600,450,800,650,850];
  const [minW,maxW,minD,maxD,minH,maxH]=bounds;
  if(c.widthMm<minW||c.widthMm>maxW||c.depthMm<minD||c.depthMm>maxD||c.heightMm<minH||c.heightMm>maxH)fail('dimensions',`Proposed envelope: W ${minW}–${maxW}, D ${minD}–${maxD}, H ${minH}–${maxH} mm.`);
  const t=(id:string)=>overrides['table/'+id]?.thicknessMm??c.bodyThicknessMm;
  if(['top','side-left','side-right','back'].some(id=>t(id)<18||t(id)>40))fail('bodyThicknessMm','Table panels require 18–40 mm thickness in this preview.');
  if(c.widthMm-150>Math.min(1650,60*t('top')))fail('widthMm','Tabletop exceeds the proposed 60 × thickness span envelope; reduce width or use a thicker tabletop. This is not a load rating.');
  if(c.stockMarginMm<0||c.stockWidthMm<=2*c.stockMarginMm||c.stockHeightMm<=2*c.stockMarginMm)fail('stockMarginMm','Margins must leave positive usable stock.');
  if(r.blockingErrors.length)return r;
  const w=c.widthMm,h=c.heightMm,d=c.depthMm,top=t('top'),left=t('side-left'),right=t('side-right'),brace=t('back');
  const inset=50,span=w-2*inset-left-right,legH=h-top,braceH=Math.min(200,legH-100);
  const add=(id:string,label:string,role:Panel['role'],pw:number,ph:number,pt:number,pos:Panel['pose']['positionMm'],rot:Panel['pose']['rotationRad'])=>{const grain=overrides['table/'+id]?.grainAxis??c.grainAxis;r.panels.push({panelId:'table/'+id,componentId:id,label,role,materialSlot:'body',widthMm:pw,heightMm:ph,thicknessMm:pt,pose:{positionMm:pos,rotationRad:rot},grainAxis:grain,allowedRotationsDeg:grain==='none'?[0,90]:[0]});};
  add('top','Tabletop','top',w,d,top,[w/2,h-top/2,d/2],[-Math.PI/2,0,0]);
  add('side-left','Left support','side',d-100,legH,left,[inset+left/2,legH/2,d/2],[0,-Math.PI/2,0]);
  add('side-right','Right support','side',d-100,legH,right,[w-inset-right/2,legH/2,d/2],[0,-Math.PI/2,0]);
  add('back','Rear stretcher','back',span,braceH,brace,[inset+left+span/2,legH-braceH/2,d-50-brace/2],[0,0,0]);
  return r;
}
