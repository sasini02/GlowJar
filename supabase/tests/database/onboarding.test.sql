begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local');

select is(
  (select onboarded_at from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null,
  'new profiles start without onboarding'
);

-- As Alice
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select matches(
  public.suggest_username(),
  '^[A-Z][a-z]+ [A-Z][a-z]+( [0-9a-f]+)*$',
  'signed-in users can ask for a username suggestion'
);

select lives_ok(
  $$ update public.profiles set onboarded_at = now() where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'a user can finish their own onboarding'
);

update public.profiles set onboarded_at = now() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

reset role;

select isnt(
  (select onboarded_at from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null,
  'onboarding is recorded'
);

select is(
  (select onboarded_at from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  null,
  'a user cannot finish someone else''s onboarding'
);

-- As an anonymous visitor
set local role anon;

select throws_ok(
  $$ select public.suggest_username() $$,
  '42501', null,
  'anonymous visitors cannot generate usernames'
);

reset role;

select * from finish();
rollback;
