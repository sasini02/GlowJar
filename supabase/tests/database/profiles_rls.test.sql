begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'carol@test.local');

select isnt_empty(
  $$ select 1 from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'signing up creates a profile'
);

select matches(
  (select username from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  '^[A-Z][a-z]+ [A-Z][a-z]+( [0-9a-f]+)*$',
  'the generated username is an adjective and a nature noun'
);

select is(
  (select default_visibility::text from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'private',
  'new profiles default to Just me'
);

select hasnt_column('public', 'profiles', 'email', 'profiles never store an email');
select columns_are('public', 'public_profiles', array['user_id', 'username'], 'public profiles expose only the username');

-- As Alice
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select results_eq(
  $$ select user_id from public.profiles $$,
  $$ values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid) $$,
  'a user reads only their own full profile'
);

select is(
  (select count(*)::int from public.public_profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  1,
  'a user can read another user''s username'
);

select lives_ok(
  $$ update public.profiles set username = 'Alice Wren' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'a user can rename themselves'
);

update public.profiles set username = 'Hijacked' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select throws_ok(
  $$ update public.profiles set is_moderator = true where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501', null,
  'a user cannot make themselves a moderator'
);

select throws_ok(
  $$ update public.profiles set username = 'alice@mail.com' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '23514', null,
  'usernames cannot contain an email address'
);

select throws_ok(
  $$ update public.profiles set timezone = 'Mars/Olympus_Mons' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '22023', null,
  'timezones must be real IANA names'
);

select lives_ok(
  $$ update public.profiles set timezone = 'Asia/Tokyo' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'a user can set a valid timezone'
);

reset role;

select is(
  (select username from public.profiles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> 'Hijacked',
  true,
  'a user cannot rename someone else'
);

select throws_ok(
  $$ update public.profiles set username = 'ALICE WREN' where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' $$,
  '23505', null,
  'usernames are unique regardless of case'
);

-- As an anonymous visitor
set local role anon;

select throws_ok(
  $$ select * from public.profiles $$,
  '42501', null,
  'anonymous visitors cannot read profiles'
);

select lives_ok(
  $$ select username from public.public_profiles $$,
  'anonymous visitors can read usernames'
);

reset role;

select * from finish();
rollback;
