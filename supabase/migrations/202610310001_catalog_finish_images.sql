begin;
-- Public catalog swatches only; private customer photos keep their existing bucket and policies.
do $$
declare configured boolean;
begin
 if to_regclass('storage.buckets') is not null then
  execute $q$insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
   values('catalog-finishes','catalog-finishes',true,10485760,array['image/webp']) on conflict(id) do nothing$q$;
  execute $q$select public and file_size_limit=10485760 and allowed_mime_types=array['image/webp'] from storage.buckets where id='catalog-finishes'$q$ into configured;
  if not coalesce(configured,false) then raise exception 'catalog_finish_bucket_configuration_conflict'; end if;
 end if;
end; $$;
commit;
