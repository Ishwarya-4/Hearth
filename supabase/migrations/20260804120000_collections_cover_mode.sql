-- How a collection's cover should render: a chosen static photo, an
-- auto-cycling slideshow of the collection's own photos, or no cover at all.
alter table public.collections
  add column if not exists cover_mode text not null default 'static'
  check (cover_mode in ('static', 'slideshow', 'none'));
