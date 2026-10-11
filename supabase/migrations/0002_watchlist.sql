-- Investing Companion: watchlist, holdings and Sunday snapshots (Phase 1, step 2).
--
-- Run this once in Supabase → SQL Editor, after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Companies: the watchlist. Up to 20 per person, each one either a holding
-- or a company being watched.
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  ticker           text not null check (ticker ~ '^[A-Z0-9.\-]{1,15}$'),
  name             text not null check (char_length(name) between 1 and 120),
  exchange         text not null check (exchange in ('US', 'NGX')),
  currency         text generated always as
                   (case exchange when 'NGX' then 'NGN' else 'USD' end) stored,
  status           text not null default 'watching'
                   check (status in ('holding', 'watching')),

  -- Holding details, all optional. Shares are worked out as
  -- amount_invested / buy_price when both are present.
  amount_invested  numeric(18, 2) check (amount_invested > 0),
  buy_date         date,
  buy_price        numeric(18, 4) check (buy_price > 0),

  -- Latest known price. Typed in by hand for now; the market data provider
  -- (step 3) will keep it up to date and set price_source to its name.
  last_price       numeric(18, 4) check (last_price > 0),
  last_price_at    timestamptz,
  price_source     text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (user_id, exchange, ticker)
);

create index if not exists companies_user_id_idx on public.companies (user_id);

alter table public.companies enable row level security;

create policy "Owner can read their companies"
  on public.companies for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owner can add companies"
  on public.companies for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owner can update their companies"
  on public.companies for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owner can remove their companies"
  on public.companies for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- The spec caps the watchlist at 20 companies to keep running costs modest.
create or replace function public.enforce_watchlist_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.companies where user_id = new.user_id) >= 20 then
    raise exception 'watchlist_full'
      using hint = 'The watchlist holds up to 20 companies.';
  end if;
  return new;
end;
$$;

create trigger companies_limit
  before insert on public.companies
  for each row execute function public.enforce_watchlist_limit();

-- ---------------------------------------------------------------------------
-- Snapshots: one row per company per week, saved every Sunday. week_of is the
-- Sunday (Lagos time) that ends the week. Taking a snapshot again in the same
-- week replaces that week's row, so Sunday's run always has the final word.
-- ---------------------------------------------------------------------------
create table if not exists public.snapshots (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  company_id         uuid not null references public.companies (id) on delete cascade,
  week_of            date not null,
  status             text not null check (status in ('holding', 'watching')),
  currency           text not null,
  price              numeric(18, 4),
  price_at           timestamptz,
  weekly_change_pct  numeric(9, 4),
  shares             numeric(24, 8),
  value              numeric(18, 2),
  amount_invested    numeric(18, 2),
  created_at         timestamptz not null default now(),

  unique (company_id, week_of)
);

create index if not exists snapshots_user_week_idx on public.snapshots (user_id, week_of desc);

alter table public.snapshots enable row level security;

create policy "Owner can read their snapshots"
  on public.snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

-- The "take a snapshot now" button writes as the signed-in owner. The Sunday
-- job uses the server's secret key, which isn't bound by these policies.
create policy "Owner can save their snapshots"
  on public.snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owner can replace their snapshots"
  on public.snapshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
