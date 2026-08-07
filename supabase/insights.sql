-- Version history, visitor analytics and unfinished enquiries.
-- Run once, in the Supabase dashboard under SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent.


-- ── Version history ──────────────────────────────────────────────────────
-- Every publish, every restore, and a periodic snapshot of the draft land
-- here. Autosave protects against losing work; this protects against the work
-- itself being wrong, which is the failure autosave cannot help with.

create table if not exists public.content_versions (
  id         bigint generated always as identity primary key,
  content    jsonb not null,
  kind       text not null check (kind in ('autosave', 'publish', 'restore')),
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists content_versions_created_at_idx
  on public.content_versions (created_at desc);

alter table public.content_versions enable row level security;

-- History is the site's edit log. Visitors have no business reading it, so
-- unlike site_content there is no anon policy here at all.
drop policy if exists "history is for signed-in users" on public.content_versions;
create policy "history is for signed-in users"
  on public.content_versions for all
  to authenticated
  using (true)
  with check (true);


-- ── Visitor events ───────────────────────────────────────────────────────
-- First-party analytics. No third-party script, no cookie, no cross-site
-- identifier: `visitor` is a random string this browser generated for itself
-- and `session` is a random string per tab. Neither identifies a person, and
-- clearing site data ends both.

create table if not exists public.events (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  visitor  text not null check (length(visitor) between 8 and 40),
  session  text not null check (length(session) between 8 and 40),
  type     text not null check (type in (
             'view', 'section', 'scroll', 'cta', 'whatsapp', 'phone',
             'waze', 'maps', 'download', 'gallery', 'form_start',
             'form_submit', 'form_abandon', 'leave'
           )),
  label    text check (length(label) <= 120),
  value    integer,
  device   text check (device in ('mobile', 'tablet', 'desktop')),
  referrer text check (length(referrer) <= 200),
  -- Kept deliberately small: this table is writable by anyone who can load
  -- the site, so there is a ceiling on what one row can cost.
  meta     jsonb not null default '{}'::jsonb
             check (pg_column_size(meta) < 2000)
);

create index if not exists events_at_idx on public.events (at desc);
create index if not exists events_visitor_idx on public.events (visitor, at desc);
create index if not exists events_type_idx on public.events (type, at desc);

alter table public.events enable row level security;

-- Visitors write, and that is all they do. They cannot read what anyone else
-- recorded, cannot change a row, and cannot delete one.
drop policy if exists "anyone may record an event" on public.events;
create policy "anyone may record an event"
  on public.events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "only the owner reads events" on public.events;
create policy "only the owner reads events"
  on public.events for select
  to authenticated
  using (true);

drop policy if exists "only the owner clears events" on public.events;
create policy "only the owner clears events"
  on public.events for delete
  to authenticated
  using (true);


-- ── Unfinished enquiries ─────────────────────────────────────────────────
-- Someone filled in the enquiry form and left without sending it. The form
-- says on screen that this is recorded — capturing contact details a person
-- deliberately chose not to send would otherwise be both a dark pattern and a
-- problem under חוק הגנת הפרטיות.
--
-- `sent` marks the ones that did go through, so the panel can show the two
-- side by side and the abandonment rate means something.

create table if not exists public.lead_intents (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  visitor    text not null check (length(visitor) between 8 and 40),
  sent       boolean not null default false,
  -- How much of the form they got through, so an abandoned enquiry with a
  -- name and a date is visibly worth chasing and an empty one is not.
  filled     integer not null default 0,
  name       text check (length(name) <= 80),
  phone      text check (length(phone) <= 40),
  date_greg  text check (length(date_greg) <= 20),
  date_heb   text check (length(date_heb) <= 60),
  guests     text check (length(guests) <= 20),
  kind       text check (length(kind) <= 60),
  notes      text check (length(notes) <= 500),
  device     text check (device in ('mobile', 'tablet', 'desktop'))
);

create index if not exists lead_intents_at_idx on public.lead_intents (at desc);
create unique index if not exists lead_intents_visitor_idx on public.lead_intents (visitor);

alter table public.lead_intents enable row level security;

-- Same shape as events: the site writes, only the owner reads. The upsert on
-- `visitor` means one person filling the form over three visits is one row,
-- not three, and the latest state wins.
drop policy if exists "anyone may record an enquiry" on public.lead_intents;
create policy "anyone may record an enquiry"
  on public.lead_intents for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone may update their own enquiry" on public.lead_intents;
create policy "anyone may update their own enquiry"
  on public.lead_intents for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "only the owner reads enquiries" on public.lead_intents;
create policy "only the owner reads enquiries"
  on public.lead_intents for select
  to authenticated
  using (true);

drop policy if exists "only the owner clears enquiries" on public.lead_intents;
create policy "only the owner clears enquiries"
  on public.lead_intents for delete
  to authenticated
  using (true);


-- ── Aggregation ──────────────────────────────────────────────────────────
-- The panel asks one question and gets one answer. Pulling raw rows to the
-- browser and counting them there would move megabytes over a phone
-- connection to compute a number Postgres already has.

create or replace function public.site_insights(days integer default 30)
returns jsonb
language sql
stable
as $$
  with span as (
    select now() - make_interval(days => greatest(days, 1)) as since
  ),
  scoped as (
    select e.* from public.events e, span where e.at >= span.since
  )
  select jsonb_build_object(
    'days', greatest(days, 1),

    'visits', (select count(*) from scoped where type = 'view'),
    'visitors', (select count(distinct visitor) from scoped),
    'sessions', (select count(distinct session) from scoped),

    -- Returning visitors are the strongest signal a marketing site gives:
    -- someone who came back is someone who is still considering it.
    'returning', (
      select count(*) from (
        select visitor from scoped where type = 'view'
        group by visitor having count(distinct session) > 1
      ) r
    ),

    'by_hour', coalesce((
      select jsonb_object_agg(h::text, c) from (
        select extract(hour from at at time zone 'Asia/Jerusalem')::int as h,
               count(*) as c
        from scoped where type = 'view' group by 1
      ) x
    ), '{}'::jsonb),

    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'visits', c, 'visitors', v)
                       order by d)
      from (
        select (at at time zone 'Asia/Jerusalem')::date as d,
               count(*) filter (where type = 'view') as c,
               count(distinct visitor) as v
        from scoped group by 1
      ) x
    ), '[]'::jsonb),

    'by_device', coalesce((
      select jsonb_object_agg(coalesce(device, 'unknown'), c) from (
        select device, count(distinct visitor) as c
        from scoped where type = 'view' group by 1
      ) x
    ), '{}'::jsonb),

    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('source', r, 'visits', c) order by c desc)
      from (
        select coalesce(nullif(referrer, ''), 'ישיר') as r, count(*) as c
        from scoped where type = 'view' group by 1 order by c desc limit 8
      ) x
    ), '[]'::jsonb),

    -- How far down the page people actually get. The section a visitor never
    -- reaches cannot persuade them of anything.
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('label', l, 'visitors', c) order by c desc)
      from (
        select label as l, count(distinct visitor) as c
        from scoped where type = 'section' and label is not null
        group by 1 order by c desc limit 20
      ) x
    ), '[]'::jsonb),

    'scroll_depth', coalesce((
      select round(avg(value)) from scoped where type = 'scroll' and value is not null
    ), 0),

    'clicks', coalesce((
      select jsonb_object_agg(type, c) from (
        select type, count(*) as c from scoped
        where type in ('cta', 'whatsapp', 'phone', 'waze', 'maps', 'download', 'gallery')
        group by 1
      ) x
    ), '{}'::jsonb),

    'form', jsonb_build_object(
      'started',  (select count(distinct visitor) from scoped where type = 'form_start'),
      'sent',     (select count(distinct visitor) from scoped where type = 'form_submit'),
      'abandoned',(select count(distinct visitor) from scoped where type = 'form_abandon')
    )
  );
