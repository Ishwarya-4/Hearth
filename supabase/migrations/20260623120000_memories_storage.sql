-- Storage for shared photo memories.
-- Public bucket with unguessable UUID paths; writes restricted to authenticated
-- members, deletes to the uploader. (Hardening note: switch to a private bucket +
-- signed URLs if photo privacy needs to be enforced at the storage layer.)
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

create policy "memories_read_public" on storage.objects for select
  using (bucket_id = 'memories');

create policy "memories_insert_auth" on storage.objects for insert to authenticated
  with check (bucket_id = 'memories');

create policy "memories_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'memories' and owner = auth.uid());
