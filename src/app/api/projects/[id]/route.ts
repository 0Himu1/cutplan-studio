import { privateJson } from '@/lib/auth/http';
import { projectFailure,projectUser } from '@/lib/projects/api';
import { isProjectId,isUuid } from '@/lib/projects/contracts';
import { projectRevision } from '@/lib/projects/service';

export async function GET(request: Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {user}=await projectUser(); const {id}=await params;
    const revision=new URL(request.url).searchParams.get('revision')??undefined;
    if (!isProjectId(id) || (revision && !isUuid(revision))) return privateJson({error:'This account project is unavailable.'},404);
    return privateJson(await projectRevision(user.id,id,revision));
  } catch(error) { return projectFailure(error); }
}
