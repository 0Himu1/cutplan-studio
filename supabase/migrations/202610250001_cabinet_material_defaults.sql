begin;

-- Add role defaults without changing policies, grants, ownership or save limits.
create or replace function public.cutplan_valid_project_snapshot(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; core jsonb; pair record; assignment jsonb; thickness_key text;
begin
 if p->>'stage' is distinct from 'cabinet-design' then return public.cutplan_valid_project_snapshot_v13(p); end if;
 c:=p->'cabinet';
 if jsonb_typeof(c) is distinct from 'object' or pg_column_size(p)>131072 then return false; end if;
 core:=jsonb_set(p,'{cabinet}',c-array['doorPosition','compartmentMode','compartments','materialDefaults']);
 if not public.cutplan_valid_project_snapshot_v13(core) then return false; end if;
 if c ? 'materialDefaults' then
  if jsonb_typeof(c->'materialDefaults') is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(c->'materialDefaults'))>3 then return false; end if;
  for pair in select * from jsonb_each(c->'materialDefaults') loop
   if pair.key not in ('body','back','front') or jsonb_typeof(pair.value) is distinct from 'object' then return false; end if;
   if pair.value ? 'previewColor' and (jsonb_typeof(pair.value->'previewColor') is distinct from 'string' or pair.value->>'previewColor' !~ '^#[0-9A-Fa-f]{6}$') then return false; end if;
   assignment:=pair.value-'previewColor';
   if not public.cutplan_valid_panel_overrides(jsonb_build_object('cabinet/top',assignment)) then return false; end if;
   thickness_key:=case pair.key when 'body' then 'bodyThicknessMm' when 'back' then 'backThicknessMm' else 'doorThicknessMm' end;
   if assignment ? 'boardId' and (assignment->>'thicknessMm')::numeric<>(c->>thickness_key)::numeric then return false; end if;
  end loop;
 end if;
 if c ? 'doorPosition' and coalesce(c->>'doorPosition','') not in ('inset','overlay') then return false; end if;
 if c ? 'compartmentMode' and coalesce(c->>'compartmentMode','') not in ('auto','manual') then return false; end if;
 if c ? 'compartments' then
  if not (c ? 'compartmentMode') or not public.cutplan_valid_compartments(c->'compartments') then return false; end if;
 elsif c->>'compartmentMode'='manual' then return false;
 end if;
 return true;
end; $$;

commit;
