import type { Tables, Inserts, Updates } from '@/types/database.types'
import type {
  Profile,
  MainGoal,
  SunSensitivity,
  SkinType,
  AgeRange,
  BlisteringSunburns,
  TanningBedUse,
  MoleCount,
} from './profile.types'
import type { ProfileSetupInput, ProfileUpdateInput } from './profile.schema'

type ProfileRow = Tables<'profiles'>

export function mapProfileRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    alias: row.alias,
    mainGoal: row.main_goal as MainGoal,
    sunSensitivity: row.sun_sensitivity as SunSensitivity,
    skinType: row.skin_type !== null ? (row.skin_type as SkinType) : null,
    onboardingCompleted: row.onboarding_completed,
    disclaimerAcceptedAt: row.disclaimer_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ageRange: (row.age_range as AgeRange | null) ?? null,
    blisteringSunburns: (row.blistering_sunburns as BlisteringSunburns | null) ?? null,
    tanningBedUse: (row.tanning_bed_use as TanningBedUse | null) ?? null,
    moleCount: (row.mole_count as MoleCount | null) ?? null,
  }
}

export function mapSetupInputToInsert(
  userId: string,
  input: ProfileSetupInput
): Inserts<'profiles'> {
  return {
    id: userId,
    alias: input.alias,
    main_goal: input.mainGoal,
    sun_sensitivity: input.sunSensitivity,
    skin_type: input.skinType ?? null,
    onboarding_completed: true,
    disclaimer_accepted_at: input.disclaimerAcceptedAt,
    age_range: input.ageRange ?? null,
    blistering_sunburns: input.blisteringSunburns ?? null,
    tanning_bed_use: input.tanningBedUse ?? null,
    mole_count: input.moleCount ?? null,
  }
}

export function mapSetupInputToUpdate(input: ProfileSetupInput): Updates<'profiles'> {
  return {
    alias: input.alias,
    main_goal: input.mainGoal,
    sun_sensitivity: input.sunSensitivity,
    skin_type: input.skinType ?? null,
    onboarding_completed: true,
    disclaimer_accepted_at: input.disclaimerAcceptedAt,
    age_range: input.ageRange ?? null,
    blistering_sunburns: input.blisteringSunburns ?? null,
    tanning_bed_use: input.tanningBedUse ?? null,
    mole_count: input.moleCount ?? null,
  }
}

export function mapUpdateInputToUpdate(input: ProfileUpdateInput): Updates<'profiles'> {
  const update: Updates<'profiles'> = {}
  if (input.alias !== undefined) update.alias = input.alias
  if (input.mainGoal !== undefined) update.main_goal = input.mainGoal
  if (input.sunSensitivity !== undefined) update.sun_sensitivity = input.sunSensitivity
  if ('skinType' in input) update.skin_type = input.skinType ?? null
  if ('ageRange' in input) update.age_range = input.ageRange ?? null
  if ('blisteringSunburns' in input) update.blistering_sunburns = input.blisteringSunburns ?? null
  if ('tanningBedUse' in input) update.tanning_bed_use = input.tanningBedUse ?? null
  if ('moleCount' in input) update.mole_count = input.moleCount ?? null
  return update
}
