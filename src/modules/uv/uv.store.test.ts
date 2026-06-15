import { useUvStore } from './uv.store'
import * as UvService from './uv.service'
import type { UvForecast } from './uv.types'

const COORDS = { latitude: 40.4, longitude: -3.7 }

const FORECAST: UvForecast = {
  coordinates: COORDS,
  current: { time: '2026-06-15T10:00', uvIndex: 6.2 },
  hourly: [{ time: '2026-06-15T10:00', uvIndex: 6.2 }],
  maxToday: 6.2,
  peakWindow: { startHour: 10, endHour: 10, maxUvIndex: 6.2 },
  fetchedAt: '2026-06-15T10:05:00.000Z',
}

describe('useUvStore', () => {
  beforeEach(() => {
    useUvStore.setState({ status: 'idle', forecast: null, error: null })
    jest.restoreAllMocks()
  })

  it('sets the forecast and ready status on success', async () => {
    jest.spyOn(UvService, 'loadUvForecast').mockResolvedValue(FORECAST)
    await useUvStore.getState().loadForecast(COORDS)
    const state = useUvStore.getState()
    expect(state.status).toBe('ready')
    expect(state.forecast).toEqual(FORECAST)
    expect(state.error).toBeNull()
  })

  it('sets an error status and message on failure', async () => {
    jest.spyOn(UvService, 'loadUvForecast').mockRejectedValue(new Error('boom'))
    await useUvStore.getState().loadForecast(COORDS)
    const state = useUvStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('boom')
    expect(state.forecast).toBeNull()
  })

  it('clears state back to idle', () => {
    useUvStore.setState({ status: 'ready', forecast: FORECAST, error: null })
    useUvStore.getState().clearUv()
    const state = useUvStore.getState()
    expect(state.status).toBe('idle')
    expect(state.forecast).toBeNull()
  })
})
