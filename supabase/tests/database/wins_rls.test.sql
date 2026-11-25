begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local');

insert into public.wins (id, user_id, text, category, is_public) values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice public win', 'health', true),
  ('a1000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice private win', 'mind', false);

-- As Bob
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;

select results_eq(
  $$ select id from public.wins where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values ('a1000000-0000-4000-8000-000000000001'::uuid) $$,
  'other users see public wins but not private ones'
);

select throws_ok(
  $$ insert into public.wins (user_id, text, category) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pretending to be Alice', 'work') $$,
  '42501', null,
  'a user cannot post a win as someone else'
);

select lives_ok(
  $$ insert into public.wins (user_id, text, category, is_public) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob win', 'work', true) $$,
  'a user can post their own win'
);

select throws_ok(
  $$ insert into public.wins (user_id, text, category) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', repeat('a', 281), 'work') $$,
  '23514', null,
  'wins are limited to 280 characters'
);

select throws_ok(
  $$ insert into public.wins (user_id, text, category) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '   ', 'work') $$,
  '23514', null,
  'wins cannot be blank'
);

update public.wins set text = 'Edited by Bob' where id = 'a1000000-0000-4000-8000-000000000001';
delete from public.wins where id = 'a1000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ update public.wins set user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  '42501', null,
  'a win cannot be moved to another user'
);

reset role;

select is(
  (select default_visibility::text from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  'public',
  'posting a public win makes Public the default for the next one'
);

select is(
  (select default_visibility::text from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'private',
  'the default follows the most recent win, which was Just me'
);

select is(
  (select text from public.wins where id = 'a1000000-0000-4000-8000-000000000001'),
  'Alice public win',
  'a user cannot edit or delete someone else''s win'
);

-- As Alice
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select is(
  (select count(*)::int from public.wins where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  2,
  'owners see their own private wins'
);

update public.wins set text = 'Alice edited win', is_public = false where id = 'a1000000-0000-4000-8000-000000000001';
delete from public.wins where id = 'a1000000-0000-4000-8000-000000000002';

reset role;

select is(
  (select text from public.wins where id = 'a1000000-0000-4000-8000-000000000001'),
  'Alice edited win',
  'owners can edit their own win'
);

select is_empty(
  $$ select 1 from public.wins where id = 'a1000000-0000-4000-8000-000000000002' $$,
  'owners can delete their own win'
);

set local role anon;

select throws_ok(
  $$ select * from public.wins $$,
  '42501', null,
  'anonymous visitors cannot read wins'
);

reset role;

select * from finish();
rollback;
