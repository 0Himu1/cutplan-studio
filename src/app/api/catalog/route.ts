import { privateJson } from '@/lib/auth/http';
import { publicCatalog } from '@/lib/catalog/public';
export async function GET(){
  try{return privateJson(await publicCatalog());}
  catch{return privateJson({error:'Materials are unavailable. Retry shortly.'},503);}
}
