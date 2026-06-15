-- Bronze IQ — Tanning plans
-- Migration: 20260615120000_tanning_plans.sql
-- Persists the user's tanning goal so the plan survives app restarts.
-- One plan per user (unique user_id) → upsert on conflict.
-- RLS enabled before any data is inserted.

-- ── Table: tanning_plans ──────────────────────────────────────────────────────

create table if not exists public.tanning_plans (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null unique references auth.users(id) on delete cascade,
  goal_level    text        not null,
  current_level text        not null default 'natural',
  start_date    date        not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint tanning_plans_goal_level_values
    check (goal_level in ('natural', 'light_golden', 'golden', 'bronze', 'deep_bronze')),

  constraint tanning_plans_current_level_values
    check (current_level in ('natural', 'light_golden', 'golden', 'bronze', 'deep_bronze'))
);

create trigger tanning_plans_updated_at
  before update on public.tanning_plans
  for each row execute function public.set_updated_at();

alter table public.tanning_plans enable row level security;

create policy "tanning_plans_select_own"
  on public.tanning_plans for select
  using (user_id = auth.uid());

create policy "tanning_plans_insert_own"
  on public.tanning_plans for insert
  with check (user_id = auth.uid());

create policy "tanning_plans_update_own"
  on public.tanning_plans for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "tanning_plans_delete_own"
  on public.tanning_plans for delete
  using (user_id = auth.uid());
