import {privateJson,readBody,sameOrigin} from '@/lib/auth/http';
import {projectUser,projectFailure} from '@/lib/projects/api';
import {isProjectId,isUuid} from '@/lib/projects/contracts';
import {commerceState,issueQuote,confirmOrder,emailQuote,customerOrders} from '@/lib/commerce/service';
export async function GET(request:Request){try{const {user}=await projectUser(),id=new URL(request.url).searchParams.get('projectId');if(id&&!isProjectId(id))return privateJson({error:'Invalid project.'},400);return privateJson(id?await commerceState(user.id,id):await customerOrders(user.id));}catch(e){return projectFailure(e);}}
export async function POST(request:Request){if(!sameOrigin(request))return privateJson({error:'This request must come from the studio.'},403);try{const {user}=await projectUser(),body=await readBody(request,4096);if(!body)return privateJson({error:'Use a supported commerce request.'},400);const keys=Object.keys(body).sort().join(',');
 if(body.action==='quote'&&keys==='action,operationId,projectId,revisionId'&&isUuid(body.operationId)&&isUuid(body.revisionId)&&isProjectId(body.projectId))return privateJson(await issueQuote(user.id,body.operationId,body.projectId,body.revisionId));
 if(body.action==='order'&&keys==='action,address,operationId,quoteId'&&isUuid(body.operationId)&&isUuid(body.quoteId))return privateJson(await confirmOrder(user.id,body.operationId,body.quoteId,body.address));
 if(body.action==='email'&&keys==='action,quoteId'&&isUuid(body.quoteId)&&user.email&&user.email_confirmed_at)return privateJson(await emailQuote(user.id,body.quoteId,user.email));
 return privateJson({error:'Use a supported commerce request.'},400);
 }catch(e){return projectFailure(e);}}
