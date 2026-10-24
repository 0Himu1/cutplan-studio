import test from 'node:test';import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';import {PDFDocument} from 'pdf-lib';
import {testQuoteInputs,testQuotation} from '../../src/lib/commerce/fixture.ts';
import {priceQuote,decimalMinor,money,addressInput} from '../../src/lib/commerce/engine.ts';
import {customerQuote} from '../../src/lib/commerce/presentation.ts';import {quotePdf} from '../../src/lib/commerce/pdf.ts';
const identity={projectId:'0123456789abcdef01234567',revisionId:'00000000-0000-4000-8000-000000000301',revisionHash:'a'.repeat(64)};
const address={recipient:'Test Buyer',phone:'01712345678',area:'Tejgaon (test)',address:'House 12, Road 3, Tejgaon'};
test('exact versioned BDT arithmetic prices whole stock once and freezes immutable inputs',()=>{
 const {input,policy,prices}=testQuoteInputs(),before=JSON.stringify({input,policy,prices}),result=priceQuote(input,policy,prices,identity);assert.deepEqual(result.issues,[]);assert.equal(result.snapshot.nesting.sheets.length,1);assert.equal(result.snapshot.totalMinor,'1130000');assert.equal(result.snapshot.lines.find(l=>l.kind==='assembly_guide').amountMinor,'0');assert.equal(JSON.stringify({input,policy,prices}),before);
 assert.equal(decimalMinor('123.45'),'12345');assert.equal(decimalMinor('0.01'),'1');for(const bad of ['-1','1e3','NaN','1.005',' 1'])assert.equal(decimalMinor(bad),null);assert.equal(money('1130000'),'11300.00');
 const half=priceQuote(input,{...policy,marginBps:5000,laborMinor:0,deliveryMinor:0},[{...prices[0],minor:'1'}],identity);assert.equal(half.snapshot.totalMinor,'2');
 policy.laborMinor=1;assert.equal(result.snapshot.policy.laborMinor,150000);assert.equal(result.snapshot.lines[0].priceVersionId,prices[0].versionId);
});
test('quote gates reject missing policy, unplaced panels, unsupported capability and missing prices',()=>{
 const {input,policy,prices}=testQuoteInputs();for(const p of [undefined,{...policy,approved:false},{...policy,hardwareIncluded:false},{...policy,templates:[]},{...policy,machine:{...policy.machine,maxWidthMm:500}}])assert.ok(priceQuote(input,p,prices,identity).issues.length);
 assert.ok(priceQuote({...input,grainAxis:'width',panelOverrides:Object.fromEntries(Object.entries(input.panelOverrides).map(([id,a])=>[id,{...a,grainAxis:'width'}]))},policy,prices,identity).issues.some(i=>i.includes('unplaced')));assert.ok(priceQuote(input,policy,[],identity).issues.length);
 const p=priceQuote(input,{...policy,discountMinor:999999999},prices,identity);assert.equal(p.snapshot,undefined);
});
test('delivery parser bounds fields, normalizes phone and rejects unsupported service areas',()=>{
 assert.deepEqual(addressInput({...address,phone:'+880 1712-345678'},['Tejgaon (test)']),address);
 for(const change of [{recipient:''},{address:'short'},{phone:'123'},{area:'Unknown'},{address:'Line\nnew'},{extra:1}])assert.equal(addressInput({...address,...change},['Tejgaon (test)']),null);
});
test('customer projection and PDF exclude internal margin rules and retain immutable totals',async()=>{
 const q=testQuotation('2026-10-23T00:00:00Z'),raw=JSON.stringify(q);assert.ok(!raw.includes('marginBps'));assert.ok(!raw.includes('unitPriceMinor'));assert.ok(!raw.includes('approvalReference'));
 const bytes=await quotePdf(q,true),pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=1);assert.equal(pdf.getTitle(),'TEST ONLY - CutPlan Studio quotation');assert.equal(new Date(q.expiresAt)-new Date(q.issuedAt),7*86400000);
 const {input,policy,prices}=testQuoteInputs(),payload=priceQuote(input,policy,prices,identity).snapshot;assert.equal(customerQuote({id:q.id,project_id:identity.projectId,revision_id:identity.revisionId,issued_at:q.issuedAt,expires_at:q.expiresAt,accepted_at:null,payload,snapshot_hash:'b'.repeat(64),total_minor:payload.totalMinor}).totalMinor,payload.totalMinor);
});
test('SQL quote/order transactions enforce expiry, revision, ownership, idempotency and outbox conservation',async()=>{
 const db=new PGlite();try{
 await db.exec("create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 for(const file of (await readdir(new URL('../../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
 const owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',quoteId='00000000-0000-4000-8000-000000000701',operation='00000000-0000-4000-8000-000000000801';
 await db.query('insert into auth.users(id) values($1),($2)',[owner,other]);await db.query("insert into public.projects(id,owner_user_id,source_draft_id,name,furniture_type,version,sync_status) values($1,$2,$3,'Test','table',1,'ready')",[identity.projectId,owner,'00000000-0000-4000-8000-000000000101']);
 await db.query("insert into public.design_revision_index(id,project_id,revision_number,snapshot_hash,state,created_by) values($1,$2,1,$3,'ready',$4)",[identity.revisionId,identity.projectId,identity.revisionHash,owner]);await db.query('update public.projects set current_revision_id=$1 where id=$2',[identity.revisionId,identity.projectId]);
 const {input,policy,prices}=testQuoteInputs(),payload=priceQuote(input,policy,prices,identity).snapshot;await db.query('insert into public.commerce_policies(version,approved,payload) values($1,true,$2)',[policy.version,JSON.stringify(policy)]);
 const issue=async(id=quoteId,who=owner)=>db.query('select (public.cutplan_issue_quote($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)).*',[who,id,identity.projectId,identity.revisionId,identity.revisionHash,policy.version,'b'.repeat(64),'c'.repeat(64),JSON.stringify(payload),payload.totalMinor]);
 const first=(await issue()).rows[0];assert.equal(Date.parse(first.expires_at)-Date.parse(first.issued_at),7*86400000);assert.equal((await issue()).rows[0].id,quoteId);await assert.rejects(issue(quoteId,other),/operation_conflict/);
 const confirm=async(op=operation,q=quoteId,a=address,who=owner)=>db.query('select (public.cutplan_confirm_order($1,$2,$3,$4)).*',[who,op,q,JSON.stringify(a)]);
 await assert.rejects(confirm(operation,quoteId,{...address,area:'Unknown'}),/invalid_address/);await assert.rejects(confirm(operation,quoteId,address,other),/quote_missing/);
 const order=(await confirm()).rows[0];assert.equal(order.payment_status,'not_collected');assert.equal((await confirm()).rows[0].id,order.id);assert.equal((await confirm('00000000-0000-4000-8000-000000000802')).rows[0].id,order.id);
 await assert.rejects(confirm(operation,quoteId,{...address,recipient:'Changed'}),/operation_conflict/);assert.equal((await db.query('select count(*) from public.customer_orders')).rows[0].count,1);assert.equal((await db.query('select count(*) from public.commerce_outbox')).rows[0].count,1);
 await assert.rejects(db.query("update public.quotations set total_minor=1 where id=$1",[quoteId]),/immutable_quote/);await assert.rejects(db.query("update public.customer_orders set status='delivered' where id=$1",[operation]),/phase16/);

 const expired='00000000-0000-4000-8000-000000000702';await db.query("insert into public.quotations(id,owner_user_id,project_id,revision_id,revision_hash,policy_version,request_hash,snapshot_hash,payload,total_minor,issued_at,expires_at) select $1,owner_user_id,project_id,revision_id,revision_hash,policy_version,request_hash,snapshot_hash,payload,total_minor,now()-interval '8 days',now()-interval '1 day' from public.quotations where id=$2",[expired,quoteId]);await assert.rejects(confirm('00000000-0000-4000-8000-000000000803',expired),/quote_expired/);
 const stale='00000000-0000-4000-8000-000000000703';await issue(stale);await db.query('update public.projects set current_revision_id=null where id=$1',[identity.projectId]);await assert.rejects(confirm('00000000-0000-4000-8000-000000000804',stale),/stale_revision/);
 await db.exec("create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
 await db.exec('set role authenticated');assert.equal((await db.query('select id from public.customer_orders')).rows.length,0);await assert.rejects(db.query('select payload from public.quotations'),/permission denied/);await assert.rejects(confirm(),/permission denied/);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);assert.equal((await db.query('select id from public.customer_orders')).rows.length,1);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);assert.equal((await db.query('select id from public.customer_orders')).rows.length,0);
 }finally{await db.close();}
});
