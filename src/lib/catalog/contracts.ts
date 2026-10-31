import {validBoardThickness} from './board-categories.ts';
export type CatalogItem = { id:string; category_code?:string|null; kind:'board'|'finish'|'edging'; code:string; name:string; is_sellable:boolean; retired_at:string|null; version:number; source_name:string|null; source_url:string|null; board_skus:Record<string,unknown>|null; finish_skus:Record<string,unknown>|null; edging_skus:Record<string,unknown>|null; catalog_price_versions:{id:string;price_bdt:number;unit:string;effective_from:string;effective_until:string|null;reason:string}[] };
export const units=['sheet','square_meter','meter','piece'] as const;
// The escaped hyphen also works in HTML's Unicode-sets (v) pattern mode.
export const CATALOG_CODE_PATTERN='[A-Za-z0-9][A-Za-z0-9._\\-]{1,63}';
const codePattern=new RegExp(`^(?:${CATALOG_CODE_PATTERN})$`,'u');
export function catalogInputError(value:Record<string,unknown>|null):string|null {
  if(!value || !['create','edit','price','publish','unpublish','retire','compatibility'].includes(String(value.action))) return 'Choose a supported catalog action.';
  if(value.action!=='create' && (typeof value.id!=='string'||! /^[0-9a-f-]{36}$/i.test(value.id)||!Number.isSafeInteger(value.version))) return 'Reload this material before saving again.';
  if(['create','edit'].includes(String(value.action))) {
    if(typeof value.name!=='string'||value.name.trim().length<2||value.name.length>120||/[\x00-\x1f]/.test(value.name)) return 'Name must contain 2–120 characters.';
    if(value.action==='create'&&!['board','finish','edging'].includes(String(value.kind)))return 'Choose Board, Finish or Edging.';
    if(value.action==='create'&&(typeof value.code!=='string'||!codePattern.test(value.code)))return 'Code must contain 2–64 letters or numbers, dots, underscores or hyphens. Do not use spaces.';
  }
  if(value.action==='price' && (typeof value.amount!=='string'||! /^\d{1,10}(\.\d{1,2})?$/.test(value.amount)||!units.includes(value.unit as typeof units[number])||typeof value.reason!=='string'||value.reason.trim().length<2||value.reason.length>240))return 'Enter a valid price, unit and price-change reason.';
  if(value.action==='publish' && value.reviewed!==true)return 'Review the specification, price and availability before publishing.';
  if(value.category_code!==undefined&&value.category_code!==null){
    if(typeof value.category_code!=='string'||!value.details||typeof value.details!=='object'||!validBoardThickness(value.category_code,Number((value.details as Record<string,unknown>).thickness_mm)))return 'Choose a listed thickness for this board category.';
  }
  if(['create','edit'].includes(String(value.action))&&value.details&&typeof value.details==='object'){const color=(value.details as Record<string,unknown>).color_code;if(color!==undefined&&color!==null&&color!==''&&(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color)))return 'Use a six-digit color such as #BDA382, or leave the optional color blank.';}
  if(['create','edit'].includes(String(value.action))&&value.details&&typeof value.details==='object'){
    const texture=(value.details as Record<string,unknown>).texture_url;
    if(texture!==undefined&&texture!==null&&texture!==''){
      if(typeof texture!=='string'||texture.length>2048)return 'Use an HTTPS image URL up to 2048 characters.';
      try{const url=new URL(texture);if(url.protocol!=='https:'||url.username||url.password)return 'Use a public HTTPS image URL without login credentials.';}catch{return 'Use a valid HTTPS image URL.';}
    }
  }
  return null;
}
export function catalogInput(value:Record<string,unknown>|null){return catalogInputError(value)?null:value;}
