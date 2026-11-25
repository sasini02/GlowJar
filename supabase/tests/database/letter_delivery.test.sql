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

-- Kiritimati (UTC+14) is always a day or two ahead of Pago Pago (UTC-11).
update public.profiles set timezone = 'Pacific/Kiritimati' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.profiles set timezone = 'Pacific/Pago_Pago' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

create temporary table sealed (owner text, id uuid) on commit drop;
grant all on sealed to authenticated;

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
insert into sealed select 'alice-due', public.seal_letter('Alice, it arrived.', current_date + 30);
insert into sealed select 'alice-future', public.seal_letter('Not yet.', current_date + 60);
insert into sealed select 'alice-delivered', public.seal_letter('Already sent.', current_date + 90);
reset role;

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;
insert into sealed select 'bob-tomorrow-for-him', public.seal_letter('Bob, patience.', current_date + 30);
reset role;

-- Alice's letter is due today in Kiritimati. Bob's has the same date, which hasn't arrived yet in Pago Pago.
update public.letters set deliver_on = (now() at time zone 'Pacific/Kiritimati')::date
  where id in (select id from sealed where owner in ('alice-due', 'bob-tomorrow-for-him'));
update public.letters set deliver_on = current_date - 1, delivered_at = now() - interval '1 day'
  where id = (select id from sealed where owner = 'alice-delivered');

-- Filtered to this test's users so letters already in the project don't affect the result.
create temporary table due on commit drop as
  select * from public.claim_due_letters()
  where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

select is(
  (select array_agg(letter_id) from due),
  (select array_agg(id) from sealed where owner = 'alice-due'),
  'only undelivered letters whose date has arrived in the author''s timezone are due'
);

select is(
  (select body from due),
  'Alice, it arrived.',
  'the due letter comes back decrypted for the email'
);

select is(
  (select email from due),
  'alice@test.local',
  'the due letter includes the author''s private email for delivery'
);

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select throws_ok(
  $$ select * from public.claim_due_letters() $$,
  '42501', null,
  'app users cannot call the delivery function, so emails stay private'
);

select throws_ok(
  format('select public.open_letter(%L)', (select id from sealed where owner = 'alice-future')),
  '42501', null,
  'a future letter stays sealed for its author'
);

select is(
  public.open_letter((select id from sealed where owner = 'alice-due')),
  'Alice, it arrived.',
  'a due letter unlocks for its author in the app, even before the email is sent'
);

reset role;

select * from finish();
rollback;
