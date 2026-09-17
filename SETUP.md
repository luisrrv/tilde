# SETUP

Every manual step for Task 01 (astro scaffold, tokens, database, auth —
`prompt_01_scaffold.md`, §19 steps 1–7 of `blueprint.md`), in order.
Written so it's followable without having read the conversation that
produced it. Nothing here is done yet on your end — do these in order.

Neither the `netlify` nor the `supabase` CLI was installed/authenticated
in the environment this was built in, so this is written for the
dashboards plus optional CLI commands you run yourself.

---

## 0. Prerequisites

- Node.js 18+ (this was built against Node 22).
- A Supabase account.
- A Netlify account.
- Optionally, the CLIs, if you'd rather not click through dashboards:

  ```bash
  npm install -g netlify-cli
  # Supabase's CLI is a standalone binary, not an npm global install:
  brew install supabase/tap/supabase
  # or see https://supabase.com/docs/guides/cli/getting-started
  ```

  Then authenticate each:

  ```bash
  netlify login
  supabase login
  ```

---

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Name it `tilde` (this is just the dashboard label — unrelated to the
   Netlify project name below).
3. Pick a region close to you (Tokyo, if available) and set a strong
   database password. **Save that password somewhere outside this
   repo** — a password manager, not a file here.
4. Once the project is provisioned, go to **Project Settings → API**
   and note down:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public** key (`SUPABASE_ANON_KEY`)
   - **service_role** key — needed once, briefly, for step 5 and for
     the RLS verification in step 8. **Never put this in a file, in
     Netlify, or in any commit.** Keep it in your password manager or
     paste it directly into your shell when needed, nowhere else.

---

## 2. Apply the migrations

The three migration files are in `supabase/migrations/`, numbered in
the order they must run:

```text
20260914080000_logs_and_now_tables.sql   the logs + now DDL (§11)
20260914080100_now_seed.sql              the five now rows, empty values
20260914080200_enable_rls.sql            RLS, owner UUID placeholder
```

**Option A — Supabase CLI** (if installed and logged in):

```bash
supabase link --project-ref <your-project-ref>   # ref is in the project URL
supabase db push
```

**Option B — SQL editor** (no CLI needed): open **SQL Editor** in the
dashboard and run each file's contents, in order, as its own query.

Either way, do **not** run step 3 (RLS) yet if you haven't decided on
the owner UUID — see the next step first.

---

## 3. Create your owner account and get its UUID

The magic-link auth flow (step 6 below) needs an `auth.users` row to
exist before it means anything, and the RLS policies need that row's
UUID.

1. In the dashboard, go to **Authentication → Users → Add user** and
   create a user with your own email. (Or: skip this and request a
   magic link once step 6 is configured — either creates the user.)
2. Copy that user's **UUID** from the Users table.
3. Open `supabase/migrations/20260914080200_enable_rls.sql` in this
   repo and replace every occurrence of
   `00000000-0000-0000-0000-000000000000` with your real UUID.
4. Re-run *just that file's* contents in the SQL editor (or run
   `supabase db push` again if you're using the CLI and hadn't applied
   it yet). If you already ran the placeholder version, you'll need to
   `drop policy` the four policies first, or just `alter policy ... using (...) with check (...)` — the SQL editor will tell you if a policy already exists.

Tell me your UUID once you have it if you'd like me to update the
migration file for you instead of doing step 3.3–3.4 by hand.

---

## 4. Configure custom SMTP

The built-in Supabase mailer is capped at ~2 emails/hour and isn't
usable in production (blueprint §13).

1. Create a free account with an SMTP provider — Resend is the one the
   blueprint names, and its free tier is far more than one user needs.
2. In Resend (or your provider), get SMTP credentials and verify a
   sending domain (or use their shared domain for now).
3. In Supabase: **Authentication → Emails → SMTP Settings** → enable
   custom SMTP, enter the host/port/user/password from your provider,
   and set a sender address.
4. Send a test email from that panel to confirm it works before moving
   on — a broken SMTP config plus a 15-minute token expiry (step 6.4)
   means you can lock yourself out.

---

## 5. The four auth settings (§13)

