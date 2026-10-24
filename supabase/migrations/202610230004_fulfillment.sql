begin;
create table public.manufacturers(id uuid primary key default gen_random_uuid(),name text not null check(char_length(name) between 2 and 120),is_active boolean not null default false);
create table public.machine_profiles(id uuid primary key default gen_random_uuid(),manufacturer_id uuid not null references public.manufacturers(id),version text not null,qualified boolean not null default false,approval_reference text not null,payload jsonb not null,unique(manufacturer_id,version));
create table public.manufacturer_bids(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.customer_orders(id),manufacturer_id uuid not null references public.manufacturers(id),machine_profile_id uuid not null references public.machine_profiles(id),revision_id uuid not null,scope_hash text not null,amount_minor bigint not null check(amount_minor>=0),qualified boolean not null default false,valid_until timestamptz not null,created_by uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.customer_orders add column version integer not null default 1,add column manufacturer_id uuid references public.manufacturers(id),add column selected_bid_id uuid references public.manufacturer_bids(id),add column machine_profile_id uuid references public.machine_profiles(id);
create table public.fulfillment_operations(id uuid primary key,actor_id uuid not null references auth.users(id),order_id uuid not null references public.customer_orders(id),request_hash text not null,result jsonb not null,created_at timestamptz not null default now());
create table public.fulfillment_audit(id uuid primary key default gen_random_uuid(),operation_id uuid not null unique references public.fulfillment_operations(id),actor_id uuid not null references auth.users(id),order_id uuid not null references public.customer_orders(id),action text not null,reason text not null,from_status text not null,to_status text not null,created_at timestamptz not null default now());
create function public.cutplan_fulfillment_staff(p_actor uuid,p_admin boolean default false) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.staff_memberships where user_id=p_actor and is_active and (role='admin' or (not p_admin and role='operator')))$$;
alter table public.manufacturers enable row level security;alter table public.machine_profiles enable row level security;alter table public.manufacturer_bids enable row level security;alter table public.fulfillment_operations enable row level security;alter table public.fulfillment_audit enable row level security;
revoke all on public.manufacturers,public.machine_profiles,public.manufacturer_bids,public.fulfillment_operations,public.fulfillment_audit from public,anon,authenticated;
grant select on public.manufacturers,public.machine_profiles,public.manufacturer_bids,public.fulfillment_operations,public.fulfillment_audit to service_role;

create or replace function public.cutplan_commerce_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_table_name='quotations' then
  if (to_jsonb(new)-'accepted_at') is distinct from (to_jsonb(old)-'accepted_at') then raise exception 'immutable_quote';end if;
  if old.accepted_at is not null and new.accepted_at is distinct from old.accepted_at then raise exception 'immutable_acceptance';end if;
 elsif tg_table_name='customer_orders' then
  if (to_jsonb(new)-array['status','version','manufacturer_id','selected_bid_id','machine_profile_id']) is distinct from (to_jsonb(old)-array['status','version','manufacturer_id','selected_bid_id','machine_profile_id']) or new.version<>old.version+1 or not exists(select 1 from public.fulfillment_operations where id::text=current_setting('cutplan.fulfillment_operation',true) and order_id=old.id and (result->>'version')::integer=new.version and result->>'status'=new.status) then raise exception 'order_changes_require_phase16_transition';end if;
 end if;return new;
end; $$;

