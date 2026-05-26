import { profileSetupSchema, profileUpdateSchema } from './profile.schema'
import type { ProfileSetupInput, ProfileUpdateInput } from './profile.schema'
import type { Profile } from './profile.types'
import * as ProfileRepository from './profile.repository'

export async function loadProfile(userId: string): Promise<Profile | null> {
  return ProfileRepository.getProfileByUserId(userId)
}

export async function updateProfileSettings(
  userId: string,
  input: ProfileUpdateInput
): Promise<Profile> {
  const validated = profileUpdateSchema.parse(input)
  return ProfileRepository.updateProfileSettings(userId, validated)
}

export async function completeOnboarding(
  userId: string,
  input: ProfileSetupInput
): Promise<Profile> {
  // Validate via Zod — throws ZodError with human messages on failure
  const validated = profileSetupSchema.parse(input)

  // Check if a profile row already exists (incomplete onboarding case)
  const existing = await ProfileRepository.getProfileByUserId(userId)

  if (existing) {
    return ProfileRepository.updateProfile(userId, validated)
  }

  return ProfileRepository.createProfile(userId, validated)
}
