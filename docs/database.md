# Bronze IQ — Database

> Supabase (PostgreSQL) schema, RLS policies, and testing guide.
> Migration: `supabase/migrations/20260525000000_initial_schema.sql`

---

## Applying the migration

### On Supabase Cloud (recommended for MVP)

1. Go to **Supabase Dashboard → SQL Editor**.
2. Open `supabase/migrations/20260525000000_initial_schema.sql`.
3. Paste and run the full file.
4. Verify tables appear in **Table Editor**.

### With Supabase CLI (local dev)

```bash
supabase start          # starts local Supabase (Docker required)
supabase db reset       # applies all migrations from scratch
```

---

## Tables

### `profiles`

One row per user. `id` is the same UUID as `auth.users.id`.

| Column                   | Type        | Nullable | Default | Notes                           |
| ------------------------ | ----------- | -------- | ------- | ------------------------------- |
| `id`                     | uuid        | NO       | —       | PK, FK → auth.users             |
| `alias`                  | text        | NO       | —       | 2-30 chars                      |
| `main_goal`              | text        | NO       | —       | enum (4 values)                 |
| `sun_sensitivity`        | text        | NO       | —       | enum (4 values)                 |
| `skin_type`              | smallint    | YES      | null    | 1-6 (Fitzpatrick)               |
| `onboarding_completed`   | boolean     | NO       | false   |                                 |
| `disclaimer_accepted_at` | timestamptz | YES      | null    | required if onboarding complete |
| `created_at`             | timestamptz | NO       | now()   |                                 |
| `updated_at`             | timestamptz | NO       | now()   | auto-updated via trigger        |

**Constraints:**

- `alias` length between 2 and 30
- `main_goal` ∈ `{gradual_bronze, avoid_overexposure, track_sessions, conscious_routine}`
- `sun_sensitivity` ∈ `{low, medium, high, very_high}`
- `skin_type` is null or between 1 and 6
- If `onboarding_completed = true` then `disclaimer_accepted_at IS NOT NULL`

---

### `exposure_sessions`

Each sun exposure session logged by the user.

| Column             | Type        | Nullable | Default           | Notes                    |
| ------------------ | ----------- | -------- | ----------------- | ------------------------ |
| `id`               | uuid        | NO       | gen_random_uuid() | PK                       |
| `user_id`          | uuid        | NO       | —                 | FK → auth.users          |
| `session_date`     | date        | NO       | —                 | YYYY-MM-DD               |
| `duration_minutes` | smallint    | NO       | —                 | 1-300                    |
| `context`          | text        | NO       | —                 | enum (6 values)          |
| `uv_index_manual`  | smallint    | YES      | null              | 0-11                     |
| `protection_level` | text        | NO       | 'unknown'         | enum (5 values)          |
| `sensation_after`  | text        | NO       | —                 | enum (5 values)          |
| `notes`            | text        | YES      | null              | max 500 chars            |
| `created_at`       | timestamptz | NO       | now()             |                          |
| `updated_at`       | timestamptz | NO       | now()             | auto-updated via trigger |

**Constraints:**

- `duration_minutes` between 1 and 300
- `uv_index_manual` is null or between 0 and 11
- `notes` is null or char_length ≤ 500
- `context` ∈ `{beach, pool, urban, terrace_garden, outdoor_sport, other}`
- `protection_level` ∈ `{unknown, high, medium, none, not_sure}`
- `sensation_after` ∈ `{great, normal, warm_tight, slightly_red, burned}`

**Index:** `(user_id, session_date DESC)` — for efficient history queries.

---

### `deletion_requests`

User-initiated data deletion requests. Processed manually within 30 days.

| Column         | Type        | Nullable | Default           | Notes              |
| -------------- | ----------- | -------- | ----------------- | ------------------ |
| `id`           | uuid        | NO       | gen_random_uuid() | PK                 |
| `user_id`      | uuid        | NO       | —                 | FK → auth.users    |
| `requested_at` | timestamptz | NO       | now()             |                    |
| `status`       | text        | NO       | 'pending'         | enum               |
| `processed_at` | timestamptz | YES      | null              | set when processed |

**Constraints:**

- `status` ∈ `{pending, processed}`
- `processed_at IS NULL` when `status = 'pending'`
- `processed_at IS NOT NULL` when `status = 'processed'`

**Index:** `(user_id, requested_at DESC)`.

> The table is named `deletion_requests` (not `data_deletion_requests`) for consistency with the MVP specification.

---

## Row Level Security

RLS is **enabled on all tables** before any data is inserted.

| Table               | SELECT       | INSERT      | UPDATE         | DELETE         |
| ------------------- | ------------ | ----------- | -------------- | -------------- |
| `profiles`          | own row only | own id only | own row only   | ❌ not allowed |
| `exposure_sessions` | own rows     | own user_id | own rows       | own rows       |
| `deletion_requests` | own rows     | own user_id | ❌ not allowed | ❌ not allowed |

