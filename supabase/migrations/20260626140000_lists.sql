-- Shared lists for a Space: bucket lists, packing, groceries, gift ideas.
-- Everyone in the space can add and check off items (it's collaborative).
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  created_by  uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  kind        text not null default 'list' check (kind in ('list', 'bucket')),
  created_at  timestamptz not null default now()
);

create table if not exists public.list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.lists(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  done       boolean not null default false,
  done_by    uuid references auth.users(id),
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists list_items_list_idx on public.list_items (list_id, position);
create index if not exists lists_calendar_idx on public.lists (calendar_id, created_at);

grant select, insert, update, delete on public.lists to authenticated;
grant select, insert, update, delete on public.list_items to authenticated;
grant all on public.lists to service_role;
grant all on public.list_items to service_role;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- Lists: any member of the space can read and manage them.
create policy "lists_select_member" on public.lists for select to authenticated
  using (public.is_calendar_member(calendar_id, auth.uid()));
create policy "lists_insert_member" on public.lists for insert to authenticated
  with check (created_by = auth.uid() and public.is_calendar_member(calendar_id, auth.uid()));
create policy "lists_update_member" on public.lists for update to authenticated
  using (public.is_calendar_member(calendar_id, auth.uid()));
create policy "lists_delete_member" on public.lists for delete to authenticated
  using (public.is_calendar_member(calendar_id, auth.uid()));

-- Items: membership is inherited from the parent list's calendar.
create policy "list_items_select_member" on public.list_items for select to authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and public.is_calendar_member(l.calendar_id, auth.uid())
  ));
create policy "list_items_insert_member" on public.list_items for insert to authenticated
  with check (created_by = auth.uid() and exists (
    select 1 from public.lists l
    where l.id = list_id and public.is_calendar_member(l.calendar_id, auth.uid())
  ));
create policy "list_items_update_member" on public.list_items for update to authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and public.is_calendar_member(l.calendar_id, auth.uid())
  ));
create policy "list_items_delete_member" on public.list_items for delete to authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and public.is_calendar_member(l.calendar_id, auth.uid())
  ));
