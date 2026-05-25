import { create } from 'zustand'
import type { Profile } from './profile.types'
import type { ProfileSetupInput } from './profile.schema'
import * as ProfileService from './profile.service'

export type ProfileStatus = 'idle' | 'loading' | 'missing' | 'ready' | 'error'

type ProfileStore = {
  status: ProfileStatus
  profile: Profile | null
  error: string | null
  isSubmitting: boolean

  loadProfile: (userId: string) => Promise<void>
  completeOnboarding: (userId: string, input: ProfileSetupInput) => Promise<void>
  clearProfile: () => void
  clearError: () => void
}

const FALLBACK_ERROR = 'No se ha podido completar la acción. Inténtalo de nuevo.'

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : FALLBACK_ERROR
}

export const useProfileStore = create<ProfileStore>((set) => ({
  status: 'idle',
  profile: null,
  error: null,
  isSubmitting: false,

  loadProfile: async (userId) => {
    set({ status: 'loading', error: null })
    try {
      const profile = await ProfileService.loadProfile(userId)
      if (!profile || !profile.onboardingCompleted) {
        // null or incomplete profile → needs onboarding
        set({ status: 'missing', profile })
      } else {
        set({ status: 'ready', profile })
      }
    } catch (e) {
      set({ status: 'error', error: getErrorMessage(e) })
    }
  },

  completeOnboarding: async (userId, input) => {
    set({ isSubmitting: true, error: null })
    try {
      const profile = await ProfileService.completeOnboarding(userId, input)
      set({ status: 'ready', profile, isSubmitting: false })
    } catch (e) {
      set({ error: getErrorMessage(e), isSubmitting: false })
    }
  },

  clearProfile: () => set({ status: 'idle', profile: null, error: null, isSubmitting: false }),
  clearError: () => set({ error: null }),
}))
