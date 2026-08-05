-- Content storage for the "כאייל תערוג" admin panel.
-- Run once, in the Supabase dashboard under SQL Editor → New query → Run.
--
-- Shape: a single row holding two JSON documents. `draft` is what the panel
-- edits and what preview renders; `published` is what the public site reads.
-- Publishing copies one to the other, which makes "publish" a single atomic
-- write and makes "discard my changes" a single copy in the other direction.

create table if not exists public.site_content (
  id          smallint primary key default 1,
  draft       jsonb not null,
  published   jsonb,
  updated_at  timestamptz not null default now(),
  published_at timestamptz,
  -- Belt and braces: there is exactly one row, forever.
  constraint site_content_singleton check (id = 1)
);

alter table public.site_content enable row level security;

-- Anyone may read the published document. This is a public marketing site;
-- its content is public by definition.
drop policy if exists "published is world readable" on public.site_content;
create policy "published is world readable"
  on public.site_content for select
  to anon, authenticated
  using (true);

-- Only a signed-in user may change anything. The anon key alone cannot write,
-- which is why publishing that key in the site bundle is safe.
drop policy if exists "only signed-in users may write" on public.site_content;
create policy "only signed-in users may write"
  on public.site_content for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "only signed-in users may insert" on public.site_content;
create policy "only signed-in users may insert"
  on public.site_content for insert
  to authenticated
  with check (true);

-- Keep updated_at honest without trusting the client to set it.
create or replace function public.touch_site_content()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_site_content();


-- ── Storage ──────────────────────────────────────────────────────────────
-- One public bucket serving two purposes:
--   content.json  — the published document, fetched by the site on load
--   uploads/*     — photographs added through the panel
-- Public read, signed-in write. Same reasoning as the table above.

insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do update set public = true;

drop policy if exists "site bucket is world readable" on storage.objects;
create policy "site bucket is world readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site');

drop policy if exists "signed-in users may upload" on storage.objects;
create policy "signed-in users may upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site');

drop policy if exists "signed-in users may replace" on storage.objects;
create policy "signed-in users may replace"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site')
  with check (bucket_id = 'site');

drop policy if exists "signed-in users may delete" on storage.objects;
create policy "signed-in users may delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site');
