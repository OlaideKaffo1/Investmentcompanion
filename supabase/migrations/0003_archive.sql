-- Investing Companion: archive instead of delete.
--
-- Run this once in Supabase → SQL Editor, after 0002_watchlist.sql.
--
-- "Stop following" moves a company to the archive and keeps its weekly
-- history. It can be restored later, or deleted for good from the archive.

alter table public.companies add column if not exists archived_at timestamptz;

-- The 20-company cap counts only companies you're following, and also
-- applies when restoring one from the archive.
create or replace function public.enforce_watchlist_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is null
     and (tg_op = 'INSERT' or old.archived_at is not null)
     and (select count(*) from public.companies
          where user_id = new.user_id and archived_at is null and id <> new.id) >= 20
  then
    raise exception 'watchlist_full'
      using hint = 'The watchlist holds up to 20 companies.';
  end if;
  return new;
end;
$$;

drop trigger if exists companies_limit on public.companies;
create trigger companies_limit
  before insert or update of archived_at on public.companies
  for each row execute function public.enforce_watchlist_limit();
