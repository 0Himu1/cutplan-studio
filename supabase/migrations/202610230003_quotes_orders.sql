begin;
create table public.commerce_policies(version text primary key, approved boolean not null default false, payload jsonb not null, created_at timestamptz not null default now());
create table public.quotations(
 id uuid primary key, owner_user_id uuid not null references auth.users(id), project_id text not null references public.projects(id), revision_id uuid not null,
 revision_hash text not null check(revision_hash ~ '^[0-9a-f]{64}$'), policy_version text not null references public.commerce_policies(version),
 request_hash text not null check(request_hash ~ '^[0-9a-f]{64}$'), snapshot_hash text not null check(snapshot_hash ~ '^[0-9a-f]{64}$'), payload jsonb not null,
 total_minor bigint not null check(total_minor between 0 and 99999999999999), currency text not null default 'BDT' check(currency='BDT'),
 issued_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '7 days', accepted_at timestamptz,
 foreign key(project_id,revision_id) references public.design_revision_index(project_id,id),check(expires_at=issued_at+interval '7 days')
);
create index quotations_owner on public.quotations(owner_user_id,issued_at desc);
create table public.customer_orders(
 id uuid primary key, owner_user_id uuid not null references auth.users(id), quotation_id uuid not null unique references public.quotations(id),
 project_id text not null references public.projects(id), revision_id uuid not null, accepted_snapshot jsonb not null, snapshot_hash text not null,
 total_minor bigint not null, currency text not null default 'BDT' check(currency='BDT'), address_snapshot jsonb not null,
 status text not null default 'confirmed' check(status in ('confirmed','in_production','ready_for_delivery','delivered')),
 payment_status text not null default 'not_collected' check(payment_status='not_collected'), created_at timestamptz not null default now(),
 foreign key(project_id,revision_id) references public.design_revision_index(project_id,id)
);
create table public.order_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.customer_orders(id),status text not null,created_at timestamptz not null default now());
create table public.commerce_outbox(id uuid primary key default gen_random_uuid(),kind text not null check(kind in ('quote_email','order_confirmed')),reference_id uuid not null,owner_user_id uuid not null references auth.users(id),state text not null default 'queued' check(state in ('queued','sending','sent','failed','review_required')),attempts integer not null default 0,lease_until timestamptz,provider_id text,recipient_email text,created_at timestamptz not null default now(),unique(kind,reference_id));
alter table public.commerce_policies enable row level security;
alter table public.quotations enable row level security;
alter table public.customer_orders enable row level security;
alter table public.order_events enable row level security;
alter table public.commerce_outbox enable row level security;
revoke all on public.commerce_policies,public.quotations,public.customer_orders,public.order_events,public.commerce_outbox from public,anon,authenticated;
grant select(id,owner_user_id,project_id,revision_id,total_minor,currency,issued_at,expires_at,accepted_at) on public.quotations to authenticated;
grant select(id,owner_user_id,quotation_id,project_id,revision_id,total_minor,currency,address_snapshot,status,payment_status,created_at) on public.customer_orders to authenticated;
grant select on public.order_events to authenticated;
grant select,insert on public.commerce_policies to service_role;
grant select,insert,update on public.quotations,public.customer_orders,public.commerce_outbox to service_role;
grant select,insert on public.order_events to service_role;
create policy quotation_owner on public.quotations for select to authenticated using(owner_user_id=(select auth.uid()));
create policy order_owner on public.customer_orders for select to authenticated using(owner_user_id=(select auth.uid()));
create policy event_owner on public.order_events for select to authenticated using(exists(select 1 from public.customer_orders o where o.id=order_id and o.owner_user_id=(select auth.uid())));

create function public.cutplan_issue_quote(p_owner uuid,p_id uuid,p_project text,p_revision uuid,p_revision_hash text,p_policy text,p_request_hash text,p_snapshot_hash text,p_payload jsonb,p_total bigint) returns public.quotations language plpgsql security definer set search_path='' as $$
declare q public.quotations; pr public.projects; pol public.commerce_policies;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into q from public.quotations where id=p_id;
 if found then if q.owner_user_id<>p_owner or q.request_hash<>p_request_hash then raise exception 'operation_conflict'; end if; return q; end if;
 select * into pr from public.projects where id=p_project for update;
 if not found or pr.owner_user_id<>p_owner or pr.deleted_at is not null or pr.sync_status<>'ready' or pr.current_revision_id is distinct from p_revision then raise exception 'stale_revision'; end if;
 if not exists(select 1 from public.design_revision_index where id=p_revision and project_id=p_project and snapshot_hash=p_revision_hash and state='ready') then raise exception 'revision_unverified'; end if;
 select * into pol from public.commerce_policies where version=p_policy;
 if not found or not pol.approved or p_payload->'policy' is distinct from pol.payload or p_payload->>'totalMinor' is distinct from p_total::text or p_payload->>'revisionHash' is distinct from p_revision_hash or p_payload->>'revisionId' is distinct from p_revision::text or p_payload->>'projectId' is distinct from p_project or pg_column_size(p_payload)>262144 then raise exception 'invalid_quote'; end if;
 insert into public.quotations(id,owner_user_id,project_id,revision_id,revision_hash,policy_version,request_hash,snapshot_hash,payload,total_minor) values(p_id,p_owner,p_project,p_revision,p_revision_hash,p_policy,p_request_hash,p_snapshot_hash,p_payload,p_total) returning * into q;return q;
