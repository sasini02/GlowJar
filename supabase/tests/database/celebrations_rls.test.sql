begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'carol@test.local');

insert into public.wins (id, user_id, text, category, is_public) values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice public win', 'health', true),
  ('a1000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice private win', 'mind', false);

insert into public.celebrations (win_id, user_id, type) values
  ('a1000000-0000-4000-8000-000000000001', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'proud');

-- As Bob
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;

select lives_ok(
  $$ insert into public.celebrations (win_id, user_id, type) values ('a1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'celebrate') $$,
  'a user can celebrate a public win'
);

select throws_ok(
  $$ insert into public.celebrations (win_id, user_id, type) values ('a1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'proud') $$,
  '23505', null,
  'a user celebrates a win at most once'
);

select throws_ok(
  $$ insert into public.celebrations (win_id, user_id, type) values ('a1000000-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'celebrate') $$,
  '42501', null,
  'a user cannot celebrate a private win'
);

select throws_ok(
  $$ insert into public.celebrations (win_id, user_id, type) values ('a1000000-0000-4000-8000-000000000002', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'celebrate') $$,
  '42501', null,
  'a user cannot celebrate on someone else''s behalf'
);

select results_eq(
  $$ select user_id from public.celebrations $$,
  $$ values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid) $$,
  'a celebrator sees only their own reaction, not the count'
);

select lives_ok(
  $$ update public.celebrations set type = 'metoo' where win_id = 'a1000000-0000-4000-8000-000000000001' and user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'a user can change their reaction'
);

-- Carol's reaction is invisible to Bob, so this must not touch it.
delete from public.celebrations where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

-- As Alice, the author
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is(
  (select count(*)::int from public.celebrations where win_id = 'a1000000-0000-4000-8000-000000000001'),
  2,
  'the author sees every reaction on their win'
);

reset role;

select * from finish();
rollback;
