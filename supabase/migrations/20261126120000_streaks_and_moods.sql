-- Home dashboard: the daily glow streak, streak milestones, private mood
-- check-ins and a gentle daily reminder.

-- Profiles -----------------------------------------------------------------

alter table public.profiles
  add column best_streak integer not null default 0,
  add column jar_style text not null default 'classic',
  add column glow_reminders_enabled boolean not null default true,
  -- The local date of the last daily reminder, so nobody gets two in one day.
  add column last_glow_reminder_on date,
  add constraint best_streak_not_negative check (best_streak >= 0),
  add constraint jar_style_known check (
    jar_style in ('classic', 'ember', 'moonlit', 'firefly', 'aurora', 'starlit', 'lantern')
  );

-- best_streak and jar_style only ever describe the user's own jar, so the app
-- updates them with the user's session. last_glow_reminder_on stays job-only.
grant update (best_streak, jar_style, glow_reminders_enabled) on public.profiles to authenticated;

-- Local date of each win ---------------------------------------------------

-- A win lights the day it was written on in the author's own timezone. It is
-- fixed at insert time, so moving timezone later never moves old lights.
alter table public.wins add column local_date date;

create function private.set_win_local_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.local_date := (new.created_at at time zone coalesce(
    (select p.timezone from public.profiles p where p.user_id = new.user_id),
    'UTC'
  ))::date;
  return new;
end;
$$;

revoke execute on function private.set_win_local_date() from public;

create trigger wins_set_local_date
  before insert on public.wins
  for each row execute function private.set_win_local_date();

update public.wins w
set local_date = (w.created_at at time zone p.timezone)::date
from public.profiles p
where p.user_id = w.user_id
  and w.local_date is null;

alter table public.wins alter column local_date set not null;

create index wins_user_local_date_idx on public.wins (user_id, local_date);

-- The distinct days on which the signed-in user added at least one win.
create function public.my_lit_dates(since date)
returns setof date
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct w.local_date
  from public.wins w
  where w.user_id = (select auth.uid())
    and w.local_date >= since
  order by 1;
$$;

revoke execute on function public.my_lit_dates(date) from public, anon;
grant execute on function public.my_lit_dates(date) to authenticated;

-- How many lights everyone has added since midnight in the viewer's timezone.
-- Only a total comes back, so private wins are counted but never revealed.
create function public.lights_today()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select coalesce((select p.timezone from public.profiles p where p.user_id = (select auth.uid())), 'UTC') as tz
  )
  select count(*)::int
  from public.wins w, me
  where w.created_at >= (date_trunc('day', now() at time zone me.tz) at time zone me.tz);
$$;

revoke execute on function public.lights_today() from public, anon;
grant execute on function public.lights_today() to authenticated;

-- Streak milestones ----------------------------------------------------------

-- One row per milestone a user has reached, so each celebration shows once.
create table public.streak_milestones (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  days integer not null,
  reached_on date not null,
  seen boolean not null default false,
  primary key (user_id, days),

  constraint days_is_milestone check (days in (3, 7, 14, 30, 50, 100))
);

alter table public.streak_milestones enable row level security;

revoke all on public.streak_milestones from anon, authenticated;
grant select on public.streak_milestones to authenticated;
grant insert (user_id, days, reached_on) on public.streak_milestones to authenticated;
grant update (seen) on public.streak_milestones to authenticated;

create policy "Owners read their own milestones"
  on public.streak_milestones for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners record their own milestones"
  on public.streak_milestones for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Owners mark their own milestones seen"
  on public.streak_milestones for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Moods ----------------------------------------------------------------------

-- Moods are private to their owner. They are never joined into feed queries
-- and there is deliberately no function that aggregates them across users.
create table public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  local_date date not null,
  level smallint not null,
  tags text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint one_mood_per_day unique (user_id, local_date),
  constraint level_on_scale check (level between 0 and 6),
  constraint tags_known check (
    tags <@ array['Sleep', 'Work', 'Friends', 'Family', 'Health', 'Weather', 'Me time']::text[]
  ),
  constraint note_length check (char_length(note) <= 280)
);

create trigger moods_set_updated_at
  before update on public.moods
  for each row execute function private.set_updated_at();

alter table public.moods enable row level security;

revoke all on public.moods from anon, authenticated;
grant select, delete on public.moods to authenticated;
grant insert (user_id, local_date, level, tags, note) on public.moods to authenticated;
grant update (level, tags, note) on public.moods to authenticated;

