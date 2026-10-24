import {privateJson} from '@/lib/auth/http';
import {projectFailure} from '@/lib/projects/api';
import {fulfillmentActor} from '@/lib/operations/service';
import {launchReadiness} from '@/lib/launch/readiness';
export async function GET(){try{await fulfillmentActor(true);return privateJson(launchReadiness());}catch(e){return projectFailure(e);}}