create function public.cutplan_fulfillment(p_actor uuid,p_operation uuid,p_order uuid,p_expected integer,p_action text,p_bid uuid,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.customer_orders; b public.manufacturer_bids; m public.machine_profiles; op public.fulfillment_operations; request text; target text; result jsonb; s jsonb;
begin
 if not public.cutplan_fulfillment_staff(p_actor,p_action='assign') then raise exception 'staff_required';end if;
 if p_action not in ('assign','advance') or p_action is null or p_reason is null or char_length(btrim(p_reason)) not between 5 and 240 or p_reason ~ '[[:cntrl:]]' then raise exception 'invalid_operation';end if;
 request:=jsonb_build_array(p_order,p_expected,p_action,p_bid,p_reason)::text;
 perform pg_advisory_xact_lock(hashtextextended(p_operation::text,0));select * into op from public.fulfillment_operations where id=p_operation;
 if found then if op.actor_id<>p_actor or op.request_hash<>request then raise exception 'operation_conflict';end if;return op.result;end if;
 select * into o from public.customer_orders where id=p_order for update;
 if not found then raise exception 'order_missing';end if;if o.version<>p_expected then raise exception 'version_conflict';end if;
 target:=o.status;
 if p_action='assign' then
  if o.status<>'confirmed' then raise exception 'assignment_locked';end if;
  select * into b from public.manufacturer_bids where id=p_bid and order_id=o.id for share;
  if not found or not b.qualified or b.valid_until<=now() or b.revision_id<>o.revision_id or b.scope_hash<>o.snapshot_hash then raise exception 'bid_ineligible';end if;
  select * into m from public.machine_profiles where id=b.machine_profile_id for share;
  if not found or not m.qualified or m.manufacturer_id<>b.manufacturer_id or char_length(btrim(m.approval_reference))<5 or not exists(select 1 from public.manufacturers where id=b.manufacturer_id and is_active) then raise exception 'profile_ineligible';end if;
  if not coalesce(m.payload->'envelopes' ? (o.accepted_snapshot->'policy'->'machine'->>'version'),false) or not coalesce(m.payload->'operations' ? 'rectangular_profile',false) or (m.payload->>'toolDiameterMm')::numeric>(o.accepted_snapshot->'policy'->'machine'->>'spacingMm')::numeric or (m.payload->>'minMarginMm')::numeric>(o.accepted_snapshot->'policy'->'machine'->>'marginMm')::numeric then raise exception 'profile_incompatible';end if;
  for s in select * from jsonb_array_elements(o.accepted_snapshot->'nesting'->'sheets') loop
   if (s->>'width')::numeric>(m.payload->>'widthMm')::numeric or (s->>'height')::numeric>(m.payload->>'heightMm')::numeric or ((s->>'stockKey')::jsonb->>1)::numeric>(m.payload->>'maxThicknessMm')::numeric then raise exception 'profile_incompatible';end if;
  end loop;
 else
  if p_bid is not null then raise exception 'invalid_operation';end if;
  target:=case o.status when 'confirmed' then 'in_production' when 'in_production' then 'ready_for_delivery' when 'ready_for_delivery' then 'delivered' else null end;
  if target is null or (o.status='confirmed' and (o.machine_profile_id is null or o.selected_bid_id is null)) then raise exception 'transition_blocked';end if;
  if o.status='confirmed' and not exists(select 1 from public.machine_profiles mp join public.manufacturers mf on mf.id=mp.manufacturer_id where mp.id=o.machine_profile_id and mp.qualified and mf.is_active) then raise exception 'qualification_revoked';end if;
 end if;
 result:=jsonb_build_object('id',o.id,'version',o.version+1,'status',target);
 insert into public.fulfillment_operations(id,actor_id,order_id,request_hash,result) values(p_operation,p_actor,o.id,request,result);
 perform set_config('cutplan.fulfillment_operation',p_operation::text,true);
 update public.customer_orders set status=target,version=version+1,manufacturer_id=case when p_action='assign' then b.manufacturer_id else manufacturer_id end,selected_bid_id=case when p_action='assign' then b.id else selected_bid_id end,machine_profile_id=case when p_action='assign' then m.id else machine_profile_id end where id=o.id;
 insert into public.fulfillment_audit(operation_id,actor_id,order_id,action,reason,from_status,to_status) values(p_operation,p_actor,o.id,p_action,p_reason,o.status,target);
 if target<>o.status then insert into public.order_events(order_id,status) values(o.id,target);end if;
 return result;
end; $$;
revoke all on function public.cutplan_fulfillment_staff(uuid,boolean),public.cutplan_fulfillment(uuid,uuid,uuid,integer,text,uuid,text) from public,anon,authenticated;
grant execute on function public.cutplan_fulfillment_staff(uuid,boolean),public.cutplan_fulfillment(uuid,uuid,uuid,integer,text,uuid,text) to service_role;

create function public.cutplan_valid_machine_profile(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text;
begin
 if jsonb_typeof(p) is distinct from 'object' or (select array_agg(key order by key) from jsonb_object_keys(p) key)<>array['envelopes','heightMm','maxThicknessMm','minMarginMm','operations','toolDiameterMm','widthMm'] then return false;end if;
 foreach k in array array['widthMm','heightMm','maxThicknessMm','toolDiameterMm','minMarginMm'] loop
  if jsonb_typeof(p->k) is distinct from 'number' or (p->>k)::numeric<0 or (p->>k)::numeric>100000 or (k<>'minMarginMm' and (p->>k)::numeric=0) then return false;end if;
 end loop;
 if jsonb_typeof(p->'envelopes') is distinct from 'array' or jsonb_array_length(p->'envelopes') not between 1 and 20 or exists(select 1 from jsonb_array_elements(p->'envelopes') v where jsonb_typeof(v)<>'string' or char_length(v#>>'{}') not between 1 and 160) then return false;end if;
 return p->'operations'='["rectangular_profile"]'::jsonb;
exception when others then return false;
end; $$;
alter table public.machine_profiles add constraint profile_capability_valid check(public.cutplan_valid_machine_profile(payload));
create table public.fulfillment_setup_log(id uuid primary key,actor_id uuid not null references auth.users(id),kind text not null,payload jsonb not null,created_at timestamptz not null default now());
alter table public.fulfillment_setup_log enable row level security;
revoke all on public.fulfillment_setup_log from public,anon,authenticated;grant select on public.fulfillment_setup_log to service_role;
create function public.cutplan_register_fulfillment(p_actor uuid,p_kind text,p_id uuid,p_payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare existing public.fulfillment_setup_log;
begin
 if not public.cutplan_fulfillment_staff(p_actor,true) then raise exception 'staff_required';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>8192 then raise exception 'invalid_setup';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into existing from public.fulfillment_setup_log where id=p_id;
 if found then if existing.actor_id<>p_actor or existing.kind<>p_kind or existing.payload is distinct from p_payload then raise exception 'operation_conflict';end if;return p_id;end if;
 if p_kind='manufacturer' then
  if (select array_agg(key order by key) from jsonb_object_keys(p_payload) key)<>array['is_active','name'] or jsonb_typeof(p_payload->'name') is distinct from 'string' or jsonb_typeof(p_payload->'is_active') is distinct from 'boolean' or p_payload->>'name' ~ '[[:cntrl:]]' then raise exception 'invalid_setup';end if;
  insert into public.manufacturers(id,name,is_active) values(p_id,p_payload->>'name',(p_payload->>'is_active')::boolean);
 elsif p_kind='profile' then
  if (select array_agg(key order by key) from jsonb_object_keys(p_payload) key)<>array['approvalReference','capability','manufacturerId','qualified','version'] or jsonb_typeof(p_payload->'qualified') is distinct from 'boolean' or jsonb_typeof(p_payload->'version') is distinct from 'string' or char_length(p_payload->>'version') not between 1 and 100 or jsonb_typeof(p_payload->'approvalReference') is distinct from 'string' or char_length(btrim(p_payload->>'approvalReference')) not between 5 and 240 or not public.cutplan_valid_machine_profile(p_payload->'capability') then raise exception 'invalid_setup';end if;
  insert into public.machine_profiles(id,manufacturer_id,version,qualified,approval_reference,payload) values(p_id,(p_payload->>'manufacturerId')::uuid,p_payload->>'version',(p_payload->>'qualified')::boolean,p_payload->>'approvalReference',p_payload->'capability');
 elsif p_kind='bid' then
  if (select array_agg(key order by key) from jsonb_object_keys(p_payload) key)<>array['amountMinor','manufacturerId','orderId','profileId','qualified','revisionId','scopeHash','validUntil'] or jsonb_typeof(p_payload->'qualified') is distinct from 'boolean' or coalesce(p_payload->>'amountMinor','') !~ '^[0-9]{1,14}$' or coalesce(p_payload->>'scopeHash','') !~ '^[0-9a-f]{64}$' or (p_payload->>'validUntil')::timestamptz<=now() then raise exception 'invalid_setup';end if;
  if not exists(select 1 from public.machine_profiles where id=(p_payload->>'profileId')::uuid and manufacturer_id=(p_payload->>'manufacturerId')::uuid) or not exists(select 1 from public.customer_orders where id=(p_payload->>'orderId')::uuid and revision_id=(p_payload->>'revisionId')::uuid and snapshot_hash=p_payload->>'scopeHash') then raise exception 'scope_mismatch';end if;
  insert into public.manufacturer_bids(id,order_id,manufacturer_id,machine_profile_id,revision_id,scope_hash,amount_minor,qualified,valid_until,created_by) values(p_id,(p_payload->>'orderId')::uuid,(p_payload->>'manufacturerId')::uuid,(p_payload->>'profileId')::uuid,(p_payload->>'revisionId')::uuid,p_payload->>'scopeHash',(p_payload->>'amountMinor')::bigint,(p_payload->>'qualified')::boolean,(p_payload->>'validUntil')::timestamptz,p_actor);
 else raise exception 'invalid_setup';end if;
 insert into public.fulfillment_setup_log(id,actor_id,kind,payload) values(p_id,p_actor,p_kind,p_payload);return p_id;
end; $$;
revoke all on function public.cutplan_valid_machine_profile(jsonb),public.cutplan_register_fulfillment(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_valid_machine_profile(jsonb),public.cutplan_register_fulfillment(uuid,text,uuid,jsonb) to service_role;

commit;
