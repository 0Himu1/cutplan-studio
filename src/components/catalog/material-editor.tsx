'use client';
import type {CatalogItem} from '@/lib/catalog/contracts';
import {BoardForm} from './board-form';
import {FinishForm} from './finish-form';
import {EdgingForm} from './edging-form';
import type {MaterialFormProps} from './material-form';
export type {CatalogSave} from './material-form';

export function MaterialEditor({kind,item,busy,onSave,preset}:MaterialFormProps&{kind:CatalogItem['kind'];preset?:CatalogItem}){
 if(kind==='board')return <BoardForm item={item} busy={busy} onSave={onSave} preset={preset}/>;
 if(kind==='finish')return <FinishForm item={item} busy={busy} onSave={onSave}/>;
 return <EdgingForm item={item} busy={busy} onSave={onSave}/>;
}
