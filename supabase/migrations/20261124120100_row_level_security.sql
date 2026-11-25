-- Row Level Security and table grants.
--
-- Supabase grants every privilege on new public tables to anon and authenticated
-- by default. We revoke those and grant back only what each table needs, so
-- column-level rules (who may change which fields) are enforced by Postgres
-- rather than by convention.

grant usage on schema private to authenticated;

revoke execute on function private.generate_username() from public;
revoke execute on function private.handle_new_user() from public;
revoke execute on function private.set_updated_at() from public;
revoke execute on function private.validate_timezone() from public;
revoke execute on function private.local_today(uuid) from public;
revoke execute on function private.remember_visibility() from public;

create function private.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_moderator from public.profiles p where p.user_id = (select auth.uid())),
    false
  );
$$;

revoke execute on function private.is_moderator() from public;
grant execute on function private.is_moderator() to authenticated;

-- profiles ---------------------------------------------------------------

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- is_moderator, user_id and created_at are deliberately not updatable by users.
grant update (
  username, timezone, nudge_time, cheerups_enabled,
  quiet_start, quiet_end, theme, default_visibility
) on public.profiles to authenticated;

create policy "Owners read their own profile"
  on public.profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners update their own profile"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- wins -------------------------------------------------------------------

alter table public.wins enable row level security;

revoke all on public.wins from anon, authenticated;
grant select, delete on public.wins to authenticated;
grant insert (user_id, text, emoji, category, is_public) on public.wins to authenticated;
grant update (text, emoji, category, is_public) on public.wins to authenticated;

create policy "Authenticated users read public wins and their own"
  on public.wins for select
  to authenticated
  using (is_public or user_id = (select auth.uid()));

create policy "Owners add their own wins"
  on public.wins for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Owners edit their own wins"
  on public.wins for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners delete their own wins"
  on public.wins for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- celebrations -----------------------------------------------------------

alter table public.celebrations enable row level security;

revoke all on public.celebrations from anon, authenticated;
grant select, delete on public.celebrations to authenticated;
grant insert (win_id, user_id, type) on public.celebrations to authenticated;
grant update (type) on public.celebrations to authenticated;

-- Counts are private to the win's author, so other users only ever see their own reaction.
create policy "Users read their own celebrations; authors read all on their wins"
  on public.celebrations for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.wins w
      where w.id = celebrations.win_id
        and w.user_id = (select auth.uid())
    )
  );

create policy "Users celebrate public wins as themselves"
  on public.celebrations for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.wins w
      where w.id = celebrations.win_id
        and w.is_public
    )
  );

create policy "Users change their own celebration"
  on public.celebrations for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users remove their own celebration"
  on public.celebrations for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- letters ----------------------------------------------------------------

alter table public.letters enable row level security;

-- No direct insert or update: letters are written through seal_letter(), and
-- the encrypted body is never selectable. Reading the body goes through open_letter().
revoke all on public.letters from anon, authenticated;
grant select (id, user_id, deliver_on, delivered_at, created_at) on public.letters to authenticated;
grant delete on public.letters to authenticated;

create policy "Owners see their own letters"
  on public.letters for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners delete their own letters"
  on public.letters for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- reminder_log -----------------------------------------------------------

-- Service role only: RLS on with no policies, and no grants to API roles.
alter table public.reminder_log enable row level security;
revoke all on public.reminder_log from anon, authenticated;

-- push_subscriptions -----------------------------------------------------

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant insert (user_id, endpoint, p256dh, auth) on public.push_subscriptions to authenticated;

-- Owners need to see their own rows so that "delete where endpoint = ..." can match.
create policy "Owners see their own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners add their own push subscriptions"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Owners remove their own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- reports ----------------------------------------------------------------

alter table public.reports enable row level security;

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (win_id, reporter_id, reason) on public.reports to authenticated;
grant update (status) on public.reports to authenticated;

create policy "Users report wins they can see"
  on public.reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.wins w where w.id = reports.win_id)
  );

create policy "Moderators read reports"
  on public.reports for select
  to authenticated
  using ((select private.is_moderator()));

create policy "Moderators update reports"
  on public.reports for update
  to authenticated
  using ((select private.is_moderator()))
  with check ((select private.is_moderator()));
