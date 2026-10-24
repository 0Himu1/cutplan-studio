import { calculateTable } from './table.ts';
import { calculateCabinet, type CabinetInput, type Calculation } from './cabinet.ts';
import { CABINET_FIXTURES } from './cabinet-fixtures.ts';
import { parseOverrides } from './materials.ts';
import {cabinetExtras} from './compartments.ts';

export type SupportedFamily='cabinet'|'shoe_rack'|'bookshelf'|'table';
export type ShoeRackInput=CabinetInput&{family:'shoe_rack'};
export type BookshelfInput=CabinetInput&{family:'bookshelf';mounting:'floor'|'wall';shelfMode:'fixed'|'adjustable';wallSubstrate:'unknown'|'masonry'|'concrete'|'stud';fixingNotes:string};
/** Shared casework view model. Public validators discriminate each family's supported options. */
export type FurnitureInput=CabinetInput&{family?:'shoe_rack'|'bookshelf'|'table';tableKind?:'study'|'dining'|'side'}&Partial<Pick<BookshelfInput,'mounting'|'shelfMode'|'wallSubstrate'|'fixingNotes'>>;
export const FAMILY_ENGINE='casework-review-1.0.0';
export const FAMILY_TEMPLATES={shoe_rack:'shoe-rack-between-sides-v1',bookshelf:'bookshelf-open-casework-v1',table:'table-panel-trestle-v1'} as const;
export const familyOf=(input:FurnitureInput):SupportedFamily=>input.family??'cabinet';
export const familyLabel=(family:SupportedFamily)=>family==='table'?'Table':family==='shoe_rack'?'Shoe rack':family==='bookshelf'?'Bookshelf':'Cabinet';
const base=CABINET_FIXTURES[0].input;
export function defaultFurniture(family:SupportedFamily):FurnitureInput {
  if(family==='cabinet')return {...base};
  if(family==='table')return {...base,family,tableKind:'study',widthMm:1200,heightMm:750,depthMm:600,bodyThicknessMm:25,shelfCount:0,doorCount:0,skirtingHeightMm:0};
  if(family==='shoe_rack')return {...base,family,widthMm:813,heightMm:1000,depthMm:350,shelfCount:3,skirtingHeightMm:80};
  return {...base,family,widthMm:600,heightMm:1800,depthMm:300,shelfCount:4,doorCount:0,skirtingHeightMm:0,shelfSideClearanceMm:0,mounting:'floor',shelfMode:'fixed',wallSubstrate:'unknown',fixingNotes:''};
}
const baseKeys=Object.keys(base);
const bookKeys=['mounting','shelfMode','wallSubstrate','fixingNotes'];

