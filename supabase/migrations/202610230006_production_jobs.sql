begin;
-- Staged foundation only. No machine profile is qualified by this migration.
create table public.production_jobs (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.customer_orders(id),
 revision_id uuid not null references public.design_revision_index(id),
 snapshot_hash text not null check(snapshot_hash ~ '^[a-f0-9]{64}$'),
 machine_profile_id uuid references public.machine_profiles(id),
 engine_version text not null,
 input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
 accepted_snapshot jsonb not null,
 state text not null default 'awaiting_profile' check(state in ('awaiting_profile','queued','running','succeeded','failed','cancelled')),
 attempts integer not null default 0 check(attempts between 0 and 3),
 lease_token uuid,
 lease_until timestamptz,
 last_error text,
 result_manifest jsonb,
 completed_token uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check((state='running')=(lease_token is not null and lease_until is not null)),
 check(state<>'succeeded' or (result_manifest is not null and completed_token is not null)),
 check(state not in ('queued','running','succeeded') or machine_profile_id is not null)
);
create unique index production_jobs_profile_scope on public.production_jobs(order_id,revision_id,machine_profile_id,engine_version,input_hash) where machine_profile_id is not null;
create unique index production_jobs_pending_scope on public.production_jobs(order_id,revision_id,engine_version,input_hash) where machine_profile_id is null;
alter table public.production_jobs enable row level security;
revoke all on public.production_jobs from public,anon,authenticated;
grant select on public.production_jobs to service_role;

create function public.cutplan_freeze_production() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.production_jobs(order_id,revision_id,snapshot_hash,engine_version,input_hash,accepted_snapshot)
 values(new.id,new.revision_id,new.snapshot_hash,coalesce(new.accepted_snapshot#>>'{design,engineVersion}','unsupported'),new.snapshot_hash,new.accepted_snapshot)
 on conflict do nothing;
 return new;
end $$;
create trigger freeze_order_production after insert on public.customer_orders for each row execute function public.cutplan_freeze_production();
revoke all on function public.cutplan_freeze_production() from public,anon,authenticated;

create function public.cutplan_production_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if (to_jsonb(new)-array['state','attempts','lease_token','lease_until','last_error','result_manifest','completed_token','updated_at']) is distinct from (to_jsonb(old)-array['state','attempts','lease_token','lease_until','last_error','result_manifest','completed_token','updated_at']) then raise exception 'production_scope_immutable';end if;
 new.updated_at=now();return new;
end $$;
create trigger immutable_production_scope before update on public.production_jobs for each row execute function public.cutplan_production_immutable();

-- No queue/qualification/release RPC exists until a real postprocessor and supervised machine trial are approved.
-- Workers can lease only explicitly queued jobs; awaiting-profile records cannot be claimed.
create function public.cutplan_claim_production(p_job uuid,p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.production_jobs;
begin
 if p_token is null then raise exception 'lease_token_required';end if;
 select * into j from public.production_jobs where id=p_job for update;
 if not found then raise exception 'job_unavailable';end if;
 if j.state='running' and j.lease_until>now() and j.lease_token=p_token then return to_jsonb(j);end if;
 if not exists(select 1 from public.machine_profiles m join public.manufacturers f on f.id=m.manufacturer_id where m.id=j.machine_profile_id and m.qualified and f.is_active) then raise exception 'profile_unavailable';end if;
 if not (j.state='queued' or (j.state='running' and j.lease_until<=now())) or j.attempts>=3 then raise exception 'job_not_claimable';end if;
 update public.production_jobs set state='running',attempts=attempts+1,lease_token=p_token,lease_until=now()+interval '60 seconds',last_error=null where id=p_job returning * into j;
 return to_jsonb(j);
end $$;
create function public.cutplan_finish_production(p_job uuid,p_token uuid,p_action text,p_manifest jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.production_jobs;
begin
 select * into j from public.production_jobs where id=p_job for update;
 if found and j.state='succeeded' and p_action='complete' and j.completed_token=p_token and j.result_manifest=p_manifest then return to_jsonb(j);end if;
 if not found or j.state<>'running' or j.lease_token is distinct from p_token or j.lease_until<=now() then raise exception 'lease_lost';end if;
 if p_action='heartbeat' then update public.production_jobs set lease_until=now()+interval '60 seconds' where id=p_job returning * into j;
 elsif p_action='retry' then update public.production_jobs set state=case when attempts<3 then 'queued' else 'failed' end,lease_token=null,lease_until=null,last_error='generation_failed' where id=p_job returning * into j;
 elsif p_action='cancel' then update public.production_jobs set state='cancelled',lease_token=null,lease_until=null where id=p_job returning * into j;
 elsif p_action='complete' then
  if p_manifest is null or (p_manifest->>'purpose') is distinct from 'simulation_only' or (p_manifest->>'machineUseAllowed') is distinct from 'false' or (p_manifest->>'revisionId') is distinct from j.revision_id::text or (p_manifest->>'revisionHash') is distinct from j.snapshot_hash or coalesce(p_manifest->>'packageHash','') !~ '^[a-f0-9]{64}$' then raise exception 'manifest_invalid';end if;
  update public.production_jobs set state='succeeded',lease_token=null,lease_until=null,result_manifest=p_manifest,completed_token=p_token where id=p_job returning * into j;
 else raise exception 'invalid_job_action';end if;
 return to_jsonb(j);
end $$;
revoke all on function public.cutplan_claim_production(uuid,uuid),public.cutplan_finish_production(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_claim_production(uuid,uuid),public.cutplan_finish_production(uuid,uuid,text,jsonb) to service_role;

commit;
