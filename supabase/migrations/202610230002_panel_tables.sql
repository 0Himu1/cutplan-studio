begin;
alter function public.cutplan_valid_project_snapshot(jsonb) rename to cutplan_valid_project_snapshot_v11;
create function public.cutplan_valid_project_snapshot(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; core jsonb; pair record; overrides jsonb; k text; w numeric; h numeric; d numeric;
begin
 if p->>'furnitureType' is distinct from 'table' or p->>'stage' is distinct from 'furniture-design' then return public.cutplan_valid_project_snapshot_v11(p); end if;
 if (select array_agg(key order by key) from jsonb_object_keys(p) key)<>array['configuration','engineVersion','furnitureType','name','schemaVersion','stage','templateKey'] or p->>'engineVersion' is distinct from 'casework-review-1.0.0' or p->>'templateKey' is distinct from 'table-panel-trestle-v1' then return false; end if;
 c:=p->'configuration';
 if jsonb_typeof(c) is distinct from 'object' or c->>'family' is distinct from 'table' or coalesce(c->>'tableKind','') not in ('study','dining','side') then return false; end if;
 foreach k in array array['widthMm','heightMm','depthMm','bodyThicknessMm'] loop if jsonb_typeof(c->k) is distinct from 'number' then return false; end if; end loop;
 if c->'doorCount' is distinct from '0'::jsonb or c->'shelfCount' is distinct from '0'::jsonb or c->'skirtingHeightMm' is distinct from '0'::jsonb or (c->>'bodyThicknessMm')::numeric not between 18 and 40 then return false; end if;
 w:=(c->>'widthMm')::numeric;h:=(c->>'heightMm')::numeric;d:=(c->>'depthMm')::numeric;
 if c->>'tableKind'='study' and (w not between 800 and 1600 or h not between 650 and 850 or d not between 450 and 800) then return false; end if;
 if c->>'tableKind'='dining' and (w not between 900 and 1800 or h not between 700 and 800 or d not between 600 and 1000) then return false; end if;
 if c->>'tableKind'='side' and (w not between 300 and 800 or h not between 350 and 750 or d not between 300 and 800) then return false; end if;
 core:=c-array['family','tableKind'];
 if c ? 'panelOverrides' then
  if jsonb_typeof(c->'panelOverrides') is distinct from 'object' then return false; end if;
  overrides:='{}'::jsonb;
  for pair in select * from jsonb_each(c->'panelOverrides') loop
   if pair.key !~ '^table/(top|side-left|side-right|back)$' then return false; end if;
   if pair.value ? 'thicknessMm' and (jsonb_typeof(pair.value->'thicknessMm') is distinct from 'number' or (pair.value->>'thicknessMm')::numeric not between 18 and 40) then return false; end if;
   overrides:=overrides||jsonb_build_object(replace(pair.key,'table/','cabinet/'),pair.value);
  end loop;
  core:=jsonb_set(core,'{panelOverrides}',overrides);
 end if;
 return public.cutplan_valid_project_snapshot_v9(jsonb_build_object('schemaVersion',p->'schemaVersion','name',p->'name','furnitureType','cabinet','stage','cabinet-design','engineVersion','cabinet-review-1.0.0','templateKey','cabinet-between-sides-inset-doors-v1','cabinet',core));
end; $$;
revoke all on function public.cutplan_valid_project_snapshot(jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_valid_project_snapshot(jsonb) to service_role;
commit;
