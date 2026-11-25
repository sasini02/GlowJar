# Glowjar

An anonymous, text-only diary of small wins. People write short wins, keep them private or share them in a calm feed, and the app brings their own wins back to them on hard days.

Next.js (App Router) + Supabase (Postgres, Auth, Vault, Edge Functions), installable as a PWA.

## Requirements

- Node.js 20.9 or newer (22 recommended) and npm
- A Supabase account. Development runs against a hosted project, so nothing needs Docker.
- The Supabase CLI comes in as a dev dependency, so `npx supabase` works without a global install

## Getting started

Use a separate Supabase project for development. Production gets its own project later, and the seed data never goes there.

1. Create a project at https://supabase.com/dashboard (**New project**). Save the database password you choose.
2. Sign the CLI in and link the project. `<project-ref>` is the id in the dashboard URL (`supabase.com/dashboard/project/<project-ref>`):

   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```

3. Apply the migrations and sample data (once, on the development project only):

   ```bash
   npm run db:push:seed
   ```

4. Copy `.env.example` to `.env.local`. Fill in `NEXT_PUBLIC_SUPABASE_URL` (**Project Settings → Data API**) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (**Project Settings → API Keys**).
5. In **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/callback` under **Redirect URLs**.
6. Run `npm run dev` and open http://localhost:3000.

The seed adds four `@example.com` users so the feed has content. You can't receive their emails, so sign in with your own address. Supabase's built-in email sender only delivers to members of your Supabase organisation, a few times an hour. That's enough for development; Resend takes over later.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript checks |
| `npm run tokens` | Regenerates `src/styles/tokens.css` from `design/tokens.json` |
| `npm run db:push` | Applies new migrations to the linked project |
| `npm run db:push:seed` | Applies migrations and `supabase/seed.sql` (development project only) |
| `npm run db:test` | Runs the pgTAP tests in `supabase/tests/database` against `SUPABASE_DB_URL`. Each test file rolls back, so it leaves no data behind. `npm run db:test -- safety` runs only matching files |
| `npm run db:test:docker` | The same tests through `supabase test db --remote`, which needs Docker Desktop running |
| `npm run db:types` | Regenerates `src/lib/supabase/database.types.ts` from the linked project |
| `npm run icons` | Exports the PWA and notification PNGs in `public/icons` from `design/icons` |

## Database tests

`npm run db:test` connects straight to Postgres, so it needs the connection string in `.env.local`. In the Supabase dashboard, click **Connect** at the top of the project page, pick **Session pooler**, copy the URI, and replace `[YOUR-PASSWORD]` with the database password. Save it as `SUPABASE_DB_URL`. Use the Session pooler rather than the direct connection, which needs IPv6. Only ever point it at the development project.

## Project layout

```
design/                 Design tokens and icons (source of truth for the theme)
scripts/build-tokens.mjs  Turns tokens.json into CSS variables and Tailwind theme values
src/app/                Routes. (app)/ holds screens with the app shell; hard-day/ is full screen
src/components/shell/   Desktop top bar and mobile bottom tab bar
src/lib/supabase/       Browser, server and proxy Supabase clients, plus database types
src/lib/actions/        Server Actions (sign-in, set-up, wins, celebrations, letters, push, reports)
src/lib/wins/           Win queries, validation and composer ideas
src/lib/letters/        Letter queries (bodies only ever come from open_letter())
src/lib/push/client.ts  Service worker registration and Web Push subscribe/unsubscribe (browser only)
src/lib/moderation.ts   Calls the moderate-win Edge Function, with a local fallback
public/sw.js            Service worker: install support and cheer-up notifications
src/lib/auth.ts         getUserId / getProfile / requireOnboardedProfile for pages and actions
src/proxy.ts            Refreshes the Supabase session on each request and sends signed-out visitors to the welcome page (Next 16's name for middleware)
supabase/migrations/    Schema, RLS, letter encryption, cheer-up scheduling, safety rules and cron jobs
supabase/functions/     Edge Functions (Deno): moderate-win, send-cheerups, deliver-letters
supabase/functions/_shared/moderation.ts  Moderation rules, shared by the Edge Function and the app
supabase/seed.sql       Local development data
supabase/tests/         pgTAP tests for RLS, the reminder selection rule, letter unlock and delivery, and safety
```

## Styling

Colours, type, spacing, radii and shadows come from `design/tokens.json`. Don't edit `src/styles/tokens.css` by hand: change the JSON and run `npm run tokens`. Each token's usage note is copied into the CSS as a comment. Follow those notes, for example text on `glow` is always `ink`.

