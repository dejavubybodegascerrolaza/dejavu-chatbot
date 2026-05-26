import { create } from 'zustand'
import type { DataDeletionRequest } from './privacy.types'
import * as PrivacyService from './privacy.service'

export type PrivacyStatus = 'idle' | 'submitting' | 'success' | 'error'

type PrivacyStore = {
  status: PrivacyStatus
  request: DataDeletionRequest | null
  error: string | null
  requestDeletion: (userId: string) => Promise<boolean>
  clearPrivacyState: () => void
  clearError: () => void
}

export const usePrivacyStore = create<PrivacyStore>((set, get) => ({
  status: 'idle',
  request: null,
  error: null,

  requestDeletion: async (userId) => {
    if (get().status === 'submitting') return false
    set({ status: 'submitting', error: null })
    try {
      const request = await PrivacyService.requestDataDeletion(userId)
      set({ status: 'success', request })
      return true
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error
            ? err.message
            : 'No se ha podido registrar la solicitud. Inténtalo de nuevo.',
      })
      return false
    }
  },

  clearPrivacyState: () => set({ status: 'idle', request: null, error: null }),
  clearError: () => set({ error: null }),
}))
