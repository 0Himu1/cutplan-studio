import { privateJson,sameOrigin } from '@/lib/auth/http';
import { projectFailure,projectUser } from '@/lib/projects/api';
import { isProjectId } from '@/lib/projects/contracts';
import { recoverProject } from '@/lib/projects/service';

export async function POST(request: Request,{params}:{params:Promise<{id:string}>}) {
  if (!sameOrigin(request)) return privateJson({error:'This request must come from the studio.'},403);
  try {
    const {user}=await projectUser();const {id}=await params;
    if (!isProjectId(id)) return privateJson({error:'This account project is unavailable.'},404);
    return privateJson({project:await recoverProject(user.id,id)});
  } catch(error) { return projectFailure(error); }
}
