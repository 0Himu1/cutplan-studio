// Loopback-only test double for Supabase protocol contracts. Never used by the app preview.
import { createServer } from 'node:http';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import {defaultFurniture} from '../src/lib/furniture/families.ts';
import {furnitureSnapshot} from '../src/lib/projects/contracts.ts';
import {snapshotHash} from '../src/lib/projects/identity.ts';
import {freezeReview} from '../src/lib/production/review.ts';

const assemblyInput=defaultFurniture('table'),assemblyDesign=furnitureSnapshot('Synthetic accepted table',assemblyInput),assemblyHash=snapshotHash(assemblyDesign);
const port = 3121;
const users = new Map();
const oauthFlows = new Map();
const oauthCodes = new Map();
let refreshes = 0;
let revoked = false;
let failProfile = false;
let unitTestStaff = false;
function identity(email) {
  if (!users.has(email)) users.set(email, { id: `00000000-0000-4000-8000-${String(users.size + 1).padStart(12,'0')}`, email, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, email_confirmed_at: new Date().toISOString(), created_at: new Date().toISOString() });
  return users.get(email);
}
function session(user, short = false) {
  const expiresIn = short ? 1 : 3600;
  const expires = Math.floor(Date.now()/1000) + expiresIn;
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, aud: 'authenticated', role: 'authenticated', iat: Math.floor(Date.now()/1000), exp: expires })).toString('base64url');
  const signature = createHmac('sha256','contract-only-signing-key').update(`${head}.${payload}`).digest('base64url');
  return { access_token: `${head}.${payload}.${signature}`, token_type: 'bearer', expires_in: expiresIn, expires_at: expires, refresh_token: `refresh:${user.email}`, user };
}
function fromToken(header) {
  try { const claims = JSON.parse(Buffer.from(header.split(' ')[1].split('.')[1],'base64url').toString()); return [...users.values()].find(user => user.id === claims.sub); } catch { return null; }
}
const profiles = new Map();
const api = createServer(async (request,response) => {
  const url = new URL(request.url,`http://127.0.0.1:${port}`);
  const chunks=[]; for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();
  let data={}; try { data=JSON.parse(body || '{}'); } catch { /* malformed caller */ }
  function send(value,status=200) { response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Supabase-Api-Version':'2024-01-01'}); response.end(JSON.stringify(value)); }
  if(url.pathname==='/test/unit-staff'){unitTestStaff=data.enabled===true;return send({enabled:unitTestStaff});}
  if(url.pathname==='/health') return send({status:'test-double'});
  if(url.pathname==='/auth/v1/authorize') {
    const flow=randomUUID();
    oauthFlows.set(flow,{challenge:url.searchParams.get('code_challenge'),redirect:url.searchParams.get('redirect_to')});
    response.writeHead(200,{'Content-Type':'text/html'});
    return response.end(`<h1>Isolated contract identity provider</h1><p>No Google account or cloud service is contacted.</p><a href="/test/consent?flow=${flow}">Allow contract sign-in</a><br><a href="/test/consent?flow=${flow}&deny=1">Cancel contract sign-in</a>`);
  }
  if(url.pathname==='/test/consent') {
    const flow=oauthFlows.get(url.searchParams.get('flow')); if(!flow) return send({error:'Missing flow'},400);
    oauthFlows.delete(url.searchParams.get('flow'));
    const destination=new URL(flow.redirect);
    if(url.searchParams.has('deny')) destination.searchParams.set('error','access_denied');
    else { const code=randomUUID(); oauthCodes.set(code,flow.challenge); destination.searchParams.set('code',code); }
    response.writeHead(303,{Location:destination.href});return response.end();
  }
  if(url.pathname==='/test/control') { revoked = data.revoked ?? revoked; failProfile = data.failProfile ?? failProfile; return send({refreshes}); }
  if(url.pathname==='/auth/v1/otp') {
    if(data.email==='delivery-failure@example.test') return send({code:'unexpected_failure',msg:'private internal transport detail'},500);
    if(data.email==='quota@example.test') return send({code:'over_email_send_rate_limit',msg:'quota'},429);
    identity(data.email); return send({});
  }
  if(url.pathname==='/auth/v1/verify') {
    if(data.token!=='123456') return send({code:'otp_expired',msg:'Invalid token'},403);
    revoked=false; return send(session(identity(data.email),data.email==='refresh@example.test'));
  }
  if(url.pathname==='/auth/v1/token') {
    if(url.searchParams.get('grant_type')==='pkce') {
      const challenge=oauthCodes.get(data.auth_code);
      const supplied=createHash('sha256').update(data.code_verifier ?? '').digest('base64url');
      if(!challenge || supplied!==challenge) return send({code:'bad_code_verifier',msg:'Invalid PKCE code'},400);
      oauthCodes.delete(data.auth_code);
      return send(session(identity('google-contract@example.test')));
    }
    if(revoked) return send({code:'refresh_token_not_found',msg:'Revoked'},401);
    refreshes++; return send(session(identity(data.refresh_token.replace('refresh:',''))));
  }
  if(url.pathname==='/rest/v1/customer_orders'&&request.method==='GET'){
    const owner=url.searchParams.get('owner_user_id'),id=url.searchParams.get('id');
    if(owner!=='eq.00000000-0000-4000-8000-000000000001')return send([]);
    if(id!=='eq.00000000-0000-4000-8000-000000000801'&&id!=='eq.00000000-0000-4000-8000-000000000803')return send([]);
    return send([{id:id.slice(3),revision_id:'00000000-0000-4000-8000-000000000301',accepted_snapshot:{revisionId:'00000000-0000-4000-8000-000000000301',revisionHash:id.endsWith('803')?'f'.repeat(64):assemblyHash,design:assemblyDesign,nesting:freezeReview(assemblyInput).nesting,privateMargin:'DO-NOT-EXPORT'}}]);
  }
  const user = fromToken(request.headers.authorization ?? '');
  if(url.pathname==='/auth/v1/user') return revoked || !user ? send({code:'bad_jwt',msg:'Invalid session'},401) : send(user);
  if(url.pathname==='/auth/v1/logout') return send({});
  if(url.pathname==='/rest/v1/staff_memberships')return send(unitTestStaff&&user?[{role:'admin',is_active:true}]:[]);
  if(url.pathname==='/rest/v1/profiles') {
    if(revoked || !user) return send({message:'Unauthorized'},401);
    if(failProfile) return send({message:'Profile storage unavailable'},503);
    // This checks the API's owner filter contract, not PostgreSQL RLS execution.
    if(url.searchParams.get('id')!==`eq.${user.id}`) return send({message:'Owner filter required'},403);
    let profile=profiles.get(user.id) ?? {display_name:'',phone:null};
    if(request.method==='PATCH') { profile={...profile,...data}; profiles.set(user.id,profile); }
    return send(profile);
  }
  return send({message:'Unknown contract endpoint'},404);
});
api.listen(port,'127.0.0.1');
const contractOptions={
  env:{...process.env,CUTPLAN_CONTRACT_BUILD:'true',NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${port}`,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'contract-test-public-key',AUTH_EMAIL_OTP_ENABLED:process.env.CONTRACT_GOOGLE==='true'?'false':'true',AUTH_GOOGLE_ENABLED:process.env.CONTRACT_GOOGLE==='true'?'true':'false',AUTH_COOKIE_SECURE:'false',APP_ORIGIN:'http://127.0.0.1:3101'},stdio:'inherit',windowsHide:true
};
let app=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],contractOptions);
function stop(){ app.kill(); api.close(); }
process.on('SIGTERM',stop); process.on('SIGINT',stop);
const buildCode=await new Promise(resolve=>app.once('exit',resolve));
if(buildCode!==0){api.close();process.exit(buildCode ?? 1);}
app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],contractOptions);
app.on('exit',code=>{api.close(); process.exitCode=code ?? 0;});
