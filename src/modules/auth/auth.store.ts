import { create } from 'zustand'
import type { AuthUser, AuthSessionStatus, LoginInput, RegisterInput } from './auth.types'
import * as AuthService from './auth.service'

type AuthStore = {
  status: AuthSessionStatus
  user: AuthUser | null
  error: string | null
  isSubmitting: boolean
  pendingEmailConfirmation: boolean

  initializeAuth: () => () => void
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  clearPendingEmailConfirmation: () => void
}

const FALLBACK_ERROR = 'No se ha podido completar la acción. Inténtalo de nuevo.'

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : FALLBACK_ERROR
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'loading',
  user: null,
  error: null,
  isSubmitting: false,
  pendingEmailConfirmation: false,

  initializeAuth: () => {
    // onAuthStateChange fires INITIAL_SESSION on subscription, resolving the loading state
    return AuthService.onAuthStateChange((user) => {
      set({ status: user ? 'authenticated' : 'unauthenticated', user })
    })
  },

  login: async (input) => {
    set({ isSubmitting: true, error: null })
    try {
      const user = await AuthService.signIn(input)
      set({ status: 'authenticated', user, isSubmitting: false })
    } catch (e) {
      set({ error: getErrorMessage(e), isSubmitting: false })
    }
  },

  register: async (input) => {
    set({ isSubmitting: true, error: null, pendingEmailConfirmation: false })
    try {
      const result = await AuthService.signUp(input)
      if (result.emailConfirmationRequired) {
        set({ isSubmitting: false, pendingEmailConfirmation: true })
      } else {
        set({
          status: result.user ? 'authenticated' : 'unauthenticated',
          user: result.user,
          isSubmitting: false,
        })
      }
    } catch (e) {
      set({ error: getErrorMessage(e), isSubmitting: false })
    }
  },

  logout: async () => {
    set({ isSubmitting: true })
    try {
      await AuthService.signOut()
      set({ status: 'unauthenticated', user: null, isSubmitting: false, error: null })
    } catch (e) {
      set({ error: getErrorMessage(e), isSubmitting: false })
    }
  },

  clearError: () => set({ error: null }),
  clearPendingEmailConfirmation: () => set({ pendingEmailConfirmation: false }),
}))
