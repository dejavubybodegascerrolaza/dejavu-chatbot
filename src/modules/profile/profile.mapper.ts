import type { Tables, Inserts, Updates } from '@/types/database.types'
import type { Profile, MainGoal, SunSensitivity, SkinType } from './profile.types'
import type { ProfileSetupInput } from './profile.schema'

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
  }
}
