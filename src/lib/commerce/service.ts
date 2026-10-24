import 'server-only';
import {createHash} from 'node:crypto';
import {createAdminClient} from '@/lib/supabase/admin';
import {projectRevision} from '@/lib/projects/service';
import {ProjectError,snapshotFurniture} from '@/lib/projects/contracts';
import {publicCatalog} from '@/lib/catalog/public';
import {validateMaterials} from '@/lib/furniture/materials';
import {addressInput,decimalMinor,money,priceQuote,type Policy,type Price} from './engine';
import {customerQuote,type QuoteRecord} from './presentation';
import {quotePdf} from './pdf';

// Owner explicitly requested test policies only. Change only after commercial/physical approval.
export const LIVE_COMMERCE_ENABLED=false;
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=(code:string,message:string,status=409):never=>{throw new ProjectError(status,code,message);};
function storageError(message:string):never{
 if(/stale_revision/.test(message))fail('stale_revision','The saved design changed. Generate a new quote.');
 if(/quote_expired/.test(message))fail('quote_expired','This quote has expired. Generate a new quote.');
 if(/operation_conflict/.test(message))fail('operation_conflict','This request changed. Retry the original request.');
 if(/invalid_address/.test(message))fail('invalid_address','Use complete contact details and a quoted Dhaka service area.',422);
 if(/quote_missing/.test(message))fail('not_found','This quotation is unavailable.',404);
 return fail('commerce_unavailable','Commerce storage is unavailable. Your design and earlier request are preserved.',503);
}
export async function ownedQuote(owner:string,id:string):Promise<QuoteRecord>{const {data,error}=await createAdminClient().from('quotations').select('*').eq('id',id).eq('owner_user_id',owner).maybeSingle();if(error)storageError(error.message);if(!data)fail('not_found','This quotation is unavailable.',404);return data as QuoteRecord;}
async function quoteContext(owner:string,projectId:string){
 const detail=await projectRevision(owner,projectId),input=snapshotFurniture(detail.revision?.snapshot);
 const client=createAdminClient(),{data:policies,error}=await client.from('commerce_policies').select('version,payload').eq('approved',true).order('created_at',{ascending:false}).limit(1);if(error)storageError(error.message);
 const policy=policies?.[0]?.payload as Policy|undefined;
 if(policy&&policy.version!==policies?.[0]?.version)fail('policy_invalid','The approved pricing policy needs review.',503);
 if(!input||!detail.revision)return {detail,issues:['Save a supported furniture design to your account before quoting.']};
 const {data:versions,error:priceError}=await client.from('catalog_price_versions').select('id,item_id,price_bdt,unit,effective_from,effective_until').lte('effective_from',new Date().toISOString()).order('effective_from',{ascending:false}).limit(1000);if(priceError)storageError(priceError.message);
 const prices:Price[]=(versions??[]).filter(p=>!p.effective_until||Date.parse(p.effective_until)>Date.now()).map(p=>({itemId:p.item_id,versionId:p.id,unit:p.unit,minor:decimalMinor(String(p.price_bdt))??'invalid'}));
 const {data:index,error:indexError}=await client.from('design_revision_index').select('snapshot_hash').eq('id',detail.revision.id).eq('project_id',projectId).single();if(indexError||!index)fail('integrity_error','The saved revision could not be verified.',503);
 const result=priceQuote(input,policy,prices,{projectId,revisionId:detail.revision.id,revisionHash:index!.snapshot_hash});
 const compatibility=validateMaterials(input.panelOverrides??{},await publicCatalog());
 return {detail,issues:[...result.issues,...compatibility],snapshot:result.snapshot&&{...result.snapshot,design:detail.revision.snapshot}};
}
export async function commerceState(owner:string,projectId:string){
 const context=await quoteContext(owner,projectId);const {data,error}=await createAdminClient().from('quotations').select('*').eq('owner_user_id',owner).eq('project_id',projectId).order('issued_at',{ascending:false}).limit(10);if(error)storageError(error.message);
 return {liveEnabled:LIVE_COMMERCE_ENABLED,issues:[...(!LIVE_COMMERCE_ENABLED?['Live quotes and orders are disabled: test workflow only.']:[]),...context.issues],quotes:(data??[]).map(q=>customerQuote(q as QuoteRecord)),emailConfigured:Boolean(process.env.RESEND_API_KEY&&process.env.QUOTE_EMAIL_FROM)};
}
export async function issueQuote(owner:string,id:string,projectId:string,revisionId:string){
 if(!LIVE_COMMERCE_ENABLED)fail('live_commerce_disabled','Live quotations are disabled. Use the labelled test workflow.',422);
 const client=createAdminClient(),requestHash=hash([owner,projectId,revisionId]);
 const {data:existing,error:lookupError}=await client.from('quotations').select('*').eq('id',id).eq('owner_user_id',owner).maybeSingle();if(lookupError)storageError(lookupError.message);
 if(existing){if(existing.request_hash!==requestHash)fail('operation_conflict','Retry the original quote request.');return customerQuote(existing as QuoteRecord);}
 const ctx=await quoteContext(owner,projectId);if(ctx.detail.revision?.id!==revisionId)fail('stale_revision','The saved design changed. Reload and quote again.');
 if(ctx.issues.length||!ctx.snapshot)fail('quote_ineligible',ctx.issues[0]??'This design cannot be quoted.',422);
 const s=ctx.snapshot!;const {data,error}=await client.rpc('cutplan_issue_quote',{p_owner:owner,p_id:id,p_project:projectId,p_revision:revisionId,p_revision_hash:s.revisionHash,p_policy:s.policyVersion,p_request_hash:requestHash,p_snapshot_hash:hash(s),p_payload:s,p_total:s.totalMinor});if(error)storageError(error.message);return customerQuote(data as QuoteRecord);
}
export async function confirmOrder(owner:string,operationId:string,quoteId:string,value:unknown){
 if(!LIVE_COMMERCE_ENABLED)fail('live_commerce_disabled','Live order confirmation is disabled. No payment or commercial order can be created.',422);
 const q=await ownedQuote(owner,quoteId),address=addressInput(value,q.payload.policy.areas);if(!address)fail('invalid_address','Use a complete address, supported area and Bangladesh mobile number.',422);
 const {data,error}=await createAdminClient().rpc('cutplan_confirm_order',{p_owner:owner,p_operation:operationId,p_quote:quoteId,p_address:address});if(error)storageError(error.message);return {id:data.id,status:data.status,totalMinor:String(data.total_minor),paymentStatus:data.payment_status,createdAt:data.created_at};
}
export async function customerOrders(owner:string){const client=createAdminClient();const {data,error}=await client.from('customer_orders').select('id,quotation_id,project_id,revision_id,total_minor,currency,address_snapshot,status,payment_status,created_at,accepted_snapshot').eq('owner_user_id',owner).order('created_at',{ascending:false}).limit(100);if(error)storageError(error.message);const ids=(data??[]).map(o=>o.id);const events=ids.length?await client.from('order_events').select('order_id,status,created_at').in('order_id',ids).order('created_at'):null;if(events?.error)storageError(events.error.message);return {orders:(data??[]).map(o=>{const {accepted_snapshot,...metadata}=o;return {...metadata,summary:accepted_snapshot.summary,total_minor:String(o.total_minor),events:events?.data?.filter(e=>e.order_id===o.id)??[]};}),liveEnabled:LIVE_COMMERCE_ENABLED};}
export async function emailQuote(owner:string,id:string,email:string){
 if(!LIVE_COMMERCE_ENABLED)fail('live_commerce_disabled','Real quote email is disabled during test review.',422);
 const q=await ownedQuote(owner,id);if(!process.env.RESEND_API_KEY||!process.env.QUOTE_EMAIL_FROM)fail('email_unconfigured','Quote email is not configured. The quote and PDF remain available.',503);
 const client=createAdminClient();const {error:insertError}=await client.from('commerce_outbox').upsert({kind:'quote_email',reference_id:id,owner_user_id:owner,recipient_email:email},{onConflict:'kind,reference_id',ignoreDuplicates:true});if(insertError)storageError(insertError.message);
 const {data:job,error}=await client.from('commerce_outbox').select('*').eq('kind','quote_email').eq('reference_id',id).eq('owner_user_id',owner).single();if(error)storageError(error.message);if(job.state==='sent')return {state:'sent'};
 if(job.recipient_email!==email)fail('email_changed','The recipient changed. Ask support to review the original email request.');
 if(job.attempts>=5||Date.now()-Date.parse(job.created_at)>23*3600000)fail('email_review_required','Email delivery needs manual review; the saved quote remains available.');
 if(job.state==='sending'&&Date.parse(job.lease_until)>Date.now())return {state:'sending'};
 const {data:claimed,error:claimError}=await client.from('commerce_outbox').update({state:'sending',attempts:job.attempts+1,lease_until:new Date(Date.now()+60000).toISOString()}).eq('id',job.id).eq('attempts',job.attempts).select('id');if(claimError)storageError(claimError.message);if(!claimed?.length)return {state:'sending'};
 try{const pdf=await quotePdf(customerQuote(q));const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`quote/${id}`},body:JSON.stringify({from:process.env.QUOTE_EMAIL_FROM,to:[job.recipient_email],subject:'Your CutPlan Studio quotation',text:`Quotation ${id}. BDT total: ${money(customerQuote(q).totalMinor)}. Valid until ${q.expires_at}. Confirmation does not mean payment collected.`,attachments:[{filename:`quote-${id}.pdf`,content:Buffer.from(pdf).toString('base64')}]}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();const sent=await response.json();if(typeof sent.id!=='string')throw new Error();const {error:saveError}=await client.from('commerce_outbox').update({state:'sent',provider_id:sent.id,lease_until:null}).eq('id',job.id);if(saveError)throw new Error();return {state:'sent'};}catch{await client.from('commerce_outbox').update({state:'failed',lease_until:null}).eq('id',job.id);fail('email_failed','Email delivery could not be confirmed. Retry this same request; the quote and PDF remain available.',503);}
}
