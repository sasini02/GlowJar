-- Weekly cheer-ups: once a week, at a random moment inside the user's waking
-- hours, send back one of their own wins older than 14 days. The same win is
-- never sent to the same person twice within 6 months (enforced via reminder_log).
--
-- Selection happens in the database so the rules live in one place and can be
-- tested with pgTAP. The send-cheerups Edge Function only delivers the pushes.

alter table public.profiles add column next_cheerup_at timestamptz;

create index profiles_next_cheerup_idx on public.profiles (next_cheerup_at)
  where cheerups_enabled and next_cheerup_at is not null;

-- Quiet hours may wrap past midnight (22:00-08:00) or not (01:00-06:00).
-- Equal start and end means no quiet hours at all.
create function private.in_quiet_hours(t time, quiet_start time, quiet_end time)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when quiet_start = quiet_end then false
    when quiet_start < quiet_end then t >= quiet_start and t < quiet_end
    else t >= quiet_start or t < quiet_end
  end;
$$;

-- A random moment between min_days and min_days + 6 days from `from_ts`,
-- outside the user's quiet hours in their own timezone.
create function private.next_cheerup_slot(
  tz text,
  quiet_start time,
  quiet_end time,
  from_ts timestamptz,
  min_days int
)
returns timestamptz
language plpgsql
volatile
set search_path = ''
as $$
declare
  candidate timestamptz;
begin
  for attempt in 1..50 loop
    candidate := from_ts + make_interval(days => min_days) + random() * interval '6 days';
    if not private.in_quiet_hours((candidate at time zone tz)::time, quiet_start, quiet_end) then
      return candidate;
    end if;
  end loop;

  -- Practically unreachable unless quiet hours cover almost the whole day: fall back to local noon.
  return (((from_ts + make_interval(days => min_days)) at time zone tz)::date + time '12:00') at time zone tz;
end;
$$;

create function private.schedule_cheerups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.cheerups_enabled then
    new.next_cheerup_at := null;
  elsif tg_op = 'INSERT'
     or not old.cheerups_enabled
     or new.next_cheerup_at is null
     or new.timezone is distinct from old.timezone
     or new.quiet_start is distinct from old.quiet_start
     or new.quiet_end is distinct from old.quiet_end then
    -- The first cheer-up after turning them on comes within the first week.
    new.next_cheerup_at := private.next_cheerup_slot(new.timezone, new.quiet_start, new.quiet_end, now(), 1);
  end if;
  return new;
end;
$$;

create trigger profiles_schedule_cheerups
  before insert or update of cheerups_enabled, timezone, quiet_start, quiet_end on public.profiles
  for each row execute function private.schedule_cheerups();

-- Existing opted-in profiles (seed data) get a slot too.
update public.profiles
set next_cheerup_at = private.next_cheerup_slot(timezone, quiet_start, quiet_end, now(), 1)
where cheerups_enabled;

-- The reminder selection rule: a random win of theirs older than 14 days that
-- hasn't been sent to them in the last 6 months. Null when nothing qualifies.
create function private.pick_cheerup_win(target_user uuid)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select w.id
  from public.wins w
  where w.user_id = target_user
    and w.created_at <= now() - interval '14 days'
    and not exists (
      select 1
      from public.reminder_log r
      where r.user_id = target_user
        and r.win_id = w.id
        and r.sent_at > now() - interval '6 months'
    )
  order by random()
  limit 1;
$$;

-- Called hourly by the send-cheerups Edge Function (service role only).
-- Claims every user whose slot has arrived, logs what will be sent, and books
-- their next slot, all in one transaction, so a win is never picked twice.
create function public.claim_due_cheerups(max_users int default 500)
returns table (
  user_id uuid,
  kind text,
  win_id uuid,
  win_text text,
  win_emoji text,
  subscriptions jsonb
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  due record;
  subs jsonb;
  picked uuid;
begin
  for due in
    select p.user_id, p.timezone, p.quiet_start, p.quiet_end
    from public.profiles p
    where p.cheerups_enabled
      and p.next_cheerup_at <= now()
    order by p.next_cheerup_at
    limit max_users
    for update skip locked
  loop
    update public.profiles p
    set next_cheerup_at = private.next_cheerup_slot(due.timezone, due.quiet_start, due.quiet_end, now(), 4)
    where p.user_id = due.user_id;

    select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
    into subs
    from public.push_subscriptions s
    where s.user_id = due.user_id;

    -- No device to send to: keep the schedule rolling but don't spend a win.
    continue when subs is null;

    picked := private.pick_cheerup_win(due.user_id);

    if picked is not null then
      insert into public.reminder_log (user_id, win_id) values (due.user_id, picked);

      return query
        select due.user_id, 'win'::text, w.id, w.text, w.emoji, subs
        from public.wins w
        where w.id = picked;

    -- Someone with no wins yet gets a gentle nudge, at most once every four weeks.
    -- Someone whose wins are all too new or recently sent is simply skipped this week.
    elsif not exists (select 1 from public.wins w where w.user_id = due.user_id)
      and not exists (
        select 1 from public.reminder_log r
        where r.user_id = due.user_id
          and r.win_id is null
          and r.sent_at > now() - interval '28 days'
      ) then
      insert into public.reminder_log (user_id, win_id) values (due.user_id, null);
      return query select due.user_id, 'nudge'::text, null::uuid, null::text, null::text, subs;
    end if;
  end loop;
end;
$$;

-- Saves this browser's push subscription for the signed-in user. If the same
-- browser was registered under another account, it moves to this one, so a
-- shared device never receives someone else's wins.
create function public.register_push_subscription(sub_endpoint text, sub_p256dh text, sub_auth text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'You need to be signed in' using errcode = '42501';
  end if;
  if sub_endpoint !~ '^https://' then
    raise exception 'Push endpoints must be https URLs' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (me, sub_endpoint, sub_p256dh, sub_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth;
end;
$$;

revoke execute on function private.in_quiet_hours(time, time, time) from public;
revoke execute on function private.next_cheerup_slot(text, time, time, timestamptz, int) from public;
revoke execute on function private.schedule_cheerups() from public;
revoke execute on function private.pick_cheerup_win(uuid) from public;

revoke execute on function public.claim_due_cheerups(int) from public, anon, authenticated;
grant execute on function public.claim_due_cheerups(int) to service_role;

revoke execute on function public.register_push_subscription(text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text) to authenticated;