All under **Authentication → Settings** (or **Providers**/**URL
Configuration**, depending on the current dashboard layout):

1. **Disable public signups.** Turn off "Allow new users to sign up."
   Policies are already pinned to your UUID, but this stops strangers
   from creating `auth.users` rows and sending mail through your
   project.
2. **Confirm policies are pinned to your UUID** — this is step 3 above,
   not a dashboard setting; just confirming it's done.
3. **Set the redirect allowlist.** Under URL Configuration, set the
   Site URL and add every URL magic links should be allowed to redirect
   to: your Netlify preview URL(s) now, `rodluis.com` later. This is
   the one genuine footgun — get it wrong and a token can be bounced
   somewhere it shouldn't.
4. **Shorten token expiry** from the 1-hour default to ~15 minutes
   (under Email OTP / magic link settings).

Expect an occasional burnt token — some inbox scanners fetch links to
build previews, consuming the single use before you do. Just request a
second one.

---

## 6. Create the Netlify site

**Project name:** `tilde-luisrrv` (the repo stays `tilde`; the domain
stays `rodluis.com` — this is only the disposable Netlify subdomain
until DNS cutover, §10).

**Option A — CLI:**

```bash
netlify init
# or, to link an already-created site:
netlify link
```

**Option B — dashboard:** **Add new site → Import an existing project**,
connect the `luisrrv/tilde` repo, pick the `task-01-scaffold` branch (or
whatever branch this is merged into) to develop against — **not**
`main`'s production context yet. Netlify should auto-detect
`netlify.toml` for the build command (`npm run build`) and publish
directory (`dist`); confirm rather than retype them.

Rename the site to `tilde-luisrrv` under **Site settings → General →
Site details → Change site name** if it wasn't set at creation.

---

## 7. Set Netlify environment variables

**Site settings → Environment variables**, add:

```text
SUPABASE_URL        <your project URL>
SUPABASE_ANON_KEY   <your anon public key>
```

Never add the service-role key here. No page in this task's scope
reads these yet (`/log` and `/now` reads land in the next task), but
they're needed the moment that code exists, so set them now.

---

## 8. Verify RLS actually works

A policy that exists is not a policy that works — this needs proof,
not a read of the SQL.

Run the included script from your machine (not this repo's CI/CD,
nowhere committed):

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run verify:rls
```

Pass the keys as shell environment variables on that one command line,
not via a `.env` file — the service role key must never touch disk in
this repo.

It seeds one throwaway unpublished `logs` row (service role), confirms
the anon key cannot see it, confirms an anon INSERT is rejected, then
deletes what it created either way. It prints `[PASS]`/`[FAIL]` per
check and exits non-zero if anything failed.

**Send me the output.** That's what closes out Definition of done #5 —
not "the policy is in the migration file."

---

## 9. Confirm the deploy preview

Push the `task-01-scaffold` branch (already done on my end once this
is committed) and confirm Netlify built a deploy preview successfully.
Open it on desktop and at ~380px wide and check the type specimen page
renders — that's Definition of done #2.

---

## What's still deliberately not done

Per the scaffold's scope, none of this exists yet and shouldn't:
`/log`, `/log/[slug]`, `/now` pages, `/admin`, the build webhook, the
keep-alive function, `/feed.xml`, `/404`, the terminal overlay, the
first-visit script, real content, or any DNS change to `rodluis.com`
(its redirect to `lrod.dev` must stay live).

---

## 10. Wire the publishing loop (§19 step 11)

The last piece of the dynamic publishing goal (§14): right now, saving
something in `/admin` doesn't make it live — the site is fully static
and nothing rebuilds it automatically yet. This wires that up, plus
the keep-alive that stops the free Supabase project from pausing.

### 10.1 Create a Netlify build hook

**Site settings → Build & deploy → Build hooks → Add build hook.**
Name it something like `content-publish`, branch `task-03-webhook-keepalive`
for now (move it to whatever branch is live once this merges). Copy
the URL it gives you — it looks like
`https://api.netlify.com/build_hooks/<id>` and is a bearer of sorts:
anyone with it can trigger a rebuild, so treat it like a secret even
though it can't read or change any data.

### 10.2 Set it as an env var

**Site settings → Environment variables**, add:

```text
BUILD_HOOK_URL   <the build hook URL from 10.1>
```

This is what `netlify/functions/keep-alive.ts` reads. Don't put it in
`.env` or commit it anywhere — Netlify env vars only.

### 10.3 Point Supabase's database webhooks at it

**Database → Webhooks** in the Supabase dashboard, one webhook per
table (two total):

- Table `logs`, events: Insert, Update, Delete → HTTP POST →
  the build hook URL from 10.1.
- Table `now`, same events, same URL.

No headers or auth needed — the build hook URL is the credential.
Both tables need their own webhook; there's no way to watch both with
one entry.

### 10.4 Confirm the keep-alive function deployed

After this branch deploys, check **Functions** in the Netlify site
dashboard for `keep-alive`, scheduled `0 0 */5 * *` (every 5 days). It
only fires on that schedule — there's no button to test it from the
dashboard, so the real test is 10.5.

### 10.5 Verify the whole loop, end to end

This is Definition of done for this step — not "the webhook exists,"
but that the loop actually runs:

1. In `/admin`, publish a log entry (check the `published` box, save).
2. Watch **Deploys** in the Netlify dashboard — a new deploy should
   start within a few seconds, triggered by the Supabase webhook.
3. Once it finishes (~30–60s), load `/log` and confirm the entry is
   actually there.
4. Do the same for a `/now` field, and confirm `/now` picks it up
   after that deploy.

If a deploy doesn't start automatically after step 1, the Supabase
webhook (10.3) is the thing to check first — the build hook itself
already works if you were able to trigger the earlier manual deploys.
