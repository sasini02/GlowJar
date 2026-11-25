begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alice@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bob@test.local'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'carol@test.local'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dave@test.local'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'mod@test.local');

update public.profiles set is_moderator = true where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

-- Rate limit ----------------------------------------------------------------

insert into public.wins (user_id, text, category)
select 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Win number ' || n, 'mind'
from generate_series(1, 20) n;

select throws_ok(
  $$ insert into public.wins (user_id, text, category) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'One too many', 'mind') $$,
  'GJ429', null,
  'a 21st win within 24 hours is refused'
);

select lives_ok(
  $$ insert into public.wins (user_id, text, category, created_at) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bob is fine', 'mind', now()) $$,
  'the limit is per person'
);

-- Reports -------------------------------------------------------------------

insert into public.wins (id, user_id, text, category, is_public) values
  ('b0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A public win', 'work', true),
  ('b0000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Another public win', 'work', true);

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;
insert into public.reports (win_id, reporter_id, reason) values
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Spam or advertising'),
  ('b0000000-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Hurtful or unkind');

select throws_ok(
  $$ select * from public.open_reports() $$,
  '42501', null,
  'regular users cannot see the report queue'
);

select throws_ok(
  $$ select public.resolve_reports('b0000000-0000-4000-8000-000000000001', 'removed') $$,
  '42501', null,
  'regular users cannot resolve reports'
);
reset role;

set local request.jwt.claims = '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}';
set local role authenticated;
insert into public.reports (win_id, reporter_id, reason)
  values ('b0000000-0000-4000-8000-000000000001', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Spam or advertising');
reset role;

select ok(
  (select is_public from public.wins where id = 'b0000000-0000-4000-8000-000000000001'),
  'two reports leave a win in the feed'
);

set local request.jwt.claims = '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}';
set local role authenticated;
insert into public.reports (win_id, reporter_id, reason)
  values ('b0000000-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Something else');
reset role;

select ok(
  not (select is_public from public.wins where id = 'b0000000-0000-4000-8000-000000000001'),
  'a third report hides the win from the feed'
);

select isnt_empty(
  $$ select 1 from public.wins where id = 'b0000000-0000-4000-8000-000000000001' $$,
  'a hidden win stays in its author''s jar'
);

-- As the moderator
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';
set local role authenticated;

select is(
  (select report_count::int from public.open_reports() where win_id = 'b0000000-0000-4000-8000-000000000001'),
  3,
  'moderators see open reports grouped by win, even once the win is hidden'
);

select lives_ok(
  $$ select public.resolve_reports('b0000000-0000-4000-8000-000000000002', 'removed') $$,
  'moderators can remove a win from the feed'
);

select lives_ok(
  $$ select public.resolve_reports('b0000000-0000-4000-8000-000000000001', 'reviewed') $$,
  'moderators can mark reports as reviewed'
);

select is_empty(
  $$ select 1 from public.open_reports() where win_id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002') $$,
  'resolved reports leave the queue'
);

reset role;

select ok(
  not (select is_public from public.wins where id = 'b0000000-0000-4000-8000-000000000002'),
  'a removed win is no longer public'
);

select is(
  (select status::text from public.reports where win_id = 'b0000000-0000-4000-8000-000000000002'),
  'removed',
  'its reports are marked removed'
);

select * from finish();
rollback;
