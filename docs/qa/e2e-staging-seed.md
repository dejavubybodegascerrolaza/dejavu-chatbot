# E2E Staging Seed & State Control

Make the staging E2E test user **deterministic** so the Maestro flows run
reliably — especially the recovery → `plan-status-paused_recovery` path in
`03-recovery-loop.yaml`.

This guide is **documentation + idempotent SQL**, run from the Supabase **SQL
Editor** of your **staging** project. No seed script is committed: the SQL Editor
already runs with the privileges needed to upsert another user's rows, so the
`service_role` **key never has to appear anywhere** — not in a script, not in an
env file, not in the repo. That is the safest possible posture.

> ⚠️ **Staging only.** Every statement here writes to whatever project the SQL
> Editor is connected to. Confirm you are on the **staging** project before
> running anything (see the production guardrail below).

---

## Why this exists

- `03-recovery-loop.yaml` always validates the **Home recovery card**.
- It only validates **`plan-status-paused_recovery`** when the test user has an
  **active plan**. The recovery pause is produced by the plan engine only when
  `hasRecentOverexposure` is true **and a plan exists** (`generateTanPlan` →
  `status: 'paused_recovery'`). A `slightly_red` session dated today maps to
  `recovery_recommended` (`recovery.engine`, `days <= 2`), which sets
  `hasRecentOverexposure = true`. So: **active plan + the flow's slightly_red
  session ⇒ `plan-status-paused_recovery`.**
- Repeated flow runs append `exposure_sessions`. This guide includes a
  **user-scoped** cleanup so state stays predictable.

---

## Production guardrail (do this first)

Before running any SQL, confirm you are NOT on production:

1. The Supabase dashboard project name is your **staging** project
   (e.g. `bronze-iq-staging`), not production.
2. The project ref in the dashboard URL matches `EXPO_PUBLIC_SUPABASE_URL` in
   your local `.env.local` (the value `npm run e2e:check` reads).
3. Run this sanity query — it should return a **small** number on staging, and
   you should recognise the addresses as test accounts only:

   ```sql
   select count(*) as user_count from auth.users;
   ```

   If you see real user emails or a large count, **stop** — you are likely on
   production. Do not run the seed.

---

## Prerequisites

- Migrations applied (Step 2 of `e2e-staging-setup.md`): `profiles`,
  `exposure_sessions`, `tanning_plans` exist.
- The auth user exists and is confirmed (Step 4 of `e2e-staging-setup.md`:
  _Authentication → Users → Add user → Auto Confirm User_).

Throughout, replace `e2e@bronzeiq.test` with your test email. The email is the
**only** placeholder — every statement looks the user up by it.

---

## Step 1 — Seed profile (onboarding complete)

`profiles` columns (from `20260525000000_initial_schema.sql`): `alias`,
`main_goal`, `sun_sensitivity`, `skin_type`, `onboarding_completed` (bool),
`disclaimer_accepted_at`. A CHECK constraint requires `disclaimer_accepted_at`
to be set whenever `onboarding_completed = true`.

```sql
insert into public.profiles (
  id, alias, main_goal, sun_sensitivity, skin_type,
  onboarding_completed, disclaimer_accepted_at
)
select u.id, 'E2ETest', 'avoid_overexposure', 'medium', 2, true, now()
from auth.users u
where u.email = 'e2e@bronzeiq.test'
on conflict (id) do update set
  alias = excluded.alias,
  main_goal = excluded.main_goal,
  sun_sensitivity = excluded.sun_sensitivity,
  skin_type = excluded.skin_type,
  onboarding_completed = true,
  disclaimer_accepted_at = coalesce(public.profiles.disclaimer_accepted_at, now());
```

Valid enum values (for reference):

- `main_goal`: `gradual_bronze`, `avoid_overexposure`, `track_sessions`,
  `conscious_routine`
- `sun_sensitivity`: `low`, `medium`, `high`, `very_high`
- `skin_type`: `null` or `1`–`6`

This onboarding-complete profile makes the auth guard route the test user to
**Home** (not the onboarding wizard).

---

## Step 2 — Seed an active plan (enables paused_recovery)

`tanning_plans` has a UNIQUE `user_id`, so we upsert on conflict. Any non-null
`goal_level` makes the plan "active".

