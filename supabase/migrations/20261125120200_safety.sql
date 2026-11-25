-- Safety: a posting rate limit, automatic hiding of heavily reported wins, and
-- the moderator decision function. Text moderation itself runs in the
-- moderate-win Edge Function before a public win is saved.

-- Generous enough for a good day, low enough to stop floods and scripts.
create function private.enforce_win_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.wins w
    where w.user_id = new.user_id
      and w.created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'You''ve added 20 wins in the last day. Your jar will be ready for more tomorrow.'
      using errcode = 'GJ429';
  end if;
  return new;
end;
$$;

create trigger wins_rate_limit
  before insert on public.wins
  for each row execute function private.enforce_win_rate_limit();

-- Three separate reports take a win out of the public feed until a moderator looks.
-- The author keeps it in their own jar as a private win.
create function private.hide_reported_win()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.reports r
    where r.win_id = new.win_id
      and r.status = 'open'
  ) >= 3 then
    update public.wins set is_public = false where id = new.win_id and is_public;
  end if;
  return new;
end;
$$;

create trigger reports_hide_reported_win
  after insert on public.reports
  for each row execute function private.hide_reported_win();

-- Moderators decide on every open report for a win at once.
-- 'removed' takes the win out of the feed (it stays in its author's jar);
-- 'reviewed' leaves it as it is.
create function public.resolve_reports(target_win uuid, decision public.report_status)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_moderator() then
    raise exception 'Only moderators can resolve reports' using errcode = '42501';
  end if;
  if decision = 'open' then
    raise exception 'Pick reviewed or removed' using errcode = '22023';
  end if;

  if decision = 'removed' then
    update public.wins set is_public = false where id = target_win;
  end if;

  update public.reports set status = decision where win_id = target_win and status = 'open';
end;
$$;

-- Moderators need the reported text even after a win has been hidden from the feed.
create function public.open_reports()
returns table (
  win_id uuid,
  win_text text,
  win_emoji text,
  is_public boolean,
  report_count bigint,
  reasons text[],
  first_reported_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_moderator() then
    raise exception 'Only moderators can see reports' using errcode = '42501';
  end if;

  return query
    select w.id, w.text, w.emoji, w.is_public, count(*), array_agg(r.reason order by r.created_at), min(r.created_at)
    from public.reports r
    join public.wins w on w.id = r.win_id
    where r.status = 'open'
    group by w.id
    order by min(r.created_at);
end;
$$;

revoke execute on function private.enforce_win_rate_limit() from public;
revoke execute on function private.hide_reported_win() from public;
revoke execute on function public.resolve_reports(uuid, public.report_status) from public, anon;
revoke execute on function public.open_reports() from public, anon;
grant execute on function public.resolve_reports(uuid, public.report_status) to authenticated;
grant execute on function public.open_reports() to authenticated;
