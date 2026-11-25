begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local');

update public.profiles set timezone = 'UTC'
  where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

insert into public.wins (id, user_id, text, category, is_public, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Drank water all day', 'health', false, now()),
  ('a0000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Walked to the station in the rain', 'health', true, date_trunc('month', now()) - interval '5 days'),
  ('a0000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Shipped the report on time', 'work', true, date_trunc('month', now()) - interval '6 days'),
  ('a0000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ran my first 5k', 'health', false, now() - interval '1 year'),
  ('a0000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Told a friend how I really was', 'social', false, now() - interval '6 months' - interval '2 days'),
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob walked the dog', 'health', false, now());

-- Bob celebrates Alice's report, so it becomes last month's most-celebrated win.
insert into public.celebrations (win_id, user_id, type)
  values ('a0000000-0000-4000-8000-000000000003', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'proud');

-- Search, shelf and On this day, as Alice -----------------------------------

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select is(
  (select array_agg(id) from public.wins
   where search @@ websearch_to_tsquery('english', 'walking')
     and user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')),
  array['a0000000-0000-4000-8000-000000000002'::uuid],
  'search matches word stems and never returns someone else''s private win'
);

select is(
  (select lights from public.jar_shelf() where month = (date_trunc('month', now()) - interval '1 month')::date),
  2,
  'the shelf counts each past month''s lights'
);

select is_empty(
  $$ select 1 from public.jar_shelf() where month = date_trunc('month', now())::date $$,
  'the current month stays in the jar, not on the shelf'
);

select is(
  (select count(*)::int from public.jar_shelf()),
  3,
  'every past month with wins is on the shelf'
);

select is(
  (select win_id from public.on_this_day()),
  'a0000000-0000-4000-8000-000000000004'::uuid,
  'On this day prefers the win from exactly a year ago'
);

select is(
  (select months_ago from public.on_this_day()),
  12,
  'On this day says how long ago it was'
);

reset role;
delete from public.wins where id = 'a0000000-0000-4000-8000-000000000004';
set local role authenticated;

select is(
  (select win_id from public.on_this_day()),
  'a0000000-0000-4000-8000-000000000005'::uuid,
  'a win from about six months ago, within a few days, also counts'
);

reset role;

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;

select is_empty($$ select 1 from public.jar_shelf() $$, 'the shelf only shows your own months');
select is_empty($$ select 1 from public.on_this_day() $$, 'On this day only looks at your own wins');

reset role;

-- Monthly recaps ------------------------------------------------------------

select ok(
  private.build_recap('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', (date_trunc('month', now()) - interval '1 month')::date),
  'a recap is built for a month with wins'
);

select is(
  (select total from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  2,
  'the recap counts the month''s lights'
);

select is(
  (select by_category from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  '{"health": 1, "work": 1}'::jsonb,
  'the recap breaks lights down by category'
);

select is(
  (select top_win_id from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'a0000000-0000-4000-8000-000000000003'::uuid,
  'the recap names the most-celebrated win'
);

select ok(
  not private.build_recap('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', (date_trunc('month', now()) - interval '1 month')::date),
  'building the same recap twice does nothing'
);

select ok(
  not private.build_recap('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', (date_trunc('month', now()) - interval '1 month')::date),
  'a month without wins gets no recap'
);

delete from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select private.build_due_recaps();

select isnt_empty(
  $$ select 1 from public.monthly_recaps
     where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
       and month = (date_trunc('month', now()) - interval '1 month')::date $$,
  'the scheduled job builds last month''s recap'
);

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;

select is_empty(
  $$ select 1 from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'nobody else can read your recap'
);

select throws_ok(
  $$ select private.build_due_recaps() $$,
  '42501', null,
  'app users cannot run the recap job'
);

select throws_ok(
  $$ insert into public.monthly_recaps (user_id, month, total, by_category)
     values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', date_trunc('month', now())::date, 99, '{}') $$,
  '42501', null,
  'app users cannot write recaps'
);

reset role;

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
select isnt_empty(
  $$ select 1 from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'you can read your own recap'
);
reset role;

delete from public.wins where id = 'a0000000-0000-4000-8000-000000000003';
select is(
  (select top_win_id from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null,
  'deleting the most-celebrated win leaves the recap without it'
);

-- Realtime and account deletion ---------------------------------------------

select ok(
  exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'celebrations'
  ),
  'celebrations are published to Realtime'
);

delete from auth.users where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select count(*)::int from public.wins where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    + (select count(*)::int from public.monthly_recaps where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    + (select count(*)::int from public.profiles where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0,
  'deleting an account removes the profile, wins and recaps'
);

select * from finish();
rollback;
