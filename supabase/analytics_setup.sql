-- ============================================================
-- yayhop analytics — Supabase setup (run once)
-- ============================================================
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run

-- 1. Events table
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists analytics_type_idx
  on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_created_idx
  on public.analytics_events (created_at desc);

-- 3. Row Level Security — anon can INSERT only; SELECT requires service_role
alter table public.analytics_events enable row level security;

drop policy if exists "analytics_anon_insert" on public.analytics_events;
create policy "analytics_anon_insert"
  on public.analytics_events
  as permissive
  for insert
  to anon
  with check (true);

-- 4. Grants
grant usage on schema public to anon;
grant insert on table public.analytics_events to anon;

-- ============================================================
-- Sanity check (optional)
-- ============================================================
-- After running the above, test an anon insert from your site and then
-- verify with the service_role:
--   select event_type, count(*) from public.analytics_events group by 1;
