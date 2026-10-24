begin;
alter table public.catalog_items add column source_name text, add column source_url text, add column source_captured_at timestamptz;
alter table public.catalog_items add constraint catalog_source_url check (source_url is null or source_url ~ '^https://');
commit;