**All policies use `auth.uid()`** — the JWT sub claim of the authenticated user. A user cannot read, write, or delete another user's data at the database level.

**`profiles` DELETE:** Not allowed from the client. Account deletion is handled server-side by the `delete-user-data` Edge Function using `service_role` privileges.

**`deletion_requests` UPDATE/DELETE:** Not allowed from the client. Processing is manual (or via Edge Function with `service_role`).

---

## Testing RLS isolation

> **Prerequisite:** A Supabase project with the migration applied and at least two test users created via Auth.

### Option A — Supabase Studio (Table Editor)

1. Sign in to Supabase Dashboard → **Authentication → Users**.
2. Create User A (`usera@example.com`) and User B (`userb@example.com`).
3. In **SQL Editor**, sign in as User A using `auth.uid()` simulation is not directly possible in Studio — use Option B.

### Option B — SQL Editor with `set_config` (recommended)

Supabase allows simulating a JWT session in the SQL Editor:

```sql
-- Step 1: create test users via Dashboard → Auth → Users
-- Note their UUIDs, e.g.:
-- User A: 'aaaaaaaa-0000-0000-0000-000000000000'
-- User B: 'bbbbbbbb-0000-0000-0000-000000000000'

-- Step 2: insert a profile for User A (run as service_role in SQL Editor)
insert into public.profiles (id, alias, main_goal, sun_sensitivity, onboarding_completed, disclaimer_accepted_at)
values (
  'aaaaaaaa-0000-0000-0000-000000000000',
  'UserA',
  'gradual_bronze',
  'medium',
  true,
  now()
);

-- Step 3: simulate User B's session and try to read User A's profile
set local role authenticated;
set local request.jwt.claims = '{"sub": "bbbbbbbb-0000-0000-0000-000000000000"}';

select * from public.profiles;
-- Expected result: 0 rows (User B cannot see User A's profile)

select * from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000000';
-- Expected result: 0 rows (RLS blocks cross-user access)

-- Step 4: simulate User B trying to update User A's profile
update public.profiles
set alias = 'hacked'
where id = 'aaaaaaaa-0000-0000-0000-000000000000';
-- Expected result: 0 rows affected

-- Step 5: simulate User B trying to update a deletion_request's status
-- (no UPDATE policy exists, so this should fail or affect 0 rows)
update public.deletion_requests set status = 'processed' where user_id = 'aaaaaaaa-0000-0000-0000-000000000000';
-- Expected result: 0 rows affected
```

### Acceptance criteria for RLS validation

- [ ] User B query on `profiles` returns 0 rows
- [ ] User B cannot UPDATE User A's profile
- [ ] User B cannot INSERT a profile with User A's id
- [ ] User B cannot read or delete User A's `exposure_sessions`
- [ ] Client cannot UPDATE `deletion_requests.status` (no UPDATE policy)
- [ ] Client cannot DELETE from `profiles` (no DELETE policy)

This checklist is a **mandatory pre-condition** before Phase 4 (Auth UI).

---

## Security notes

- **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** is the public anon key. It is safe to include in the mobile bundle. RLS is the security boundary.
- **`SUPABASE_SERVICE_ROLE_KEY`** (service role) is **never** used in the mobile client. It is only for Edge Functions running server-side. Never add it to `.env.local` or any file committed to the repo.
- Session tokens are stored in **`expo-secure-store`** (encrypted device keychain), never in AsyncStorage.

---

## Triggers

The `set_updated_at()` function automatically updates `updated_at` on any row update.

Applied to:

- `profiles`
- `exposure_sessions`
- `tanning_plans`

Not applied to `deletion_requests` (no `updated_at` column — the row is effectively append-only from the client's perspective).

---

## Table: `tanning_plans`

Added in `20260615120000_tanning_plans.sql`. Persists the user's tanning goal so
the plan (ETA, milestones) survives app restarts. **One plan per user** —
`user_id` is `unique`, so the client upserts on conflict.

| Column          | Type        | Notes                                  |
| --------------- | ----------- | -------------------------------------- |
| `id`            | uuid PK     | `gen_random_uuid()`                    |
| `user_id`       | uuid unique | FK → `auth.users`, `on delete cascade` |
| `goal_level`    | text        | one of the 5 tan levels                |
| `current_level` | text        | starting tan, default `natural`        |
| `start_date`    | date        | default `current_date`                 |
| `created_at`    | timestamptz | default `now()`                        |
| `updated_at`    | timestamptz | maintained by `set_updated_at()`       |

RLS: SELECT / INSERT / UPDATE / DELETE restricted to `user_id = auth.uid()`.
The cascade on `auth.users` delete means account deletion removes the plan
automatically (no service_role step needed).
