# E2E Execution Runbook & Go/No-Go Checklist

The single "do this in order" guide for running the Bronze IQ staging E2E chain.
Everything you need is here or linked — you should not need any chat history or
to hunt across docs.

- **Setup details** (project, migrations, build): [`e2e-staging-setup.md`](./e2e-staging-setup.md)
- **Seed SQL** (profile, active plan, cleanup): [`e2e-staging-seed.md`](./e2e-staging-seed.md)
- **What each flow covers / testID table**: [`e2e-critical-flows.md`](./e2e-critical-flows.md)

The canonical chain is **three** flows, run in order:

1. `.maestro/01-smoke-login-to-home.yaml`
2. `.maestro/02-core-session-loop.yaml`
3. `.maestro/03-recovery-loop.yaml`

> The other `.maestro/*-smoke-*.yaml` files are older standalone stubs. They are
> not part of this runbook's chain — ignore them here.

---

## Quick command block (one page)

Run from the repo root, against a **staging** build on a running simulator.
Replace the email/password with your staging test credentials.

```bash
# 0. Confirm app env points at staging (reads .env.local; never prints secrets)
npm run e2e:check

# 1. Baseline — login → Home
maestro test .maestro/01-smoke-login-to-home.yaml \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!

# 2. Core session loop — live session → log → save → history
maestro test .maestro/02-core-session-loop.yaml \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!

# 3. Recovery loop — slightly_red → recovery card → paused plan
#    (seed an active plan first — see Seed procedure below)
maestro test .maestro/03-recovery-loop.yaml \
  -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
  -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!
```

To capture a JUnit report for any flow, append:
`--format junit --output maestro-report.xml`

---

## 1. Purpose

This runbook validates the three highest-value product loops on a real
simulator against a **staging** backend:

- **Auth + routing** — a confirmed, onboarded user logs in and lands on Home.
- **Core session loop** — start a live session, log it, save it, see it in History.
- **Recovery loop** — a negative skin response (`slightly_red`) surfaces
  conservative recovery guidance and pauses an active plan.

**Why staging is mandatory:** these flows create and delete real rows (sessions,
profile, plan). That must never touch production data. A staging Supabase project
isolates all test writes.

---

## 2. Preconditions

All must be true before you run anything:

- [ ] Staging Supabase project exists (separate from production).
- [ ] Migrations applied: `profiles`, `exposure_sessions`, `tanning_plans`,
      `deletion_requests` exist.
- [ ] Test auth user exists and is **confirmed**
      (Dashboard → Authentication → Add user → Auto Confirm).
- [ ] Test user **profile** seeded with `onboarding_completed = true`
      (so the auth guard routes to Home, not onboarding).
- [ ] Test user has an **active plan** (`tanning_plans` row) — required to
      exercise `plan-status-paused_recovery` in flow 03.
- [ ] Previous `exposure_sessions` cleaned if you want a zero-session start.
- [ ] App **built and running against staging** (`.env.local` = staging values).
- [ ] **Maestro installed**: `curl -Ls "https://get.maestro.mobile.dev" | bash`
      then `export PATH="$HOME/.maestro/bin:$PATH"`.

Seed steps for profile / plan / cleanup are in
[`e2e-staging-seed.md`](./e2e-staging-seed.md) — do not duplicate that SQL.

---

## 3. Production safety guardrails

Non-negotiable:

- **Never** point the app or any SQL at production Supabase.
- **Never** put `service_role` in app/client env
  (`.env.local`, `.env.example`, `.env.staging.example`, `.env.e2e.example`).
- **Never** commit secrets (`.env.staging` and `.env.e2e` are git-ignored).
- **Verify the Supabase URL belongs to staging** before each session:
  run `npm run e2e:check` and confirm the staging/test/dev indicator passes.
- **No blanket deletes** — session cleanup is always scoped
  `where user_id = (lookup by email)` (see seed doc).
- Before running seed SQL, run the production guardrail in the seed doc
  (project name + URL match + sanity user-count query).

---

## 4. Exact environment variables

### App staging env (in `.env.local`, copied from `.env.staging`)

| Variable                         | Example                                |
| -------------------------------- | -------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`       | `https://your-staging-ref.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`  | `eyJ…` (staging anon key)              |
| `EXPO_PUBLIC_APP_ENV`            | `staging`                              |
| `EXPO_PUBLIC_DISCLAIMER_VERSION` | `v1.0`                                 |

These are read by the app build and by `npm run e2e:check`.
`.env.local` is git-ignored — never commit it.

### Maestro test credentials (runtime `-e` flags only)

| Variable                  | Purpose                       |
| ------------------------- | ----------------------------- |
| `BRONZE_IQ_TEST_EMAIL`    | staging test account email    |
| `BRONZE_IQ_TEST_PASSWORD` | staging test account password |

Pass these via `-e` on the `maestro test` command (see quick block). **Never**
store them in a committed file. `.env.e2e.example` documents them for reference
only.

