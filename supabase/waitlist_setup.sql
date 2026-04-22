-- ============================================================
-- yayhop waitlist — Supabase setup (run once)
-- ============================================================
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run

-- 1. Table
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

-- 2. Helpful index
create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

-- 3. Row Level Security
alter table public.waitlist enable row level security;

-- Drop any stale policies before re-creating (idempotent)
drop policy if exists "anon can insert" on public.waitlist;
drop policy if exists "anon can read count"  on public.waitlist;

-- Allow anyone (anon) to INSERT. No SELECT / UPDATE / DELETE for anon.
create policy "anon can insert"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- 4. Public count function — safe to expose because it returns just a number.
create or replace function public.get_waitlist_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.waitlist;
$$;

grant execute on function public.get_waitlist_count() to anon;

-- ============================================================
-- Sanity check
-- ============================================================
-- Run this after the block above to confirm:
--   select public.get_waitlist_count();
-- It should return 0 (or whatever row count you have).
