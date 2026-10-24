import {privateJson,sameOrigin} from '@/lib/auth/http';
import {projectUser,projectFailure} from '@/lib/projects/api';
export async function POST(request:Request){if(!sameOrigin(request))return privateJson({error:'Use the studio origin.'},403);try{await projectUser();return privateJson({code:'inference_disabled',error:'Live photo inference is disabled. Use the labelled demo or choose a supported template manually.'},422);}catch(e){return projectFailure(e);}}
