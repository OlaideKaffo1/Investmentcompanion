-- Investing Companion: first database table.
--
-- Run this once in Supabase → SQL Editor. Later steps (watchlist, holdings,
-- snapshots…) add their own numbered files next to this one.
--
-- Every table follows the same privacy rule: row level security is on, and a
-- row can only be read or changed by the signed-in user who owns it.

create table if not exists public.user_settings (
  user_id     uuid primary key default auth.uid()
              references auth.users (id) on delete cascade,
  timezone    text not null default 'Africa/Lagos',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Owner can read their settings"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owner can create their settings"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owner can update their settings"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Keep updated_at current. Later tables reuse this function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();
