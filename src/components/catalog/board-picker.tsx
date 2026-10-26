'use client';
import {boardGroups,preferredVariant} from '@/lib/catalog/board-categories';
import type {SellableMaterial} from '@/lib/furniture/materials';
import {ConfigSelect} from '@/components/ui/config-fields';
/** Category selects a physical variant; persisted references remain variant IDs. */
export function BoardPicker({items,value,thickness,onChange,label='Board',disabled=false,empty='No board assigned'}:{items:SellableMaterial[];value:string;thickness:number;onChange:(id:string)=>void;label?:string;disabled?:boolean;empty?:string}){
 const groups=boardGroups(items),group=groups.find(group=>group.variants.some(item=>item.id===value));
 return <><ConfigSelect label={label} value={group?.key??(value?'unavailable':'')} disabled={disabled} onChange={key=>{const next=groups.find(group=>group.key===key);onChange(next?preferredVariant(next.variants,thickness).id:'');}}><option value="">{empty}</option>{value&&!group&&<option value="unavailable">Unavailable board — select a replacement</option>}{groups.map(group=><option key={group.key} value={group.key}>{group.name}</option>)}</ConfigSelect>
 {group&&<ConfigSelect label={`${label} thickness (mm)`} value={value} disabled={disabled} onChange={onChange}>{group.variants.map(item=><option key={item.id} value={item.id}>{String(item.board_skus?.thickness_mm)} mm{item.price?` · BDT ${Number(item.price.price_bdt).toLocaleString('en-BD')} / sheet`:''}</option>)}</ConfigSelect>}</>;
}