**What not to commit:** `.env.local`, `.env.staging`, `.env.e2e`, any real
credentials, and any `service_role` key (which has no place in this chain at all).

---

## 5. Seed procedure summary

Full SQL: [`e2e-staging-seed.md`](./e2e-staging-seed.md). Exact order:

1. **Confirm staging project** — run the production guardrail in the seed doc.
2. **Create / confirm auth user** — Dashboard → Authentication → Add user →
   Auto Confirm (if not already done).
3. **Upsert profile** — Step 1 of the seed doc (`onboarding_completed = true`).
4. **Upsert active plan** — Step 2 of the seed doc (`goal_level = 'bronze'`).
5. **Optional user-scoped cleanup** — Step 3 of the seed doc (clears the test
   user's `exposure_sessions`).
6. **Verify** — Step 4 verify query; expect `onboarding_completed = true`,
   `disclaimer_ok = true`, `goal_level = bronze`, `session_count = 0`.

---

## 6. Execution order

Run in this exact order; do not skip ahead.

1. `npm run e2e:check` — must exit ✅ before anything else.
2. `01-smoke-login-to-home.yaml` — must pass.
3. `02-core-session-loop.yaml` — must pass.
4. `03-recovery-loop.yaml` — must pass (with active plan seeded).

**Why 01 and 02 must pass before trusting 03:** flow 03 reuses the same
selectors and assumptions proven by 01 (auth, routing, Home landmarks) and 02
(session log, save, navigation). If 01 or 02 fails, a 03 failure is ambiguous —
you cannot tell whether recovery logic is broken or the shared path is. Green
01 + 02 make a 03 result trustworthy.

---

## 7. Expected outputs

**Success looks like:** each `maestro test` ends with `Flow completed
successfully` and a non-zero passing step count; no red failed steps.

What each flow proves:

| Flow | Proves                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | Staging auth works; confirmed+onboarded user routes to Home.                                                                                                    |
| 02   | Full session lifecycle: live session → log (prefilled) → save → Home ack → History shows it.                                                                    |
| 03   | A `slightly_red` session surfaces the recovery card on Home; Live Session stays accessible (de-emphasised); an active plan shows `plan-status-paused_recovery`. |

**Not proven yet (out of scope of this chain):** onboarding for brand-new users,
settings/data-deletion, location-denied resilience, the `burned` /
`avoid_direct_exposure` severe path (covered by unit tests + manual QA),
iPhone/TestFlight device behaviour, and push-notification delivery.

---

## 8. Failure evidence checklist

When any flow fails, capture **all** of the following before debugging or
reporting back:

- [ ] **Terminal output** of the failing `maestro test` (the failed step + reason).
- [ ] **Maestro screenshot/video/log** —
      `~/.maestro/tests/<timestamp>/` (screenshots subfolder on failure).
- [ ] **App console logs** — Metro terminal output (auth/network errors).
- [ ] **Supabase Auth user status** — Authentication → Users:
      does the test user exist, is it confirmed, is `last_sign_in_at` recent?
- [ ] **`exposure_sessions` count** for the test user (verify query in seed doc).
- [ ] **`profiles` row** — `onboarding_completed = true`, `disclaimer_accepted_at` set?
- [ ] **`tanning_plans` row** — exists with a `goal_level`?
- [ ] **Which env the app is using** — output of `npm run e2e:check`
      (confirms staging URL).
- [ ] **Device/simulator type** — iOS Simulator (model/OS) or Android emulator.

---

## 9. Go / No-Go criteria

### ✅ GO if all are true

- [ ] `01-smoke-login-to-home` passes.
- [ ] `02-core-session-loop` passes.
- [ ] `03-recovery-loop` passes **with an active plan**, and
      `plan-status-paused_recovery` is exercised (not just the no-plan branch).
- [ ] No production data was used (staging URL confirmed).
- [ ] No app crash or stuck state.
- [ ] No unsafe copy surfaced (no "dosis segura", "sin riesgo", "garantiza…",
      "diagnós…", "bronceado seguro", etc.).

### ⛔ NO-GO if any are true

- [ ] Login flow fails.
- [ ] A session cannot be saved.
- [ ] Recovery guidance does not appear after a `slightly_red` save.
- [ ] `plan-status-paused_recovery` cannot be exercised even with an active plan.
- [ ] Any staging/production ambiguity exists.
- [ ] Any data write hits production.
- [ ] The app crashes or gets stuck.

---

## 10. Next action after the run

**If all pass (GO):**

- Pause E2E expansion, or add one more flow (Settings / data-deletion) if desired.
- Proceed toward iPhone / TestFlight readiness
  (see `RC-2-iPhone-integration-checklist.md`).

**If any fail (NO-GO):**

- Paste the full failure evidence (Section 8) back for review.
- Start an **RC-3 Fix Pass** driven by the real E2E evidence — fix the specific
  failing path, then re-run this runbook from Section 6.
