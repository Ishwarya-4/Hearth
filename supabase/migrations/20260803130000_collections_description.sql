-- A short note about the collection itself (not per-photo), shown alongside
-- its title and date inside the collection.
alter table public.collections add column if not exists description text;
