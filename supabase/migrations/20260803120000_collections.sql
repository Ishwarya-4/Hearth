-- Collections: named, curated photo albums. A collection item is EITHER a
-- link to an existing moment (pulls in that moment's photo) OR a standalone
-- photo uploaded directly into the collection -- standalone photos never
-- become moments; the link only ever runs moment -> collection.

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  created_by  uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  cover_url   text,
  starts_on   date,
  ends_on     date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint collections_date_range_chk check (
    starts_on is null or ends_on is null or starts_on <= ends_on
  )
);

create table if not exists public.collection_items (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_by    uuid not null references auth.users(id) on delete cascade,
  moment_id     uuid references public.moments(id) on delete cascade,
  photo_url     text,
  caption       text,
  position      double precision not null default 0,
  created_at    timestamptz not null default now(),
  constraint collection_items_link_xor_photo_chk check (
    (moment_id is not null and photo_url is null)
    or (moment_id is null and photo_url is not null)
  )
);

-- A given moment can only appear once in a given collection (it may still
-- belong to many different collections).
create unique index if not exists collection_items_unique_moment_per_collection
  on public.collection_items (collection_id, moment_id)
  where moment_id is not null;

create index if not exists collection_items_collection_idx on public.collection_items (collection_id, position);
create index if not exists collections_calendar_idx on public.collections (calendar_id, updated_at desc);

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;
grant all on public.collections to service_role;
grant all on public.collection_items to service_role;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- Collections: any member of the space can read and manage them (same
-- collaborative model as lists/list_items).
create policy "collections_select_member" on public.collections for select to authenticated
  using (public.is_calendar_member(calendar_id, auth.uid()));
create policy "collections_insert_member" on public.collections for insert to authenticated
  with check (created_by = auth.uid() and public.is_calendar_member(calendar_id, auth.uid()));
create policy "collections_update_member" on public.collections for update to authenticated
  using (public.is_calendar_member(calendar_id, auth.uid()));
create policy "collections_delete_member" on public.collections for delete to authenticated
  using (public.is_calendar_member(calendar_id, auth.uid()));

-- Items: membership is inherited from the parent collection's calendar.
create policy "collection_items_select_member" on public.collection_items for select to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_id and public.is_calendar_member(c.calendar_id, auth.uid())
  ));
create policy "collection_items_insert_member" on public.collection_items for insert to authenticated
  with check (created_by = auth.uid() and exists (
    select 1 from public.collections c
    where c.id = collection_id and public.is_calendar_member(c.calendar_id, auth.uid())
  ));
create policy "collection_items_update_member" on public.collection_items for update to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_id and public.is_calendar_member(c.calendar_id, auth.uid())
  ));
create policy "collection_items_delete_member" on public.collection_items for delete to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_id and public.is_calendar_member(c.calendar_id, auth.uid())
  ));

create trigger set_updated_at_collections
  before update on public.collections
  for each row execute function public.tg_set_updated_at();
