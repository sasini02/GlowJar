-- My jar (search and shelf), On this day, monthly recaps, and Realtime for celebrations.

-- Full-text search over a user's own wins -----------------------------------

-- 'english' gives stemming ("walked" finds "walk"). The column is covered by the
-- existing table-level select grant, and RLS still decides which rows come back.
alter table public.wins
  add column search tsvector
  generated always as (to_tsvector('english'::regconfig, text)) stored;

create index wins_search_idx on public.wins using gin (search);

-- Shelf: past months with their light counts --------------------------------

-- Months follow the user's own timezone, and the current month is left out
-- because it's still filling up in the jar.
create function public.jar_shelf()
returns table (month date, lights integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.timezone from public.profiles p where p.user_id = (select auth.uid())
  )
  select date_trunc('month', w.created_at at time zone me.timezone)::date, count(*)::int
  from public.wins w
  cross join me
  where w.user_id = (select auth.uid())
    and date_trunc('month', w.created_at at time zone me.timezone) < date_trunc('month', now() at time zone me.timezone)
  group by 1
  order by 1 desc;
$$;

revoke execute on function public.jar_shelf() from public, anon;
grant execute on function public.jar_shelf() to authenticated;

-- On this day ---------------------------------------------------------------

-- A win written about 6 months, or a whole number of years, before today in the
-- user's timezone. "About" is three days either side, closest first, so the
-- card stays the same all day instead of changing on every refresh.
create function public.on_this_day()
returns table (
  win_id uuid,
  text text,
  emoji text,
  category public.win_category,
  created_at timestamptz,
  months_ago integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.timezone, (now() at time zone p.timezone)::date as today
    from public.profiles p
    where p.user_id = (select auth.uid())
  ),
  anniversaries as (
    select m as months_ago, (me.today - make_interval(months => m))::date as target
    from me, unnest(array[6, 12, 24, 36, 48, 60]) as m
  )
  select w.id, w.text, w.emoji, w.category, w.created_at, a.months_ago
  from public.wins w
  cross join me
  join anniversaries a
    on (w.created_at at time zone me.timezone)::date between a.target - 3 and a.target + 3
  where w.user_id = (select auth.uid())
  order by abs((w.created_at at time zone me.timezone)::date - a.target), a.months_ago desc, w.created_at desc
  limit 1;
$$;

revoke execute on function public.on_this_day() from public, anon;
grant execute on function public.on_this_day() to authenticated;

-- Monthly recaps ------------------------------------------------------------

create table public.monthly_recaps (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  -- First day of the recapped month, in the user's timezone.
  month date not null,
  total integer not null,
  by_category jsonb not null,
  -- Null when nothing that month was celebrated, or the win was deleted later.
  top_win_id uuid references public.wins (id) on delete set null,
  top_win_celebrations integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, month),

  constraint month_is_first_day check (month = date_trunc('month', month)::date)
);

alter table public.monthly_recaps enable row level security;

revoke all on public.monthly_recaps from anon, authenticated;
grant select on public.monthly_recaps to authenticated;

create policy "Owners read their own recaps"
  on public.monthly_recaps for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Builds one recap. A month with no wins gets no recap at all: an empty
-- "Your October" would read as a reproach.
create function private.build_recap(target_user uuid, target_month date)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  tz text;
  month_wins uuid[];
  categories jsonb;
  top_id uuid;
  top_count integer;
begin
  select p.timezone into tz from public.profiles p where p.user_id = target_user;
  if tz is null then
    return false;
  end if;

  select array_agg(w.id) into month_wins
  from public.wins w
  where w.user_id = target_user
    and date_trunc('month', w.created_at at time zone tz)::date = target_month;

  if month_wins is null then
    return false;
  end if;

  select jsonb_object_agg(c.category, c.lights) into categories
  from (
    select w.category, count(*) as lights
    from public.wins w
    where w.id = any (month_wins)
    group by w.category
  ) c;

  select w.id, count(c.user_id) into top_id, top_count
  from public.wins w
  join public.celebrations c on c.win_id = w.id
  where w.id = any (month_wins)
  group by w.id, w.created_at
  order by count(c.user_id) desc, w.created_at
  limit 1;

  insert into public.monthly_recaps (user_id, month, total, by_category, top_win_id, top_win_celebrations)
  values (target_user, target_month, cardinality(month_wins), categories, top_id, coalesce(top_count, 0))
  on conflict (user_id, month) do nothing;

  return found;
end;
$$;

revoke execute on function private.build_recap(uuid, date) from public;

-- Runs hourly so each person's recap appears just after midnight on the 1st in
-- their own timezone. Building is idempotent, so a missed run catches up later.
create function private.build_due_recaps()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  built integer := 0;
  person record;
begin
  for person in
    select p.user_id,
           (date_trunc('month', now() at time zone p.timezone) - interval '1 month')::date as last_month
    from public.profiles p
    where not exists (
      select 1 from public.monthly_recaps r
      where r.user_id = p.user_id
        and r.month = (date_trunc('month', now() at time zone p.timezone) - interval '1 month')::date
    )
  loop
    if private.build_recap(person.user_id, person.last_month) then
      built := built + 1;
    end if;
  end loop;
  return built;
end;
$$;

revoke execute on function private.build_due_recaps() from public;

-- Recaps for every finished month that already has wins, so the shelf links work from day one.
do $$
declare
  past record;
begin
  for past in
    select distinct w.user_id, date_trunc('month', w.created_at at time zone p.timezone)::date as month
    from public.wins w
    join public.profiles p on p.user_id = w.user_id
    where date_trunc('month', w.created_at at time zone p.timezone) < date_trunc('month', now() at time zone p.timezone)
  loop
    perform private.build_recap(past.user_id, past.month);
  end loop;
end;
$$;

select cron.schedule('build-recaps', '25 * * * *', $$ select private.build_due_recaps() $$);

-- Realtime: "Someone celebrated your win" -----------------------------------

-- Realtime applies the celebrations RLS policy per subscriber, so authors only
-- receive reactions on their own wins (and their own reactions, which the app ignores).
alter publication supabase_realtime add table public.celebrations;
