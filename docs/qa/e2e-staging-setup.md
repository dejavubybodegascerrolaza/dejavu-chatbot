# E2E Staging Setup — Login → Home Baseline

This guide sets up the minimum infrastructure needed to run the RC-2Z.1 baseline Maestro flow:
**Login → Home** (`01-smoke-login-to-home.yaml`).

The goal is one reliable, repeatable flow that proves selectors and environment config work
before expanding coverage.

---

## Prerequisites

- Node.js 20 (see `.nvmrc`)
- Expo CLI: `npm install -g eas-cli` (or use `npx expo`)
- Maestro CLI (standalone, not an npm dep):
  ```bash
  curl -Ls "https://get.maestro.mobile.dev" | bash
  # Then restart your shell or:
  export PATH="$HOME/.maestro/bin:$PATH"
  maestro --version   # should print 1.x.x
  ```
- iOS Simulator (Xcode 15+) or Android Emulator (Android Studio)
- A free [Supabase](https://supabase.com) account

---

## Step 1 — Create a Staging Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it something clear, e.g. `bronze-iq-staging`
3. Choose any region; **do not reuse the production project**
4. Note the **Project URL** and **anon public key** from
   _Project → Settings → API_

---

## Step 2 — Run Migrations on the Staging Project

Go to _Project → SQL Editor_ and run the migration files in order:

```sql
-- 1. Paste and run the full contents of:
supabase/migrations/20260525000000_initial_schema.sql

-- 2. Paste and run the full contents of:
supabase/migrations/20260615120000_tanning_plans.sql
```

Alternatively, if you have the Supabase CLI installed and linked to the staging project:

```bash
supabase db push --linked
```

Verify tables exist: _Table Editor_ should show
`profiles`, `exposure_sessions`, `consent_log`, `data_deletion_requests`, `tanning_plans`.

---

## Step 3 — Disable Email Confirmation (Staging Only)

The E2E test account must be pre-confirmed so login works without an email step.

_Authentication → Providers → Email_ → turn **off** "Confirm email".
This is safe on a staging-only project; never do it on production.

---

## Step 4 — Create the E2E Test Account

In _SQL Editor_, run:

```sql
-- Creates a confirmed user directly (bypasses email flow)
-- Replace the email/password with your own staging test credentials
select auth.create_user(
  '{"email": "e2e@bronzeiq.test", "password": "YourStagingPassword!", "email_confirm": true}'::jsonb
);
```

Then complete that account's onboarding so the auth guard routes to Home (not the onboarding wizard).
Seed `profiles` directly:

```sql
-- Get the user's UUID first:
select id from auth.users where email = 'e2e@bronzeiq.test';

-- Then insert a completed profile (replace <user-uuid>):
insert into profiles (
  id,
  alias,
  fitzpatrick_type,
  age_range,
  main_goal,
  sun_sensitivity,
  consent_given_at,
  consent_version,
  onboarding_completed_at
) values (
  '<user-uuid>',
  'E2ETest',
  2,
  '26-35',
  'avoid_overexposure',
  3,
  now(),
  'v1.0',
  now()
);

insert into consent_log (user_id, event, consent_version)
values ('<user-uuid>', 'consent_given', 'v1.0');
```

---

## Step 5 — Configure the Staging Environment

```bash
cp .env.staging.example .env.staging
```

Edit `.env.staging` and fill in your staging project values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-staging-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key-here
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_DISCLAIMER_VERSION=v1.0
```

`.env.staging` is in `.gitignore` — never commit it.

Then copy it to `.env.local` so Expo picks it up:

```bash
cp .env.staging .env.local
```

Verify the app is using staging (not production) with the pre-flight check:

```bash
npm run e2e:check
```

Expected output:

```
── App env vars (.env.local → staging Supabase) ───────────────
  ✓ EXPO_PUBLIC_SUPABASE_URL (https://abcde12345…) — set
  ✓ EXPO_PUBLIC_SUPABASE_ANON_KEY (eyJhbGciOiJI…) — set

── Staging safety check ────────────────────────────────────────
  ✓ Supabase URL contains a staging/test/dev indicator — looks correct
  ...

── Result ──────────────────────────────────────────────────────
  ✅ App env is ready. Run the smoke flow as shown above.
```

Fix any `✗` or `⚠` lines before continuing. The script never prints full secret values.

---

## Step 6 — Build and Install a Dev Build Targeting Staging

Start the dev server with the staging env:

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android
```

Or use EAS Build for a shareable binary:

```bash
eas build --profile development --platform ios
```

To confirm the app is using staging during runtime, check _Settings → About_ (if present) or
verify the Supabase URL in network requests via the Expo dev tools network tab.
Alternatively, look for `EXPO_PUBLIC_APP_ENV=staging` banner if your app exposes it in a dev menu.

---

## Step 7 — Run the Baseline Flow

With the simulator running and the app installed:

```bash
maestro test .maestro/01-smoke-login-to-home.yaml \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!
```

Expected output:

```
✅ launchApp (clearState: true)
✅ waitForAnimationToEnd
✅ assertVisible: welcome-create-account
✅ tapOn: welcome-login
✅ tapOn: login-email-input
✅ inputText
✅ tapOn: login-password-input
✅ inputText
✅ hideKeyboard
✅ tapOn: login-submit
✅ waitForAnimationToEnd
✅ assertVisible: "Hola"
✅ assertVisible: home-live-session-button
Flow completed successfully
```

### How to reset app state before rerun

The flow uses `clearState: true`, so each run starts fresh — no manual reset needed.
If you are running the flow repeatedly without `clearState: true`, sign out from the app manually
or uninstall/reinstall the dev build between runs.

---

## Step 8 — Capturing Failure Evidence

When a flow fails, capture the following before reporting or debugging:

### Terminal output

The maestro CLI prints which step failed and why. Copy the full terminal output.

### JUnit report (optional)

```bash
maestro test .maestro/01-smoke-login-to-home.yaml \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword! \
  --format junit --output maestro-report.xml
```

### Screenshot on failure

Maestro automatically takes a screenshot when a step fails. Find it in:

```
~/.maestro/tests/<timestamp>/screenshots/
```

### Maestro logs

```
~/.maestro/tests/<timestamp>/
```

### Supabase auth status

In _Supabase Dashboard → Authentication → Users_, confirm the test account exists and
`last_sign_in_at` is recent. If it's null after the flow ran, Supabase auth rejected the login.

### App console logs (via Metro)

If running with `npx expo run:ios` or similar, Metro prints React Native logs to the terminal.
Look for auth errors or network failures in that output.

---

## Step 9 — Run the Full Smoke Suite (Optional)

Once the baseline passes, run all flows:

```bash
maestro test .maestro/ \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!
```

See `docs/qa/e2e-critical-flows.md` for what each flow covers and known limitations.

---

## Troubleshooting

| Symptom                                       | Likely cause                                   | Fix                                                                                            |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Flow fails at `welcome-create-account`        | App opened on Home (clearState didn't log out) | Check SecureStore; on iOS real device Keychain may persist — sign out manually first           |
| Login fails silently                          | Wrong Supabase URL or anon key in `.env.local` | Re-run `npm run e2e:check`, fix mismatches                                                     |
| Auth guard redirects to onboarding            | `onboarding_completed_at` is null              | Re-run Step 4 seed SQL                                                                         |
| `maestro: command not found`                  | PATH not updated after install                 | Run `export PATH="$HOME/.maestro/bin:$PATH"`                                                   |
| Selector not found                            | testID mismatch or element not rendered        | Cross-check `docs/qa/e2e-critical-flows.md` testID table; confirm element is visible on screen |
| `waitForAnimationToEnd` times out             | Supabase auth request slow or URL wrong        | Check network; verify staging URL is reachable                                                 |
| `npm run e2e:check` shows placeholder warning | `.env.local` still has example values          | Edit `.env.local` with real staging credentials                                                |

---

## Security Reminders

- The staging project holds **no real user data** — it exists only for tests
- `SUPABASE_SERVICE_ROLE_KEY` never goes into the mobile client or this repo
- `.env.staging` and `.env.e2e` are both in `.gitignore` — verify with `git status` before committing
- Test credentials are placeholders in this doc — choose your own and store them locally or in a secrets manager
- When CI is added, inject `BRONZE_IQ_TEST_EMAIL` and `BRONZE_IQ_TEST_PASSWORD` as encrypted CI secrets, never hardcoded
- Run `npm run e2e:check` before every E2E session to confirm staging (not production) is targeted
