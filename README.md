# Glowjar

An anonymous, text-only diary of small wins. People write short wins, keep them private or share them in a calm feed, and the app brings their own wins back to them on hard days.

Next.js (App Router) + Supabase (Postgres, Auth, Vault, Edge Functions), installable as a PWA.

## Requirements

- Node.js 20.9 or newer (22 recommended) and npm
- A Supabase account. Development runs against a hosted project, so the app itself needs no Docker.
- Docker Desktop, running, for `npm run db:test` only: the CLI runs `pg_prove` in a container even against the hosted project
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
| `npm run db:test` | Runs the pgTAP tests in `supabase/tests` against the linked project. Each test file rolls back, so it leaves no data behind |
| `npm run db:types` | Regenerates `src/lib/supabase/database.types.ts` from the linked project |

## Project layout

```
design/                 Design tokens and icons (source of truth for the theme)
scripts/build-tokens.mjs  Turns tokens.json into CSS variables and Tailwind theme values
src/app/                Routes. (app)/ holds screens with the app shell; hard-day/ is full screen
src/components/shell/   Desktop top bar and mobile bottom tab bar
src/lib/supabase/       Browser, server and proxy Supabase clients, plus database types
src/proxy.ts            Refreshes the Supabase session on each request (Next 16's name for middleware)
supabase/migrations/    Schema, RLS policies and letter encryption
supabase/seed.sql       Local development data
supabase/tests/         pgTAP tests for RLS and the letter unlock rule
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

## Setting up production

1. Create a second Supabase project for production. Link it with `npx supabase link --project-ref <prod-ref>` and run `npm run db:push`. Don't run `db:push:seed` here.
2. Create the letter encryption key: **Database → Vault → Add new secret**. Name it `letters_encryption_key` and give it a long random value (for example the output of `openssl rand -base64 48`). Don't change it once letters exist, or they can't be decrypted. (On the development project, the seed creates this key for you.)
3. **Authentication → URL Configuration**: set **Site URL** to your production URL and add `https://<your-domain>/auth/callback` under **Redirect URLs**.
