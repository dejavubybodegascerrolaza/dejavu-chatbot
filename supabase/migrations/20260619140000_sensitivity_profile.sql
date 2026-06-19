-- Bronze IQ — Sensitivity & care profile
-- Migration: 20260619140000_sensitivity_profile.sql
--
-- Adds an OPTIONAL, evidence-based "sensitivity profile" layer on top of the
-- Fitzpatrick phototype. These phenotypic/behavioural factors are recognised
-- modifiers of how a skin responds to sun exposure (see
-- docs/science/fitzpatrick-assessment.md and sensitivity sources). They do NOT
-- change the Fitzpatrick score; they let the app be more prudent and prompt a
-- professional check-up when relevant.
--
-- All columns are NULLABLE: the layer is skippable, and existing rows stay valid.

alter table public.profiles
  add column if not exists age_range          text null,
  add column if not exists blistering_sunburns text null,
  add column if not exists tanning_bed_use     text null,
  add column if not exists mole_count          text null;

-- Value constraints (added separately so re-runs are safe).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_age_range_values'
  ) then
    alter table public.profiles
      add constraint profiles_age_range_values
      check (age_range is null or age_range in ('18_25', '26_35', '36_50', '51_plus'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_blistering_sunburns_values'
  ) then
    alter table public.profiles
      add constraint profiles_blistering_sunburns_values
      check (blistering_sunburns is null or blistering_sunburns in ('none', 'adult', 'childhood'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_tanning_bed_use_values'
  ) then
    alter table public.profiles
      add constraint profiles_tanning_bed_use_values
      check (tanning_bed_use is null or tanning_bed_use in ('never', 'past', 'regular'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_mole_count_values'
  ) then
    alter table public.profiles
      add constraint profiles_mole_count_values
      check (mole_count is null or mole_count in ('few', 'some', 'many'));
  end if;
end $$;