$$;

revoke all on function public.site_insights(integer) from public, anon;
grant execute on function public.site_insights(integer) to authenticated;


-- ── Housekeeping ─────────────────────────────────────────────────────────
-- Analytics rows are worth keeping for a season, not forever, and the free
-- tier has a size limit. Trimming on write keeps the table bounded without a
-- scheduler, and only fires on a fraction of inserts so it costs nothing.

create or replace function public.trim_events()
returns trigger
language plpgsql
as $$
begin
  if random() < 0.01 then
    delete from public.events where at < now() - interval '400 days';
    delete from public.content_versions
      where kind = 'autosave' and created_at < now() - interval '120 days';
  end if;
  return null;
end;
$$;

drop trigger if exists events_trim on public.events;
create trigger events_trim
  after insert on public.events
  for each statement execute function public.trim_events();


-- ── Recording an enquiry ─────────────────────────────────────────────────
-- Added after testing: PostgREST's upsert compiles to ON CONFLICT DO UPDATE,
-- which must read the conflicting row first — so it needs a SELECT policy.
-- Granting visitors SELECT on this table would hand every visitor everyone
-- else's name and phone number. A definer-owned function does the write
-- instead, so the site can keep one row per visitor while reading nothing.

create or replace function public.record_lead(
  p_visitor   text,
  p_filled    integer,
  p_sent      boolean,
  p_device    text    default null,
  p_name      text    default null,
  p_phone     text    default null,
  p_date_greg text    default null,
  p_date_heb  text    default null,
  p_guests    text    default null,
  p_kind      text    default null,
  p_notes     text    default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(p_visitor) not between 8 and 40 then
    raise exception 'bad visitor';
  end if;

  insert into public.lead_intents as l
    (visitor, filled, sent, device, name, phone, date_greg, date_heb, guests, kind, notes)
  values
    (p_visitor, greatest(coalesce(p_filled, 0), 0), coalesce(p_sent, false), p_device,
     left(p_name, 80), left(p_phone, 40), left(p_date_greg, 20), left(p_date_heb, 60),
     left(p_guests, 20), left(p_kind, 60), left(p_notes, 500))
  on conflict (visitor) do update set
    at        = now(),
    -- Never downgrade a sent enquiry back to abandoned: the same person
    -- returning and half-filling the form again does not un-send the first.
    sent      = l.sent or excluded.sent,
    filled    = greatest(l.filled, excluded.filled),
    device    = coalesce(excluded.device, l.device),
    name      = coalesce(excluded.name, l.name),
    phone     = coalesce(excluded.phone, l.phone),
    date_greg = coalesce(excluded.date_greg, l.date_greg),
    date_heb  = coalesce(excluded.date_heb, l.date_heb),
    guests    = coalesce(excluded.guests, l.guests),
    kind      = coalesce(excluded.kind, l.kind),
    notes     = coalesce(excluded.notes, l.notes);
end;
$$;

grant execute on function public.record_lead(text, integer, boolean, text, text, text, text, text, text, text, text) to anon, authenticated;

-- The table itself no longer needs to be writable directly, so it is not.
drop policy if exists "anyone may record an enquiry" on public.lead_intents;
drop policy if exists "anyone may update their own enquiry" on public.lead_intents;
