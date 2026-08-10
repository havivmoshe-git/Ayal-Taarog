-- The guest feedback page and its moderation queue.
-- Run once, in the Supabase dashboard under SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent.

-- Two texts, deliberately separate. `quote` is what the guest is happy to see
-- published; `private_note` is what they would tell the owner privately, and
-- nothing in this system ever puts it on the site. Splitting them at the form
-- is what lets an honest "the hot water ran out on Saturday morning" be sent
-- at all — bundled into one box, it either goes public or goes unsaid.

create table if not exists public.feedback (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  name         text check (length(name) <= 80),
  context      text check (length(context) <= 80),
  rating       integer check (rating between 1 and 5),
  quote        text check (length(quote) <= 1200),
  private_note text check (length(private_note) <= 1200),
  phone        text check (length(phone) <= 40),
  /** Whether the guest agreed to their words appearing on the site. */
  consent      boolean not null default false,
  device       text check (device in ('mobile', 'tablet', 'desktop')),
  /** Set when the owner publishes it, so the queue can show what is already live. */
  published_at timestamptz
);

create index if not exists feedback_status_idx on public.feedback (status, at desc);

alter table public.feedback enable row level security;

-- Guests write through the function below, never directly. Only the owner
-- reads: a visitor must not be able to page through other people's feedback,
-- and half of it is explicitly private.
drop policy if exists "only the owner reads feedback" on public.feedback;
create policy "only the owner reads feedback"
  on public.feedback for select
  to authenticated
  using (true);

drop policy if exists "only the owner moderates feedback" on public.feedback;
create policy "only the owner moderates feedback"
  on public.feedback for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "only the owner deletes feedback" on public.feedback;
create policy "only the owner deletes feedback"
  on public.feedback for delete
  to authenticated
  using (true);


-- ── Submitting ───────────────────────────────────────────────────────────
-- A definer-owned function rather than an insert policy. It keeps the table
-- entirely unreachable from the site's key, and it is the only place that can
-- enforce a shape: a rating in range, texts within length, and something
-- actually said. It also fixes `status` at 'pending', so nothing can arrive
-- pre-approved.

create or replace function public.submit_feedback(
  p_name         text,
  p_rating       integer,
  p_quote        text    default null,
  p_private_note text    default null,
  p_context      text    default null,
  p_phone        text    default null,
  p_consent      boolean default false,
  p_device       text    default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'rating out of range';
  end if;
  if coalesce(trim(p_quote), '') = '' and coalesce(trim(p_private_note), '') = '' then
    raise exception 'nothing said';
  end if;

  -- A crude but effective brake on a form anyone can reach: no more than five
  -- submissions a minute across the whole site. A venue this size will never
  -- notice; a script hammering it will.
  if (select count(*) from public.feedback where at > now() - interval '1 minute') >= 5 then
    raise exception 'too many submissions, please try again shortly';
  end if;

  insert into public.feedback (name, context, rating, quote, private_note, phone, consent, device, status)
  values (
    left(trim(p_name), 80),
    left(nullif(trim(p_context), ''), 80),
    p_rating,
    left(nullif(trim(p_quote), ''), 1200),
    left(nullif(trim(p_private_note), ''), 1200),
    left(nullif(trim(p_phone), ''), 40),
    coalesce(p_consent, false),
    p_device,
    'pending'
  );
end;
$$;

revoke all on function public.submit_feedback(text, integer, text, text, text, text, boolean, text) from public;
grant execute on function public.submit_feedback(text, integer, text, text, text, text, boolean, text) to anon, authenticated;
