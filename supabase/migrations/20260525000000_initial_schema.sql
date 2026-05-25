-- Bronze IQ — Initial Schema
-- Migration: 20260525000000_initial_schema.sql
-- Run once on a fresh Supabase project.
-- All tables enable RLS before any data is inserted.

-- ── Extensions ───────────────────────────────────────────────────────────────

-- pgcrypto provides gen_random_uuid() (pre-enabled on Supabase, included for safety)
create extension if not exists "pgcrypto";

-- ── Helpers ───────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Table: profiles ───────────────────────────────────────────────────────────
-- One row per authenticated user. id mirrors auth.users.id.

create table if not exists public.profiles (
  id                    uuid        primary key references auth.users(id) on delete cascade,
  alias                 text        not null,
  main_goal             text        not null,
  sun_sensitivity       text        not null,
  skin_type             smallint    null,
  onboarding_completed  boolean     not null default false,
  disclaimer_accepted_at timestamptz null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint profiles_alias_length
    check (char_length(alias) between 2 and 30),

  constraint profiles_main_goal_values
    check (main_goal in (
      'gradual_bronze',
      'avoid_overexposure',
      'track_sessions',
      'conscious_routine'
    )),

  constraint profiles_sun_sensitivity_values
    check (sun_sensitivity in ('low', 'medium', 'high', 'very_high')),

  constraint profiles_skin_type_range
    check (skin_type is null or skin_type between 1 and 6),

  -- If onboarding is marked complete, the disclaimer must have been accepted
  constraint profiles_onboarding_disclaimer_check
    check (onboarding_completed = false or disclaimer_accepted_at is not null)
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- No DELETE policy: account deletion is handled server-side via service_role.

-- ── Table: exposure_sessions ──────────────────────────────────────────────────
-- Each sun exposure session logged by the user.

create table if not exists public.exposure_sessions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  session_date     date        not null,
  duration_minutes smallint    not null,
  context          text        not null,
  uv_index_manual  smallint    null,
  protection_level text        not null default 'unknown',
  sensation_after  text        not null,
  notes            text        null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint exposure_sessions_duration_range
    check (duration_minutes between 1 and 300),

  constraint exposure_sessions_uv_range
    check (uv_index_manual is null or uv_index_manual between 0 and 11),

  constraint exposure_sessions_notes_length
    check (notes is null or char_length(notes) <= 500),

  constraint exposure_sessions_context_values
    check (context in (
      'beach',
      'pool',
      'urban',
      'terrace_garden',
      'outdoor_sport',
      'other'
    )),

  constraint exposure_sessions_protection_level_values
    check (protection_level in ('unknown', 'high', 'medium', 'none', 'not_sure')),

  constraint exposure_sessions_sensation_after_values
    check (sensation_after in ('great', 'normal', 'warm_tight', 'slightly_red', 'burned'))
);

create index if not exists exposure_sessions_user_date_idx
  on public.exposure_sessions (user_id, session_date desc);

create trigger exposure_sessions_updated_at
  before update on public.exposure_sessions
  for each row execute function public.set_updated_at();

alter table public.exposure_sessions enable row level security;

create policy "exposure_sessions_select_own"
  on public.exposure_sessions for select
  using (user_id = auth.uid());

create policy "exposure_sessions_insert_own"
  on public.exposure_sessions for insert
  with check (user_id = auth.uid());

create policy "exposure_sessions_update_own"
  on public.exposure_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "exposure_sessions_delete_own"
  on public.exposure_sessions for delete
  using (user_id = auth.uid());

-- ── Table: deletion_requests ──────────────────────────────────────────────────
-- User-initiated data deletion requests. Processed manually (≤ 30 days).
-- Clients can INSERT and SELECT their own rows only.
-- UPDATE and DELETE are server-side operations only (service_role).

create table if not exists public.deletion_requests (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status       text        not null default 'pending',
  processed_at timestamptz null,

  constraint deletion_requests_status_values
    check (status in ('pending', 'processed')),

  -- processed_at must be set iff status = 'processed'
  constraint deletion_requests_processed_at_consistency
    check (
      (status = 'pending'   and processed_at is null) or
      (status = 'processed' and processed_at is not null)
    )
);

create index if not exists deletion_requests_user_requested_idx
  on public.deletion_requests (user_id, requested_at desc);

alter table public.deletion_requests enable row level security;

create policy "deletion_requests_select_own"
  on public.deletion_requests for select
  using (user_id = auth.uid());

create policy "deletion_requests_insert_own"
  on public.deletion_requests for insert
  with check (user_id = auth.uid());

-- No UPDATE or DELETE policies from client.
-- Processing is done with service_role in the delete-user-data Edge Function.
