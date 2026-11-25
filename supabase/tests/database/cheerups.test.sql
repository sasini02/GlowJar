begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'carol@test.local'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dave@test.local');

-- Quiet hours -------------------------------------------------------------

select ok(private.in_quiet_hours('23:00', '22:00', '08:00'), 'late evening is inside 22:00-08:00');
select ok(private.in_quiet_hours('07:59', '22:00', '08:00'), 'early morning is inside 22:00-08:00');
select ok(not private.in_quiet_hours('08:00', '22:00', '08:00'), 'quiet hours end at quiet_end');
select ok(not private.in_quiet_hours('12:00', '22:00', '08:00'), 'midday is outside 22:00-08:00');
select ok(private.in_quiet_hours('03:00', '01:00', '06:00'), 'quiet hours that do not wrap midnight work too');
select ok(not private.in_quiet_hours('03:00', '06:00', '06:00'), 'equal start and end means no quiet hours');

-- Weekly slots ------------------------------------------------------------

select ok(
  (select bool_and(not private.in_quiet_hours((slot at time zone 'Asia/Tokyo')::time, '22:00', '08:00'))
   from (select private.next_cheerup_slot('Asia/Tokyo', '22:00', '08:00', now(), 4) as slot
         from generate_series(1, 300)) samples),
  'slots never fall inside the user''s quiet hours, in their own timezone'
);

select ok(
  (select bool_and(slot >= now() + interval '4 days' and slot <= now() + interval '10 days')
   from (select private.next_cheerup_slot('UTC', '22:00', '08:00', now(), 4) as slot
         from generate_series(1, 300)) samples),
  'the next slot is roughly a week away (4 to 10 days)'
);

update public.profiles set cheerups_enabled = true, timezone = 'Europe/London'
  where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select ok(
  (select next_cheerup_at between now() + interval '1 day' and now() + interval '7 days'
   from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'turning cheer-ups on books the first slot within a week'
);

update public.profiles set cheerups_enabled = false where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select next_cheerup_at from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null,
  'turning cheer-ups off clears the slot'
);

update public.profiles set cheerups_enabled = true where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

-- The selection rule --------------------------------------------------------

insert into public.wins (id, user_id, text, category, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Old enough, never sent', 'health', now() - interval '30 days'),
  ('a0000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Sent two months ago', 'work', now() - interval '90 days'),
  ('a0000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Too new', 'mind', now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Sent seven months ago', 'social', now() - interval '300 days');

insert into public.reminder_log (user_id, win_id, sent_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a0000000-0000-4000-8000-000000000002', now() - interval '2 months'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a0000000-0000-4000-8000-000000000004', now() - interval '7 months');

select ok(
  (select bool_and(picked in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004'))
   from (select private.pick_cheerup_win('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') as picked
         from generate_series(1, 50)) samples),
  'only wins older than 14 days and not sent in the last 6 months are picked'
);

select is(
  (select count(distinct picked)::int
   from (select private.pick_cheerup_win('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') as picked
         from generate_series(1, 50)) samples),
  2,
  'a win sent more than 6 months ago becomes eligible again'
);

select is(
  private.pick_cheerup_win('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  null,
  'someone with no wins has nothing to pick'
);

-- Claiming due cheer-ups ----------------------------------------------------

insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'https://push.test/alice', 'key', 'secret'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'https://push.test/bob', 'key', 'secret');

update public.profiles set cheerups_enabled = true
  where user_id in ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');

-- Alice, Bob and Dave (no device) are due. Carol has cheer-ups off.
update public.profiles set next_cheerup_at = now() - interval '1 minute'
  where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
update public.profiles set next_cheerup_at = now() - interval '1 minute'
  where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

create temporary table first_run on commit drop as select * from public.claim_due_cheerups();

select is(
  (select kind from first_run where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'win',
  'a due user with eligible wins gets one of them back'
);

select ok(
  (select win_id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004')
   from first_run where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'the claimed win follows the selection rule'
);

select is(
  (select jsonb_array_length(subscriptions) from first_run where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1,
  'the claim includes the user''s push subscriptions'
);

select is(
  (select kind from first_run where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'nudge',
  'a due user with no wins gets a gentle nudge instead'
);

select is(
  (select count(*)::int from first_run where user_id in ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')),
  0,
  'users with cheer-ups off or no device get nothing'
);

select ok(
  (select bool_and(next_cheerup_at > now() + interval '4 days' - interval '1 minute')
   from public.profiles
   where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')),
  'every claimed user gets their next weekly slot booked'
);

select is(
  (select count(*)::int from public.reminder_log
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and win_id = (select win_id from first_run where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
     and sent_at > now() - interval '1 minute'),
  1,
  'the sent win is written to reminder_log'
);

-- A week later, the same users are due again.
update public.profiles set next_cheerup_at = now() - interval '1 minute'
  where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

create temporary table second_run on commit drop as select * from public.claim_due_cheerups();

select ok(
  (select win_id is distinct from (select win_id from first_run where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
   from second_run where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'the same win is never sent to the same user again within 6 months'
);

select is(
  (select count(*)::int from second_run where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  0,
  'the first-win nudge is not repeated every week'
);

-- Third week: Alice has no eligible wins left, so she is skipped rather than nudged.
update public.profiles set next_cheerup_at = now() - interval '1 minute'
  where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select count(*)::int from public.claim_due_cheerups() where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0,
  'someone whose wins were all sent recently is skipped that week'
);

-- Access --------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select throws_ok(
  $$ select * from public.claim_due_cheerups() $$,
  '42501', null,
  'app users cannot claim cheer-ups'
);

select throws_ok(
  $$ select * from public.reminder_log $$,
  '42501', null,
  'app users cannot read reminder_log'
);

select throws_ok(
  $$ update public.profiles set next_cheerup_at = now() where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501', null,
  'app users cannot move their own cheer-up slot'
);

select lives_ok(
  $$ select public.register_push_subscription('https://push.test/shared-device', 'key', 'secret') $$,
  'a user can register a push subscription'
);

reset role;

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;

select lives_ok(
  $$ select public.register_push_subscription('https://push.test/shared-device', 'key2', 'secret2') $$,
  'a second account can register the same browser'
);

reset role;

select is(
  (select user_id from public.push_subscriptions where endpoint = 'https://push.test/shared-device'),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  'a shared browser moves to the account that registered it last'
);

select * from finish();
rollback;
