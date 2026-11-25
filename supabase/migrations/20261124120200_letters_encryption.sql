-- Letters to future self are encrypted with a key kept in Supabase Vault
-- (secret name: letters_encryption_key). The key never leaves the database and
-- the plaintext body is only returned by open_letter() on or after deliver_on.
-- "Today" always means the author's local date (profiles.timezone), not UTC.

create function private.letters_key()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  secret text;
begin
  select ds.decrypted_secret into secret
  from vault.decrypted_secrets ds
  where ds.name = 'letters_encryption_key';

  if secret is null then
    raise exception 'Vault secret "letters_encryption_key" is missing';
  end if;

  return secret;
end;
$$;

revoke execute on function private.letters_key() from public, anon, authenticated;

create function public.seal_letter(body text, deliver_on date)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  author uuid := (select auth.uid());
  today date;
  letter_id uuid;
begin
  if author is null then
    raise exception 'You need to be signed in to write a letter' using errcode = '42501';
  end if;

  today := private.local_today(author);

  if char_length(btrim(seal_letter.body)) not between 1 and 10000 then
    raise exception 'A letter needs between 1 and 10000 characters' using errcode = '22023';
  end if;

  if seal_letter.deliver_on <= today
     or seal_letter.deliver_on > today + interval '10 years' then
    raise exception 'Pick a delivery date between tomorrow and 10 years from now' using errcode = '22023';
  end if;

  insert into public.letters (user_id, body_encrypted, deliver_on)
  values (
    author,
    extensions.pgp_sym_encrypt(seal_letter.body, private.letters_key()),
    seal_letter.deliver_on
  )
  returning id into letter_id;

  return letter_id;
end;
$$;

-- Product rule: nobody, including the author, can read a letter before deliver_on.
create function public.open_letter(letter_id uuid)
returns text
language plpgsql
stable
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

  return extensions.pgp_sym_decrypt(letter.body_encrypted, private.letters_key());
end;
$$;

revoke execute on function public.seal_letter(text, date) from public, anon;
revoke execute on function public.open_letter(uuid) from public, anon;
grant execute on function public.seal_letter(text, date) to authenticated;
grant execute on function public.open_letter(uuid) to authenticated;
