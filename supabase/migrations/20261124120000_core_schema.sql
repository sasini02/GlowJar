-- Core tables for Glowjar. Row Level Security and grants live in the next migration.

create extension if not exists pgcrypto with schema extensions;

-- Helpers that should never be callable through the Data API live here.
create schema if not exists private;

create type public.nudge_time as enum ('morning', 'lunch', 'evening', 'night');
create type public.theme_preference as enum ('day', 'night', 'auto');
create type public.visibility as enum ('public', 'private');
create type public.win_category as enum ('health', 'work', 'social', 'mind', 'learning', 'self_care');
create type public.celebration_type as enum ('celebrate', 'proud', 'metoo');
create type public.report_status as enum ('open', 'reviewed', 'removed');

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- profiles ---------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  timezone text not null default 'UTC',
  nudge_time public.nudge_time not null default 'evening',
  cheerups_enabled boolean not null default false,
  quiet_start time not null default '22:00',
  quiet_end time not null default '08:00',
  theme public.theme_preference not null default 'auto',
  default_visibility public.visibility not null default 'private',
  is_moderator boolean not null default false,
  created_at timestamptz not null default now(),

  constraint username_length check (char_length(username) between 3 and 32),
  constraint username_trimmed check (username = btrim(username)),
  -- Usernames are public. Rejecting "@" stops people from publishing their email by accident.
  constraint username_no_at check (position('@' in username) = 0)
);

create unique index profiles_username_unique on public.profiles (lower(username));

-- Letters unlock and reminders fire by the user's local date, so a bad
-- timezone name must never reach the table.
create function private.validate_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names tz where tz.name = new.timezone) then
    raise exception 'Unknown timezone "%"', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function private.validate_timezone();

create function private.local_today(target_user uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select p.timezone from public.profiles p where p.user_id = target_user),
    'UTC'
  ))::date;
$$;

create function private.generate_username()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  adjectives text[] := array[
    'Quiet', 'Gentle', 'Brave', 'Calm', 'Bright', 'Soft', 'Kind', 'Steady', 'Warm', 'Golden',
    'Patient', 'Hopeful', 'Sunny', 'Tender', 'Little', 'Wandering', 'Cosy', 'Mellow', 'Curious', 'Merry',
    'Hidden', 'Early', 'Silver', 'Misty', 'Humble', 'Lucky', 'Sleepy', 'Clever', 'Glowing', 'Peaceful'
  ];
  nouns text[] := array[
    'Otter', 'Fern', 'Sparrow', 'Moss', 'Willow', 'Heron', 'Pebble', 'Robin', 'Maple', 'Firefly',
    'Meadow', 'Badger', 'Clover', 'Finch', 'River', 'Acorn', 'Wren', 'Hare', 'Birch', 'Lark',
    'Owl', 'Brook', 'Daisy', 'Fox', 'Cedar', 'Starling', 'Thistle', 'Dormouse', 'Lantern', 'Pine'
  ];
  candidate text;
begin
  for attempt in 1..30 loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || ' ' || nouns[1 + floor(random() * array_length(nouns, 1))::int];

    -- Plain pairs run out once there are a few hundred users; add a number after that.
    if attempt > 10 then
      candidate := candidate || ' ' || (1 + floor(random() * 999))::int;
    end if;

    if not exists (select 1 from public.profiles p where lower(p.username) = lower(candidate)) then
      return candidate;
    end if;
  end loop;

  return candidate || ' ' || substr(md5(random()::text), 1, 6);
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, username)
  values (new.id, private.generate_username());
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Everyone may see a username; nothing else on a profile is public.
-- This view intentionally runs with its owner's rights so it can read past the
-- owner-only RLS on profiles while exposing just these two columns.
create view public.public_profiles
with (security_invoker = false)
as
select user_id, username
from public.profiles;

-- wins -------------------------------------------------------------------

create table public.wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  text text not null,
  emoji text,
  category public.win_category not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint text_length check (char_length(btrim(text)) between 1 and 280),
  -- One emoji can be several code points (skin tones, ZWJ sequences), so allow a little room.
  constraint emoji_length check (emoji is null or char_length(emoji) between 1 and 16)
);

create index wins_public_feed_idx on public.wins (created_at desc) where is_public;
create index wins_public_category_idx on public.wins (category, created_at desc) where is_public;
create index wins_user_created_idx on public.wins (user_id, created_at desc);

create trigger wins_set_updated_at
  before update on public.wins
  for each row execute function private.set_updated_at();

-- The composer opens with whatever visibility the user picked last time.
-- New profiles start at 'private' (Just me) until their first win.
create function private.remember_visibility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen public.visibility := case when new.is_public then 'public' else 'private' end;
begin
  update public.profiles
  set default_visibility = chosen
  where user_id = new.user_id
    and default_visibility is distinct from chosen;
  return new;
end;
$$;

create trigger wins_remember_visibility
  after insert on public.wins
  for each row execute function private.remember_visibility();

-- celebrations -----------------------------------------------------------

create table public.celebrations (
  win_id uuid not null references public.wins (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  type public.celebration_type not null,
  created_at timestamptz not null default now(),
  primary key (win_id, user_id)
);

create index celebrations_user_idx on public.celebrations (user_id);

-- letters ----------------------------------------------------------------

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  body_encrypted bytea not null,
  deliver_on date not null,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index letters_user_idx on public.letters (user_id, deliver_on);
create index letters_due_idx on public.letters (deliver_on) where delivered_at is null;

-- reminder_log -----------------------------------------------------------

create table public.reminder_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  -- Null when the reminder was a "write your first win" nudge rather than a past win.
  win_id uuid references public.wins (id) on delete cascade,
  sent_at timestamptz not null default now()
);

create index reminder_log_user_win_idx on public.reminder_log (user_id, win_id, sent_at desc);
create index reminder_log_user_sent_idx on public.reminder_log (user_id, sent_at desc);

-- push_subscriptions -----------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- reports ----------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  win_id uuid not null references public.wins (id) on delete cascade,
  reporter_id uuid not null references public.profiles (user_id) on delete cascade,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),

  constraint reason_length check (char_length(btrim(reason)) between 1 and 500),
  constraint one_report_per_reporter unique (win_id, reporter_id)
);

create index reports_open_idx on public.reports (created_at) where status = 'open';
