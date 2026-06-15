import { create } from 'zustand'
import * as UvService from './uv.service'
import type { Coordinates, UvForecast } from './uv.types'

export type UvStatus = 'idle' | 'loading' | 'ready' | 'error'

type UvStore = {
  status: UvStatus
  forecast: UvForecast | null
  error: string | null
  loadForecast: (coords: Coordinates) => Promise<void>
  clearUv: () => void
}

export const useUvStore = create<UvStore>((set) => ({
  status: 'idle',
  forecast: null,
  error: null,

  loadForecast: async (coords) => {
    set({ status: 'loading', error: null })
    try {
      const forecast = await UvService.loadUvForecast(coords)
      set({ status: 'ready', forecast })
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error
            ? err.message
            : 'No se ha podido obtener el índice UV. Inténtalo de nuevo.',
      })
    }
  },

  clearUv: () => set({ status: 'idle', forecast: null, error: null }),
}))
