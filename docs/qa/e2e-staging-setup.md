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
-- 1. Paste and run:
supabase/migrations/20260525000000_initial_schema.sql

-- 2. Paste and run:
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
-- Replace placeholders with your chosen test credentials
select auth.create_user(
  '{"email": "e2e@bronzeiq.test", "password": "TestPassword123!", "email_confirm": true}'::jsonb
);
```

Then complete that account's onboarding so the auth guard routes to Home (not the onboarding wizard).  
The easiest way is to seed `profiles` directly:

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

> `.env.staging` is in `.gitignore` — never commit it.

---

## Step 6 — Build and Install a Dev Build Targeting Staging

Expo reads `.env.local` by default. To use `.env.staging`, copy or symlink it temporarily:

```bash
cp .env.staging .env.local   # or: ln -sf .env.staging .env.local
```

Then start the dev server and create a dev build:

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

---

## Step 7 — Run the Baseline Flow

With the simulator running and the app installed:

```bash
maestro test .maestro/01-smoke-login-to-home.yaml \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=TestPassword123!
```

Expected output:

```
✅ launchApp
✅ assertVisible: "Crear cuenta"
✅ tapOn: welcome-login
✅ tapOn: login-email-input
✅ inputText
✅ tapOn: login-password-input
✅ inputText
✅ hideKeyboard
✅ tapOn: login-submit
✅ assertVisible: "Hola"
✅ assertVisible: home-live-session-button
Flow completed successfully
```

---

## Step 8 — Run the Full Smoke Suite (Optional)

Once the baseline passes, run all flows:

```bash
maestro test .maestro/ \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=TestPassword123!
```

See `docs/qa/e2e-critical-flows.md` for what each flow covers and known limitations.

---

## Troubleshooting

| Symptom                            | Likely cause                                             | Fix                                                      |
| ---------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Flow fails at "Crear cuenta"       | App loaded into Home (user still logged in)              | Run with `clearState: true` or sign out first            |
| Login fails silently               | Wrong Supabase URL or anon key in `.env.local`           | Double-check Step 5                                      |
| Auth guard redirects to onboarding | Profile row missing or `onboarding_completed_at` is null | Re-run Step 4 seed SQL                                   |
| `maestro: command not found`       | PATH not updated                                         | Run `export PATH="$HOME/.maestro/bin:$PATH"`             |
| Selector not found                 | testID mismatch                                          | Cross-check `docs/qa/e2e-critical-flows.md` testID table |

---

## Security Reminders

- The staging project holds **no real user data** — it exists only for tests
- `SUPABASE_SERVICE_ROLE_KEY` never goes into the mobile client or this repo
- Test credentials (email + password) in this doc are placeholders — choose your own and store them locally or in a secrets manager
- When CI is added, inject `BRONZE_IQ_TEST_EMAIL` and `BRONZE_IQ_TEST_PASSWORD` as encrypted CI secrets, never hardcoded
