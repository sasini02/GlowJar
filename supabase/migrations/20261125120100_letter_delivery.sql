-- Letter delivery. The deliver-letters Edge Function calls claim_due_letters()
-- with the service role, emails each letter through Resend, then sets
-- delivered_at. A letter is due once deliver_on has arrived in the author's own
-- timezone, the same rule open_letter() uses to unlock it in the app.

create function public.claim_due_letters(max_letters int default 200)
returns table (
  letter_id uuid,
  user_id uuid,
  email text,
  username text,
  body text,
  deliver_on date,
  written_on date
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.user_id,
    u.email::text,
    p.username,
    extensions.pgp_sym_decrypt(l.body_encrypted, private.letters_key()),
    l.deliver_on,
    (l.created_at at time zone p.timezone)::date
  from public.letters l
  join public.profiles p on p.user_id = l.user_id
  join auth.users u on u.id = l.user_id
  where l.delivered_at is null
    and l.deliver_on <= private.local_today(l.user_id)
  order by l.deliver_on
  limit max_letters;
$$;

-- Emails live only in auth.users, so this function must never be callable by app users.
revoke execute on function public.claim_due_letters(int) from public, anon, authenticated;
grant execute on function public.claim_due_letters(int) to service_role;