create policy "Owners read their own moods"
  on public.moods for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners add their own moods"
  on public.moods for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Owners update their own moods"
  on public.moods for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners delete their own moods"
  on public.moods for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Saves today's mood (today in the user's own timezone), or updates it if one
-- is already there. Leaving mood_tags null keeps the tags already saved, so a
-- one-tap pick on Home doesn't wipe the details added on the check-in screen.
create function public.save_mood(mood_level integer, mood_tags text[] default null)
returns public.moods
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  today date;
  saved public.moods;
begin
  if me is null then
    raise exception 'You need to be signed in' using errcode = '42501';
  end if;

  select (now() at time zone p.timezone)::date into today
  from public.profiles p
  where p.user_id = me;

  insert into public.moods as m (user_id, local_date, level, tags)
  values (me, today, mood_level, coalesce(mood_tags, '{}'))
  on conflict (user_id, local_date) do update
    set level = excluded.level,
        tags = coalesce(mood_tags, m.tags)
  returning * into saved;

  return saved;
end;
$$;

revoke execute on function public.save_mood(integer, text[]) from public, anon;
grant execute on function public.save_mood(integer, text[]) to authenticated;

-- On this day: add "about three months ago" -----------------------------------

create or replace function public.on_this_day()
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
    from me, unnest(array[3, 6, 12, 24, 36, 48, 60]) as m
  )
  select w.id, w.text, w.emoji, w.category, w.created_at, a.months_ago
  from public.wins w
  cross join me
  join anniversaries a
    on w.local_date between a.target - 3 and a.target + 3
  where w.user_id = (select auth.uid())
  order by abs(w.local_date - a.target), a.months_ago desc, w.created_at desc
  limit 1;
$$;

-- Daily glow reminder ----------------------------------------------------------

-- The daily nudge time each profile picked at set-up. Keep in step with
-- NUDGE_OPTIONS in src/lib/nudge.ts.
create function private.nudge_slot(slot public.nudge_time)
returns time
language sql
immutable
set search_path = ''
as $$
  select case slot
    when 'morning' then time '08:00'
    when 'lunch' then time '12:30'
    when 'evening' then time '19:30'
    when 'night' then time '21:30'
  end;
$$;

revoke execute on function private.nudge_slot(public.nudge_time) from public;

-- Called hourly by the send-glow-reminders Edge Function (service role only).
-- Picks people whose nudge time has just passed and whose day isn't lit yet,
-- and records today's reminder in the same statement, so it's at most one a day.
-- Never between 22:00 and 08:00 local time, and never inside their quiet hours.
create function public.claim_due_glow_reminders(max_users int default 1000)
returns table (user_id uuid, subscriptions jsonb)
language sql
volatile
security definer
set search_path = ''
as $$
  with candidates as (
    select p.user_id,
           (now() at time zone p.timezone)::date as local_date,
           (now() at time zone p.timezone)::time as local_time,
           private.nudge_slot(p.nudge_time) as slot,
           p.quiet_start,
           p.quiet_end
    from public.profiles p
    where p.glow_reminders_enabled
      and p.onboarded_at is not null
      and p.last_glow_reminder_on is distinct from (now() at time zone p.timezone)::date
  ),
  due as (
    select c.user_id, c.local_date
    from candidates c
    where c.local_time >= c.slot
      -- A run that was missed catches up for two hours, then lets the day go.
      and c.local_time < least(c.slot + interval '2 hours', time '22:00')
      and c.local_time >= time '08:00'
      and not private.in_quiet_hours(c.local_time, c.quiet_start, c.quiet_end)
      and not exists (
        select 1 from public.wins w
        where w.user_id = c.user_id and w.local_date = c.local_date
      )
      and exists (select 1 from public.push_subscriptions s where s.user_id = c.user_id)
    limit max_users
  ),
  claimed as (
    update public.profiles p
    set last_glow_reminder_on = due.local_date
    from due
    where p.user_id = due.user_id
    returning p.user_id
  )
  select claimed.user_id,
         (select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
          from public.push_subscriptions s
          where s.user_id = claimed.user_id)
  from claimed;
$$;

revoke execute on function public.claim_due_glow_reminders(int) from public, anon, authenticated;
grant execute on function public.claim_due_glow_reminders(int) to service_role;

select cron.schedule('send-glow-reminders', '35 * * * *', $$ select private.invoke_edge_function('send-glow-reminders') $$);