end; $$;

create function public.cutplan_confirm_order(p_owner uuid,p_operation uuid,p_quote uuid,p_address jsonb) returns public.customer_orders language plpgsql security definer set search_path='' as $$
declare q public.quotations; o public.customer_orders; pr public.projects;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_operation::text,0));
 select * into o from public.customer_orders where id=p_operation;
 if found then if o.owner_user_id<>p_owner or o.quotation_id<>p_quote or o.address_snapshot is distinct from p_address then raise exception 'operation_conflict'; end if;return o;end if;
 select * into q from public.quotations where id=p_quote for update;
 if not found or q.owner_user_id<>p_owner then raise exception 'quote_missing'; end if;
 select * into o from public.customer_orders where quotation_id=p_quote;
 if found then if o.address_snapshot is distinct from p_address then raise exception 'operation_conflict'; end if;return o;end if;
 select * into pr from public.projects where id=q.project_id for update;
 if pr.owner_user_id<>p_owner or pr.deleted_at is not null or pr.current_revision_id is distinct from q.revision_id or pr.sync_status<>'ready' then raise exception 'stale_revision'; end if;
 if q.expires_at<=now() then raise exception 'quote_expired';end if;
 if jsonb_typeof(p_address) is distinct from 'object' or (select array_agg(key order by key) from jsonb_object_keys(p_address) key)<>array['address','area','phone','recipient'] then raise exception 'invalid_address'; end if;
 if jsonb_typeof(p_address->'recipient') is distinct from 'string' or char_length(btrim(p_address->>'recipient')) not between 2 and 100 or jsonb_typeof(p_address->'address') is distinct from 'string' or char_length(btrim(p_address->>'address')) not between 12 and 400 or p_address::text ~ '\\u00(0[0-9a-f]|1[0-9a-f]|7f)' or coalesce(p_address->>'phone','') !~ '^01[3-9][0-9]{8}$' or not coalesce(q.payload->'policy'->'areas' ? (p_address->>'area'),false) then raise exception 'invalid_address'; end if;
 insert into public.customer_orders(id,owner_user_id,quotation_id,project_id,revision_id,accepted_snapshot,snapshot_hash,total_minor,address_snapshot) values(p_operation,p_owner,q.id,q.project_id,q.revision_id,q.payload,q.snapshot_hash,q.total_minor,p_address) returning * into o;
 update public.quotations set accepted_at=now() where id=q.id;
 insert into public.order_events(order_id,status) values(o.id,'confirmed');
 insert into public.commerce_outbox(kind,reference_id,owner_user_id) values('order_confirmed',o.id,p_owner);
 return o;
end; $$;

create function public.cutplan_commerce_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_table_name='quotations' and (to_jsonb(new)-'accepted_at') is distinct from (to_jsonb(old)-'accepted_at') then raise exception 'immutable_quote';end if;
 if tg_table_name='quotations' then if old.accepted_at is not null and new.accepted_at is distinct from old.accepted_at then raise exception 'immutable_acceptance';end if;end if;
 if tg_table_name='customer_orders' then raise exception 'order_changes_require_phase16_transition';end if;return new;
end; $$;
create trigger quotation_immutable before update on public.quotations for each row execute function public.cutplan_commerce_immutable();
create trigger order_immutable before update on public.customer_orders for each row execute function public.cutplan_commerce_immutable();
revoke all on function public.cutplan_issue_quote(uuid,uuid,text,uuid,text,text,text,text,jsonb,bigint),public.cutplan_confirm_order(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_issue_quote(uuid,uuid,text,uuid,text,text,text,text,jsonb,bigint),public.cutplan_confirm_order(uuid,uuid,uuid,jsonb) to service_role;
commit;
