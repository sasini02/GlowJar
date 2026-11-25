-- Sample data for a development project. Never run this against production.
-- Applied once with `npm run db:push:seed` on a development project.
-- The example.com users exist only to fill the feed; sign in with your own email.

-- Creates a random letter key if the project does not have one yet.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'letters_encryption_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(48), 'base64'),
      'letters_encryption_key',
      'Encrypts letters to future self. Never change it once letters exist.'
    );
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now() - interval '400 days', now(),
  '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'otter@example.com'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'fern@example.com'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'sparrow@example.com'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'moderator@example.com')
) as u (id, email);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@example.com';

-- Profiles are created by the signup trigger with random names; pin them so the seed is predictable.
update public.profiles set username = 'Quiet Otter', timezone = 'Europe/London', default_visibility = 'public', cheerups_enabled = true
  where user_id = '10000000-0000-4000-8000-000000000001';
update public.profiles set username = 'Gentle Fern', timezone = 'America/New_York', default_visibility = 'public'
  where user_id = '10000000-0000-4000-8000-000000000002';
update public.profiles set username = 'Brave Sparrow', timezone = 'Asia/Tokyo'
  where user_id = '10000000-0000-4000-8000-000000000003';
update public.profiles set username = 'Steady Heron', is_moderator = true
  where user_id = '10000000-0000-4000-8000-000000000004';

insert into public.wins (id, user_id, text, emoji, category, is_public, created_at) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Went for a walk even though it was raining. The air smelled amazing.', '🌧️', 'health', true, now() - interval '2 hours'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Finally sent the email I had been putting off for two weeks.', '📮', 'work', true, now() - interval '5 hours'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Called my grandmother just to say hi.', '☎️', 'social', true, now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Read ten pages before bed instead of scrolling.', '📖', 'learning', true, now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'Said no to something I did not have energy for. No guilt.', null, 'self_care', true, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'Five minutes of breathing on the bus. Felt my shoulders drop.', '🫧', 'mind', true, now() - interval '4 days'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Asked a question in the meeting instead of staying quiet.', '🙋', 'work', true, now() - interval '6 days'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'Cooked a real dinner with vegetables and everything.', '🥕', 'health', false, now() - interval '8 days'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'Got out of bed on a heavy morning. That was the whole win, and it counts.', null, 'self_care', false, now() - interval '20 days'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Finished the online course I started in spring.', '🎓', 'learning', true, now() - interval '45 days'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'Told a friend how I was really doing.', '🤍', 'social', false, now() - interval '6 months'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', 'Ran my first 5k without stopping.', '🏃', 'health', true, now() - interval '1 year'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000002', 'Watered every plant on the balcony and talked to them a bit.', '🪴', 'self_care', true, now() - interval '10 days'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000003', 'Learned how to say thank you properly in a new language.', '🗣️', 'learning', true, now() - interval '12 days');

insert into public.celebrations (win_id, user_id, type) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'celebrate'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'metoo'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'proud'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'metoo'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000002', 'proud'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'celebrate');

-- One sealed letter and one that has already arrived.
insert into public.letters (user_id, body_encrypted, deliver_on, delivered_at, created_at) values
  ('10000000-0000-4000-8000-000000000001',
   extensions.pgp_sym_encrypt('Dear future me, I hope you kept walking in the rain.', private.letters_key()),
   current_date + 90, null, now() - interval '3 days'),
  ('10000000-0000-4000-8000-000000000001',
   extensions.pgp_sym_encrypt('Hello from last winter. You were braver than you felt.', private.letters_key()),
   current_date - 2, now() - interval '2 days', now() - interval '1 year');

insert into public.reminder_log (user_id, win_id, sent_at) values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000010', now() - interval '7 days');
