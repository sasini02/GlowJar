begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local');

update public.profiles set timezone = 'Pacific/Auckland' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.profiles set timezone = 'UTC' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

-- 20:00 UTC on 1 November is already 2 November in Auckland.
insert into public.wins (id, user_id, text, category, is_public, created_at) values
  ('a2000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Late-night win', 'mind', false, '2026-11-01 20:00:00+00'),
  ('a2000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Second win that day', 'work', true, '2026-11-01 21:00:00+00'),
  ('a2000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Win today', 'health', false, now()),
  ('b2000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob win', 'health', false, '2026-11-01 20:00:00+00');

select is(
  (select local_date from public.wins where id = 'a2000000-0000-4000-8000-000000000001'),
  '2026-11-02'::date,
  'a win lights the day it was written on in the author''s timezone'
);

select is(
  (select local_date from public.wins where id = 'b2000000-0000-4000-8000-000000000001'),
  '2026-11-01'::date,
  'local dates follow each author''s own timezone'
);

-- As Alice -------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;

select results_eq(
  $$ select d from public.my_lit_dates('2026-10-01') d where d < '2026-11-10' $$,
  $$ values ('2026-11-02'::date) $$,
  'lit dates are distinct and only the viewer''s own'
);

select ok((select public.lights_today()) >= 1, 'lights_today counts everyone''s wins, private ones included');

select lives_ok($$ select public.save_mood(5, array['Friends', 'Sleep']) $$, 'a user can check in');

select lives_ok($$ select public.save_mood(2) $$, 'a user can update today''s mood');

select results_eq(
  $$ select level::int, tags from public.moods $$,
  $$ values (2, array['Friends', 'Sleep']) $$,
  'checking in again updates the same day and keeps its tags when none are given'
);

select lives_ok($$ select public.save_mood(4, '{}') $$, 'tags can be cleared');

select is((select tags from public.moods), '{}'::text[], 'an empty tag list clears the tags');

select throws_ok($$ select public.save_mood(7) $$, '23514', null, 'mood levels stay on the 0-6 scale');

select throws_ok(
  $$ select public.save_mood(3, array['Lottery']) $$,
  '23514', null,
  'only the fixed tags are allowed'
);

select throws_ok(
  $$ insert into public.moods (user_id, local_date, level) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', current_date, 3) $$,
  '42501', null,
  'a user cannot write a mood for someone else'
);

select lives_ok(
  $$ insert into public.streak_milestones (user_id, days, reached_on) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, current_date) $$,
  'a user records their own milestone'
);

select throws_ok(
  $$ insert into public.streak_milestones (user_id, days, reached_on) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 5, current_date) $$,
  '23514', null,
  'only real milestones can be recorded'
);

select throws_ok(
  $$ update public.wins set local_date = '2020-01-01' where id = 'a2000000-0000-4000-8000-000000000003' $$,
  '42501', null,
  'a win''s local date cannot be moved'
);

select throws_ok(
  $$ update public.profiles set last_glow_reminder_on = current_date where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501', null,
  'the reminder log on a profile is job-only'
);

select throws_ok(
  $$ select * from public.claim_due_glow_reminders() $$,
  '42501', null,
  'users cannot claim daily reminders'
);

-- As Bob ---------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is_empty($$ select 1 from public.moods $$, 'moods are only readable by their owner');

select is_empty($$ select 1 from public.streak_milestones $$, 'milestones are only readable by their owner');

select is_empty(
  $$ update public.moods set level = 6 returning 1 $$,
  'a user cannot change someone else''s mood'
);

select is_empty(
  $$ select d from public.my_lit_dates('2026-11-02') d where d = '2026-11-02' $$,
  'lit dates never include someone else''s wins'
);

-- Daily reminders, as the job --------------------------------------------------

reset role;

insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'https://push.test/bob', 'p', 'a');

-- Moves Bob to a fixed-offset timezone where the local hour is `target_hour` right now,
-- so the test doesn't depend on when it runs. Etc/GMT-3 means UTC+3.
create function pg_temp.put_bob_at(target_hour int) returns void language sql as $$
  update public.profiles
  set timezone = (
    select 'Etc/GMT' || case when o > 0 then '-' || o when o < 0 then '+' || -o else '' end
    from (select ((target_hour - extract(hour from now() at time zone 'UTC')::int + 36) % 24) - 12 as o) offset_hours
  ),
  last_glow_reminder_on = null
  where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
$$;

update public.profiles
set onboarded_at = now(), nudge_time = 'morning', quiet_start = '00:00', quiet_end = '00:00'
where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select pg_temp.put_bob_at(8);

select is(
  (select count(*)::int from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  1,
  'a reminder goes out just after the nudge time when today is not lit'
);

select is_empty(
  $$ select 1 from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'never more than one reminder a day'
);

select pg_temp.put_bob_at(11);

select is_empty(
  $$ select 1 from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'a missed reminder is dropped after two hours rather than sent late'
);

update public.profiles set nudge_time = 'night' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select pg_temp.put_bob_at(22);

select is_empty(
  $$ select 1 from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'never at night, even inside the catch-up window'
);

update public.profiles
set nudge_time = 'morning', quiet_start = '07:00', quiet_end = '09:00'
where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select pg_temp.put_bob_at(8);

select is_empty(
  $$ select 1 from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'never inside the user''s own quiet hours'
);

update public.profiles set quiet_start = '22:00', quiet_end = '08:00' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
insert into public.wins (user_id, text, category) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Lit today', 'health');

select is_empty(
  $$ select 1 from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'nobody is reminded once today is lit'
);

update public.profiles set glow_reminders_enabled = false where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
delete from public.wins where text = 'Lit today';

select is_empty(
  $$ select 1 from public.claim_due_glow_reminders() where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'reminders can be turned off'
);

select * from finish();
rollback;
