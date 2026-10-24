import { privateJson,readBody,sameOrigin } from '@/lib/auth/http';
import { projectUser,projectFailure } from '@/lib/projects/api';
import { saveInput } from '@/lib/projects/contracts';
import { PROJECT_COLUMNS,saveProject } from '@/lib/projects/service';
import { mongoConfigured } from '@/lib/projects/mongo';

export async function GET() {
  try {
    const {client,user}=await projectUser();
    const {data,error}=await client.from('projects').select(PROJECT_COLUMNS).eq('owner_user_id',user.id).is('deleted_at',null).order('updated_at',{ascending:false}).limit(101);
    if (error) throw error;
    return privateJson({projects:(data??[]).slice(0,100),hasMore:(data?.length??0)>100,configured:mongoConfigured()});
  } catch(error) { return projectFailure(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({error:'This request must come from the studio.'},403);
  try {
    const {user}=await projectUser();
    const input=saveInput(await readBody(request, 131072));
    if (!input) return privateJson({error:'Use a supported project name and save version.',code:'invalid_input'},400);
    return privateJson(await saveProject(user.id,input));
  } catch(error) { return projectFailure(error); }
}

