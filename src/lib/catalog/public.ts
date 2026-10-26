import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { MaterialCatalog } from '@/lib/furniture/materials';
export async function publicCatalog():Promise<MaterialCatalog> {
  const client=createAdminClient();
  const [{data,error},{data:compatibility,error:pairError}]=await Promise.all([
    client.from('catalog_items').select('id,kind,code,name,category_code,board_skus(*),finish_skus(*),edging_skus(*),catalog_price_versions(price_bdt,unit,effective_from,effective_until)').eq('is_sellable',true).is('retired_at',null).order('name').limit(200),
    client.from('board_finish_compatibility').select('board_item_id,finish_item_id')
  ]);
  if(error||pairError)throw new Error('Catalog unavailable');
  const now=Date.now();
  const items=(data??[]).filter(item=>item.catalog_price_versions.some(price=>Date.parse(price.effective_from)<=now&&(!price.effective_until||Date.parse(price.effective_until)>now))).map(({catalog_price_versions,...item})=>{const one=(value:unknown)=>Array.isArray(value)?value[0]??null:value;return {...item,price:catalog_price_versions.find(price=>Date.parse(price.effective_from)<=now&&(!price.effective_until||Date.parse(price.effective_until)>now)),board_skus:one(item.board_skus),finish_skus:one(item.finish_skus),edging_skus:one(item.edging_skus)};});
  const ids=new Set(items.map(item=>item.id));
  return {items:items as MaterialCatalog['items'],compatibility:(compatibility??[]).filter(pair=>ids.has(pair.board_item_id)&&ids.has(pair.finish_item_id))};
}