export function calculateFurniture(value:unknown):Calculation {
  if(!value||typeof value!=='object'||Array.isArray(value)||!('family' in value))return calculateCabinet(value);
  const input=value as FurnitureInput;
  const family=input.family;
  if(family==='table')return calculateTable(input);
  const result:Calculation={schemaVersion:1,engineVersion:FAMILY_ENGINE,templateKey:family==='shoe_rack'?FAMILY_TEMPLATES.shoe_rack:FAMILY_TEMPLATES.bookshelf,manufacturingApproved:false,eligibleForQuote:false,panels:[],blockingErrors:[],warnings:['Proposed casework rules. Drawings, joints, hardware and load capacity require manufacturing approval. No quote or machine release.']};
  const error=(field:string,message:string)=>result.blockingErrors.push({field,message});
  if(family!=='shoe_rack'&&family!=='bookshelf'){error('family','Choose a supported furniture template.');return result;}
  const allowed=new Set([...baseKeys,'family','panelOverrides',...(family==='bookshelf'?bookKeys:[])]);
  for(const key of Object.keys(input))if(!allowed.has(key))error(key,'This option is not supported by this furniture family.');
  if(input.panelOverrides!==undefined&&!parseOverrides(input.panelOverrides))error('panelOverrides','Invalid panel assignments.');
  for(const id of Object.keys(input.panelOverrides??{}))if(!id.startsWith(family+'/'))error('panelOverrides','Panel assignments must belong to this furniture family.');
  if(family==='bookshelf'){
    if(!['floor','wall'].includes(input.mounting??''))error('mounting','Choose floor-standing or wall-mounted.');
    if(!['fixed','adjustable'].includes(input.shelfMode??''))error('shelfMode','Choose fixed or adjustable shelves.');
    if(!['unknown','masonry','concrete','stud'].includes(input.wallSubstrate??''))error('wallSubstrate','Choose the wall substrate.');
    if(typeof input.fixingNotes!=='string'||input.fixingNotes.length>240||/[\u0000-\u001f\u007f]/.test(input.fixingNotes))error('fixingNotes','Use fixing notes of at most 240 characters without control characters.');
    if(input.doorCount!==0)error('doorCount','This bookshelf template is open; doors are unsupported.');
    if(input.shelfSideClearanceMm!==(input.shelfMode==='fixed'?0:2))error('shelfSideClearanceMm','Fixed shelves use zero side clearance; adjustable shelves use 2 mm per side.');
    if(input.bodyThicknessMm<18)error('bodyThicknessMm','The proposed bookshelf envelope requires at least 18 mm body panels. This is not a load rating.');
    if(input.mounting==='wall'){
      if(input.skirtingHeightMm!==0)error('skirtingHeightMm','Wall bookshelves do not have a floor plinth.');
      if(input.heightMm>1200||input.widthMm>900||input.depthMm>350)error('dimensions','Wall preview supports at most 900 W × 1200 H × 350 D mm pending qualification.');
      if(input.wallSubstrate==='unknown'||(typeof input.fixingNotes!=='string'||input.fixingNotes.trim().length<12))error('fixingNotes','Record a known wall substrate and fixing requirements (at least 12 characters); a qualified installer must approve them.');
      result.warnings.push('Wall preview only: no fixing hardware, drilling pattern or load rating is approved. Installer must assess substrate, anchors and load before use.');
    }else {if(input.heightMm>2400||input.depthMm>500)error('dimensions','Floor preview supports at most 2400 mm height and 500 mm depth pending qualification.');result.warnings.push('Floor bookshelf requires anti-tip anchoring before use. Wall substrate, anchors and loads must be assessed by a qualified installer.');}
    result.warnings.push('Shelf span limit is a proposed editor envelope, not a structural capacity guarantee. Adjustable shelf centers use a 32 mm presentation pitch; support holes are not manufacturing-approved.');
  }
  if(result.blockingErrors.length)return result;
  const core={...Object.fromEntries(baseKeys.map(key=>[key,input[key as keyof CabinetInput]])),...(input.panelOverrides?{panelOverrides:Object.fromEntries(Object.entries(input.panelOverrides).map(([id,assignment])=>[id.replace(family+'/','cabinet/'),assignment]))}:{})};
  const calculated=calculateCabinet(core);
  result.blockingErrors.push(...calculated.blockingErrors.map(issue=>({...issue,field:issue.field.replace('cabinet/',family+'/')})));
  if(result.blockingErrors.length)return result;
  const panels=calculated.panels.map(panel=>({...panel,panelId:panel.panelId.replace('cabinet/',family+'/'),pose:{positionMm:[...panel.pose.positionMm] as [number,number,number],rotationRad:[...panel.pose.rotationRad] as [number,number,number]}}));
  if(family==='bookshelf'){
    for(const panel of panels.filter(panel=>panel.materialSlot==='body'))if(panel.thicknessMm<18)error('panelOverrides',`${panel.label} must meet the proposed 18 mm minimum.`);
    for(const panel of panels.filter(panel=>['shelf','top','bottom'].includes(panel.role)))if(panel.widthMm>Math.min(900,panel.thicknessMm*40))error('widthMm',`${panel.label} exceeds the proposed span envelope (${Math.min(900,panel.thicknessMm*40)} mm for this thickness); reduce width. No load rating is implied.`);
    for(const panel of panels.filter(panel=>panel.role==='shelf')){
      if(input.shelfMode==='adjustable'){panel.pose.positionMm[1]=Math.round(panel.pose.positionMm[1]/32)*32;panel.label=`Adjustable ${panel.label.toLowerCase()}`;}
    }
    const shelves=panels.filter(panel=>['bottom','shelf','top'].includes(panel.role)).sort((a,b)=>a.pose.positionMm[1]-b.pose.positionMm[1]);
    for(let i=1;i<shelves.length;i++)if(shelves[i].pose.positionMm[1]-shelves[i-1].pose.positionMm[1]-(shelves[i].thicknessMm+shelves[i-1].thicknessMm)/2<50)error('shelfCount','Shelf positions must leave at least 50 mm clear openings.');
  }
  if(!result.blockingErrors.length)result.panels=panels;
  return result;
}

export function furnitureInput(value:unknown):FurnitureInput|null {
  if(calculateFurniture(value).blockingErrors.length)return null;
  const input=value as FurnitureInput;
  return {...Object.fromEntries(baseKeys.map(key=>[key,input[key as keyof CabinetInput]])),...(!input.family?cabinetExtras(input):{}),...(input.panelOverrides?{panelOverrides:parseOverrides(input.panelOverrides)!}:{}),...(input.family?{family:input.family}:{}),...(input.family==='table'?{tableKind:input.tableKind}:{}),...(input.family==='bookshelf'?Object.fromEntries(bookKeys.map(key=>[key,input[key as keyof BookshelfInput]])):{})} as FurnitureInput;
}
