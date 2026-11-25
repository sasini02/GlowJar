begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'mod@test.local');

update public.profiles set is_moderator = true where user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

insert into public.wins (id, user_id, text, category, is_public) values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice public win', 'health', true);

insert into public.reminder_log (user_id, win_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001');

-- As Alice
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select throws_ok($$ select * from public.reminder_log $$, '42501', null, 'reminder_log is service role only');

select lives_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'https://push.test/alice', 'key', 'secret') $$,
  'a user can register their own push subscription'
);

select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'https://push.test/fake', 'key', 'secret') $$,
  '42501', null,
  'a user cannot register a push subscription for someone else'
);

-- As Bob
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is_empty($$ select 1 from public.push_subscriptions $$, 'users cannot see other people''s push subscriptions');

delete from public.push_subscriptions where endpoint = 'https://push.test/alice';

select lives_ok(
  $$ insert into public.reports (win_id, reporter_id, reason) values ('a1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Spam') $$,
  'a user can report a public win'
);

select throws_ok(
  $$ insert into public.reports (win_id, reporter_id, reason, status) values ('a1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Spam', 'removed') $$,
  '42501', null,
  'a reporter cannot set the report status'
);

select is_empty($$ select 1 from public.reports $$, 'regular users cannot read reports');

-- As the moderator
set local request.jwt.claims = '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}';

select is((select count(*)::int from public.reports), 1, 'moderators can read reports');

update public.reports set status = 'reviewed';

reset role;

select is(
  (select count(*)::int from public.push_subscriptions where endpoint = 'https://push.test/alice'),
  1,
  'users cannot delete other people''s push subscriptions'
);

select is((select status::text from public.reports), 'reviewed', 'moderators can update report status');

select * from finish();
rollback;
