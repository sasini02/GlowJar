begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'letters_encryption_key') then
    perform vault.create_secret('test-letters-key', 'letters_encryption_key');
  end if;
end;
$$;

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local');

create temporary table sealed (id uuid) on commit drop;
grant all on sealed to authenticated;

-- As Alice
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

insert into sealed select public.seal_letter('Dear future me, keep going.', current_date + 30);

select isnt_empty($$ select 1 from public.letters $$, 'the author sees their sealed letter''s metadata');

select throws_ok(
  $$ select body_encrypted from public.letters $$,
  '42501', null,
  'the encrypted body is not selectable'
);

select throws_ok(
  format('select public.open_letter(%L)', (select id from sealed)),
  '42501', null,
  'the author cannot open a letter before deliver_on'
);

select throws_ok(
  $$ select public.seal_letter('Too late', current_date) $$,
  '22023', null,
  'a letter must be delivered in the future'
);

select throws_ok(
  $$ insert into public.letters (user_id, body_encrypted, deliver_on) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'x', current_date - 1) $$,
  '42501', null,
  'letters cannot be inserted directly, bypassing encryption and the date check'
);

reset role;

select is(
  (select position(convert_to('Dear future me', 'UTF8') in body_encrypted) from public.letters where id = (select id from sealed)),
  0,
  'the body is stored encrypted'
);

-- The delivery date arrives.
update public.letters set deliver_on = current_date where id = (select id from sealed);

set local role authenticated;

select is(
  public.open_letter((select id from sealed)),
  'Dear future me, keep going.',
  'the author can open the letter on deliver_on'
);

-- Kiritimati (UTC+14) is always one or two calendar days ahead of Pago Pago (UTC-11).
update public.profiles set timezone = 'Pacific/Kiritimati' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

reset role;
update public.letters set deliver_on = (now() at time zone 'Pacific/Kiritimati')::date where id = (select id from sealed);
set local role authenticated;

select is(
  public.open_letter((select id from sealed)),
  'Dear future me, keep going.',
  'a letter opens on deliver_on in the author''s own timezone'
);

update public.profiles set timezone = 'Pacific/Pago_Pago' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select throws_ok(
  format('select public.open_letter(%L)', (select id from sealed)),
  '42501', null,
  'a letter stays sealed while it is not yet deliver_on where the author lives'
);

select throws_ok(
  $$ select public.seal_letter('Not tomorrow yet', (now() at time zone 'Pacific/Pago_Pago')::date) $$,
  '22023', null,
  'the earliest delivery date is tomorrow in the author''s timezone'
);

-- As Bob
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is_empty($$ select 1 from public.letters $$, 'other users cannot see someone else''s letters');

select throws_ok(
  format('select public.open_letter(%L)', (select id from sealed)),
  'P0002', null,
  'other users cannot open someone else''s letter, even after deliver_on'
);

reset role;

select * from finish();
rollback;
