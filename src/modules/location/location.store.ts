import { create } from 'zustand'
import * as LocationService from './location.service'
import type { Coordinates } from './location.types'
import { LocationPermissionError } from './location.types'

export type LocationStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'error'

type LocationStore = {
  status: LocationStatus
  coordinates: Coordinates | null
  error: string | null
  requestLocation: () => Promise<Coordinates | null>
  clearLocation: () => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  status: 'idle',
  coordinates: null,
  error: null,

  requestLocation: async () => {
    set({ status: 'requesting', error: null })
    try {
      const coordinates = await LocationService.getCurrentCoordinates()
      set({ status: 'ready', coordinates })
      return coordinates
    } catch (err) {
      if (err instanceof LocationPermissionError) {
        set({ status: 'denied', error: err.message })
        return null
      }
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'No se ha podido obtener tu ubicación.',
      })
      return null
    }
  },

  clearLocation: () => set({ status: 'idle', coordinates: null, error: null }),
}))