Utilities follow the token names: `bg-surface`, `text-ink`, `text-ink-muted`, `bg-glow`, `bg-dusk text-on-dusk`, `bg-card-mint`, `text-display`, `text-win-text`, `rounded-lg`, `rounded-pill`, `shadow-card`, `font-serif`.

Themes: Day is the default. `data-theme="night"` on `<html>` forces Night, `data-theme="day"` forces Day, and no attribute follows the system setting.

## Database notes

- Every table has RLS enabled. Default Supabase grants are revoked and re-granted per column, so users can't change fields like `profiles.is_moderator` or `wins.user_id`.
- Emails exist only in `auth.users`. Other users' names come from the `public_profiles` view (`user_id`, `username`). The `profiles` table is readable only by its owner.
- A profile with a random "Adjective Noun" username is created by a trigger when someone signs up. New profiles default to Just me; after that, each new win remembers the visibility of the user's previous win (`profiles.default_visibility`).
- `profiles.timezone` must be a real IANA name (enforced by a trigger). "Today" for letters is the user's local date.
- Letter bodies are encrypted with `pgp_sym_encrypt` using a key stored in Supabase Vault under the name `letters_encryption_key`. Write letters with `seal_letter(body, deliver_on)`. Read them with `open_letter(letter_id)`, which refuses until `deliver_on` has arrived in the author's own timezone. The encrypted column can't be selected through the API.
- `reminder_log` is service-role only.
- `profiles.onboarded_at` is null until the user finishes the set-up screen; app pages send them to `/setup` until then. `suggest_username()` powers the set-up screen's Shuffle button.
- Celebrations are set with an update-then-insert rather than an upsert, because users may only update the `type` column.
- **Cheer-ups:** turning them on books `profiles.next_cheerup_at`, a random moment 1 to 7 days away outside the user's quiet hours in their timezone. After each run the next slot is 4 to 10 days later. `claim_due_cheerups()` picks a win older than 14 days that isn't in `reminder_log` for the last 6 months, logs it and books the next slot in one transaction. Someone with no wins at all gets a "write your first win" nudge at most every 4 weeks. Someone whose wins are all too new or recently sent is skipped that week.
- **Letter delivery:** `claim_due_letters()` returns due letters with the decrypted body and the author's email. It is callable only by the service role.
- **Safety:** at most 20 wins per person per 24 hours (trigger, SQLSTATE `GJ429`). Public wins pass through `moderate-win` before saving. Private wins are never moderated. Three open reports hide a win from the feed. Moderators (`profiles.is_moderator`) review reports at `/moderation`, and "remove" makes the win private rather than deleting it.

## Background jobs and Edge Functions

`pg_cron` runs `send-cheerups` and `deliver-letters` every hour through `private.invoke_edge_function()`, which reads two Vault secrets. Letters run hourly rather than daily because each author's "today" depends on their timezone. One-time setup per Supabase project:

1. Generate VAPID keys with `npx web-push generate-vapid-keys`. Put the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key in `VAPID_PRIVATE_KEY` in `.env.local`, and set `VAPID_SUBJECT` (e.g. `mailto:you@example.com`).
2. Make a long random cron secret, for example with `openssl rand -base64 32`.
3. In the Supabase dashboard, open **Database → Vault → Add new secret** and add:
   - `project_url`: `https://<project-ref>.supabase.co`
   - `cron_secret`: the value from step 2
4. Copy `supabase/functions/.env.example` to `supabase/functions/.env`, fill it in (the same cron secret and VAPID keys, plus Resend), then run `npx supabase secrets set --env-file supabase/functions/.env`.
5. Deploy the functions: `npx supabase functions deploy moderate-win send-cheerups deliver-letters`.
6. In Resend, verify the domain used in `RESEND_FROM_EMAIL` (**Domains → Add domain**, then add the DNS records it shows).

To check the jobs, look at **Integrations → Cron → Jobs** in the dashboard (run history), and **Edge Functions → \<name\> → Logs**.

Push needs a production build: the service worker registers only when `NODE_ENV` is `production` (`npm run build && npm start`). On iPhone, push works only after Glowjar is added to the home screen.

## Setting up production

1. Create a second Supabase project for production. Link it with `npx supabase link --project-ref <prod-ref>` and run `npm run db:push`. Don't run `db:push:seed` here.
2. Create the letter encryption key: **Database → Vault → Add new secret**. Name it `letters_encryption_key` and give it a long random value (for example the output of `openssl rand -base64 48`). Don't change it once letters exist, or they can't be decrypted. (On the development project, the seed creates this key for you.)
3. **Authentication → URL Configuration**: set **Site URL** to your production URL and add `https://<your-domain>/auth/callback` under **Redirect URLs**.