```sql
insert into public.tanning_plans (user_id, goal_level, current_level, start_date)
select u.id, 'bronze', 'natural', current_date
from auth.users u
where u.email = 'e2e@bronzeiq.test'
on conflict (user_id) do update set
  goal_level = excluded.goal_level,
  current_level = excluded.current_level,
  start_date = excluded.start_date;
```

Valid `goal_level` / `current_level` values: `natural`, `light_golden`,
`golden`, `bronze`, `deep_bronze`.

With this active plan in place, when `03-recovery-loop.yaml` saves its
`slightly_red` session, the Plan screen renders **`plan-status-paused_recovery`**
and the flow's conditional assertion fires.

---

## Step 3 — Clean previous E2E sessions (optional, user-scoped)

Run before a fresh recovery-flow run to start from zero sessions. This deletes
**only the test user's** rows — never a blanket delete.

```sql
delete from public.exposure_sessions
where user_id = (select id from auth.users where email = 'e2e@bronzeiq.test');
```

> The `where user_id = (...)` filter is mandatory. Never run
> `delete from public.exposure_sessions` without it.

---

## Step 4 — Verify the seeded state

```sql
select
  p.alias,
  p.onboarding_completed,
  (p.disclaimer_accepted_at is not null) as disclaimer_ok,
  tp.goal_level,
  count(es.id) as session_count
from auth.users u
join public.profiles p on p.id = u.id
left join public.tanning_plans tp on tp.user_id = u.id
left join public.exposure_sessions es on es.user_id = u.id
where u.email = 'e2e@bronzeiq.test'
group by p.alias, p.onboarding_completed, p.disclaimer_accepted_at, tp.goal_level;
```

Expected after Steps 1–3:

| alias   | onboarding_completed | disclaimer_ok | goal_level | session_count |
| ------- | -------------------- | ------------- | ---------- | ------------- |
| E2ETest | true                 | true          | bronze     | 0             |

---

## How to verify `plan-status-paused_recovery` in flow 03

1. Run Steps 1–3 above (active plan present, sessions cleared).
2. Build/point the app at staging and run the flow:

   ```bash
   npm run e2e:check
   maestro test .maestro/03-recovery-loop.yaml \
     -e BRONZE_IQ_TEST_EMAIL=e2e@bronzeiq.test \
     -e BRONZE_IQ_TEST_PASSWORD=YourStagingPassword!
   ```

3. The flow saves a `slightly_red` session, then opens Plan. With the active
   plan seeded, the conditional `runFlow` asserting
   `id: plan-status-paused_recovery` will execute and pass.
4. Confirm in the SQL Editor afterwards:

   ```sql
   select session_date, sensation_after
   from public.exposure_sessions
   where user_id = (select id from auth.users where email = 'e2e@bronzeiq.test')
   order by created_at desc
   limit 3;
   ```

   You should see today's `slightly_red` row.

To re-run cleanly, repeat Step 3 (clean) then the flow.

---

## Evidence to capture after seed + flows

- The **verify query** output (Step 4) before the flow run.
- Maestro terminal output for `03-recovery-loop.yaml`.
- On-failure screenshot under `~/.maestro/tests/<timestamp>/screenshots/`.
- The post-run `exposure_sessions` query showing the `slightly_red` row.
- If `plan-status-paused_recovery` did not appear: re-check that
  `tanning_plans` has a row for the user (Step 2) and that the `slightly_red`
  session date is today.

---

## Security notes

- **No `service_role` key anywhere.** The SQL Editor runs with elevated
  privileges already; that is sufficient and avoids putting a powerful key into
  a script or env file.
- **No seed script committed.** A script would have to handle `service_role` and
  user creation/deletion, enlarging the blast radius and review burden. The
  idempotent SQL here achieves the same deterministic state with zero
  secret-handling code in the repo. This follows the "if safety is uncertain,
  choose documentation only" rule.
- **No client exposure.** `service_role` must never appear in
  `.env.example`, `.env.staging.example`, `.env.e2e.example`, or anywhere the
  mobile client reads. It does not appear in any of them.
- **Staging only.** Re-confirm the production guardrail before every seed.
- **User-scoped deletes only.** The cleanup filters by the test user's id.
