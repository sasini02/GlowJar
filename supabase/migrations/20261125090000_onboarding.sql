-- Onboarding: a profile exists from the moment someone signs up (trigger), so
-- we need a separate marker for "has finished the set-up screen".

alter table public.profiles add column onboarded_at timestamptz;

-- Profiles created before this migration (seed users) have already been set up.
update public.profiles set onboarded_at = created_at where onboarded_at is null;

grant update (onboarded_at) on public.profiles to authenticated;

-- The set-up screen's "Shuffle" button. generate_username() lives in the
-- private schema, so expose just this wrapper to signed-in users.
create function public.suggest_username()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select private.generate_username();
$$;

revoke execute on function public.suggest_username() from public, anon;
grant execute on function public.suggest_username() to authenticated;
