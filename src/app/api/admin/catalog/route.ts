import { createClient } from '@/lib/supabase/server';
import { privateJson,readBody,sameOrigin } from '@/lib/auth/http';
import { catalogInput,catalogInputError } from '@/lib/catalog/contracts';
async function staff() {
 const client=await createClient();
 const {data:{user}}=await client.auth.getUser();
 if(!user)return null;
 const {data,error}=await client.from('staff_memberships').select('role,is_active').eq('user_id',user.id).maybeSingle();
 return !error&&data?.role==='admin'&&data.is_active?client:null;
}
export async function GET() {
 try {const client=await staff();if(!client)return privateJson({error:'Staff catalog access is required.'},403);
 const [items,compatibility]=await Promise.all([client.from('catalog_items').select('*,board_skus(*),finish_skus(*),edging_skus(*),catalog_price_versions(*)').order('name').limit(200),client.from('board_finish_compatibility').select('board_item_id,finish_item_id')]);
 if(items.error||compatibility.error)throw new Error();return privateJson({items:items.data,compatibility:compatibility.data});
 }catch{return privateJson({error:'The catalog could not load. Retry.'},503);}
}
export async function POST(request:Request) {
 if(!sameOrigin(request))return privateJson({error:'Reload the catalog and retry.'},403);
 try {const client=await staff();if(!client)return privateJson({error:'Staff catalog access is required.'},403);
 const body=await readBody(request,4096),input=catalogInput(body);if(!input)return privateJson({error:catalogInputError(body)??'Check the material fields.'},400);
 const {error}=await client.rpc('cutplan_catalog_change',{p:input});
 if(error){const message=error.message.includes('catalog_variant_exists')?'This category already has that thickness. Edit the existing variant.':error.message.includes('catalog_category_thickness')?'Choose a listed thickness for this board category.':error.message.includes('catalog_conflict')?'This material changed. Reload before saving again.':error.message.includes('catalog_price_required')?'Add a positive current price with the correct unit before publishing.':error.message.includes('catalog_edging_unit')?'Edging must be priced per meter.':error.message.includes('catalog_board_unit')?'Boards must be priced per sheet.':'The change was not saved. Check the material fields and retry.';return privateJson({error:message},409);}
 return privateJson({saved:true});
 }catch{return privateJson({error:'The change was not saved. Retry.'},503);}
}

