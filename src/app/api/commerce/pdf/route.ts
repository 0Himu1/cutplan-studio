import {projectUser,projectFailure} from '@/lib/projects/api';
import {privateJson} from '@/lib/auth/http';
import {isUuid} from '@/lib/projects/contracts';
import {ownedQuote} from '@/lib/commerce/service';
import {customerQuote} from '@/lib/commerce/presentation';
import {quotePdf} from '@/lib/commerce/pdf';
export async function GET(request:Request){try{const {user}=await projectUser(),id=new URL(request.url).searchParams.get('id');if(!isUuid(id))return privateJson({error:'Invalid quote.'},400);const pdf=await quotePdf(customerQuote(await ownedQuote(user.id,id)));return new Response(Buffer.from(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="quote-${id}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return projectFailure(e);}}
