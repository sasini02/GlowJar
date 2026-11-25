-- Scheduled jobs. pg_cron calls the Edge Functions over HTTP with pg_net.
-- The project URL and a shared secret come from Vault (see README, "Scheduled
-- jobs"), so nothing secret is written into this migration. Until those secrets
-- exist the jobs log a notice and do nothing.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create function private.invoke_edge_function(function_name text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  project_url text;
  cron_secret text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into cron_secret from vault.decrypted_secrets where name = 'cron_secret';

  if project_url is null or cron_secret is null then
    raise notice 'Skipping %: Vault secrets project_url and cron_secret are not set', function_name;
    return;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/' || function_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', cron_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

revoke execute on function private.invoke_edge_function(text) from public;

-- Hourly, because each person's weekly slot is a random hour.
select cron.schedule('send-cheerups', '5 * * * *', $$ select private.invoke_edge_function('send-cheerups') $$);

-- Also hourly rather than once a day: "today" is each author's local date, so a
-- single daily run would deliver some time zones' letters a day late.
select cron.schedule('deliver-letters', '15 * * * *', $$ select private.invoke_edge_function('deliver-letters') $$);
