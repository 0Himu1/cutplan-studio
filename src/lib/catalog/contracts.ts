import {validBoardThickness} from './board-categories.ts';
export type CatalogItem = { id:string; category_code?:string|null; kind:'board'|'finish'|'edging'; code:string; name:string; is_sellable:boolean; retired_at:string|null; version:number; source_name:string|null; source_url:string|null; board_skus:Record<string,unknown>|null; finish_skus:Record<string,unknown>|null; edging_skus:Record<string,unknown>|null; catalog_price_versions:{id:string;price_bdt:number;unit:string;effective_from:string;effective_until:string|null;reason:string}[] };
export const units=['sheet','square_meter','meter','piece'] as const;
export function catalogInput(value:Record<string,unknown>|null) {
  if(!value || !['create','edit','price','publish','unpublish','retire','compatibility'].includes(String(value.action))) return null;
  if(value.action!=='create' && (typeof value.id!=='string'||! /^[0-9a-f-]{36}$/i.test(value.id)||!Number.isSafeInteger(value.version))) return null;
  if(['create','edit'].includes(String(value.action))) {
    if(typeof value.name!=='string'||value.name.trim().length<2||value.name.length>120||/[\x00-\x1f]/.test(value.name)) return null;
    if(value.action==='create' && (!['board','finish','edging'].includes(String(value.kind))||! /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(String(value.code))))return null;
  }
  if(value.action==='price' && (typeof value.amount!=='string'||! /^\d{1,10}(\.\d{1,2})?$/.test(value.amount)||!units.includes(value.unit as typeof units[number])||typeof value.reason!=='string'||value.reason.trim().length<2||value.reason.length>240))return null;
  if(value.action==='publish' && value.reviewed!==true)return null;
  if(value.category_code!==undefined&&value.category_code!==null){
    if(typeof value.category_code!=='string'||!value.details||typeof value.details!=='object'||!validBoardThickness(value.category_code,Number((value.details as Record<string,unknown>).thickness_mm)))return null;
  }
  if(['create','edit'].includes(String(value.action))&&value.details&&typeof value.details==='object'){const color=(value.details as Record<string,unknown>).color_code;if(color!==undefined&&color!==null&&color!==''&&(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color)))return null;}
  return value;
}
