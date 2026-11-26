-- Each letter is emailed at most once, and never after its author has already
-- opened it in the app.
--
-- The Edge Functions run as service_role, which has no table privileges here,
-- so deliver-letters could never set delivered_at and re-sent the same letter
-- every hour. Rather than granting service_role broad table rights, the jobs
-- go through these narrow security-definer functions.

alter table public.letters add column opened_at timestamptz;
grant select (opened_at) on public.letters to authenticated;

-- Reading a letter in the app (or in an export) records the first time it was opened.
create or replace function public.open_letter(letter_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  letter record;
begin
  select l.user_id, l.deliver_on, l.body_encrypted into letter
  from public.letters l
  where l.id = open_letter.letter_id;

  if not found or letter.user_id is distinct from (select auth.uid()) then
    raise exception 'Letter not found' using errcode = 'P0002';
  end if;

  if letter.deliver_on > private.local_today(letter.user_id) then
    raise exception 'This letter stays sealed until %', letter.deliver_on using errcode = '42501';
  end if;

  update public.letters l
  set opened_at = now()
  where l.id = open_letter.letter_id
    and l.opened_at is null;

  return extensions.pgp_sym_decrypt(letter.body_encrypted, private.letters_key());
end;
$$;

-- Claiming now marks the letters delivered in the same statement that returns
-- them, so a crash or a failed update after sending can never cause a repeat.
-- Letters the author already opened are marked delivered without an email.
create or replace function public.claim_due_letters(max_letters int default 200)
returns table (
  letter_id uuid,
  user_id uuid,
  email text,
  username text,
  body text,
  deliver_on date,
  written_on date
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.letters l
  set delivered_at = now()
  where l.delivered_at is null
    and l.opened_at is not null;

  return query
  with due as (
    select l.id
    from public.letters l
    where l.delivered_at is null
      and l.deliver_on <= private.local_today(l.user_id)
    order by l.deliver_on
    limit max_letters
    for update skip locked
  ),
  claimed as (
    update public.letters l
    set delivered_at = now()
    from due
    where l.id = due.id
    returning l.id, l.user_id, l.body_encrypted, l.deliver_on, l.created_at
  )
  select
    c.id,
    c.user_id,
    u.email::text,
    p.username,
    extensions.pgp_sym_decrypt(c.body_encrypted, private.letters_key()),
    c.deliver_on,
    (c.created_at at time zone p.timezone)::date
  from claimed c
  join public.profiles p on p.user_id = c.user_id
  join auth.users u on u.id = c.user_id;
end;
$$;

-- Called when the email couldn't be sent, so the next hourly run tries again.
-- An already-opened letter stays delivered: the author has read it.
create function public.release_letter(target_letter uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.letters
  set delivered_at = null
  where id = target_letter
    and opened_at is null;
$$;

revoke execute on function public.release_letter(uuid) from public, anon, authenticated;
grant execute on function public.release_letter(uuid) to service_role;

-- send-cheerups removes subscriptions the push service reports as gone (404/410).
create function public.remove_push_subscriptions(endpoints text[])
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  with removed as (
    delete from public.push_subscriptions
    where endpoint = any (endpoints)
    returning 1
  )
  select count(*)::int from removed;
$$;

revoke execute on function public.remove_push_subscriptions(text[]) from public, anon, authenticated;
grant execute on function public.remove_push_subscriptions(text[]) to service_role;

-- Under the old behaviour, every letter that is due but not marked delivered has
-- already been emailed at least once (usually many times). Mark them delivered
-- so the fix doesn't send one more copy. They stay readable in the app.
update public.letters l
set delivered_at = now()
where l.delivered_at is null
  and l.deliver_on <= private.local_today(l.user_id);
