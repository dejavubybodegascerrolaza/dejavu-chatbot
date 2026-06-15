jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}))

import { useLocationStore } from './location.store'
import * as LocationService from './location.service'
import { LocationPermissionError } from './location.types'

describe('useLocationStore', () => {
  beforeEach(() => {
    useLocationStore.setState({ status: 'idle', coordinates: null, error: null })
    jest.restoreAllMocks()
  })

  it('stores coordinates and ready status on success', async () => {
    jest
      .spyOn(LocationService, 'getCurrentCoordinates')
      .mockResolvedValue({ latitude: 1, longitude: 2 })

    const result = await useLocationStore.getState().requestLocation()
    expect(result).toEqual({ latitude: 1, longitude: 2 })

    const state = useLocationStore.getState()
    expect(state.status).toBe('ready')
    expect(state.coordinates).toEqual({ latitude: 1, longitude: 2 })
  })

  it('sets denied status when permission is refused', async () => {
    jest
      .spyOn(LocationService, 'getCurrentCoordinates')
      .mockRejectedValue(new LocationPermissionError())

    const result = await useLocationStore.getState().requestLocation()
    expect(result).toBeNull()
    expect(useLocationStore.getState().status).toBe('denied')
  })

  it('sets error status on a generic failure', async () => {
    jest.spyOn(LocationService, 'getCurrentCoordinates').mockRejectedValue(new Error('gps off'))

    const result = await useLocationStore.getState().requestLocation()
    expect(result).toBeNull()
    const state = useLocationStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('gps off')
  })

  it('clears state back to idle', () => {
    useLocationStore.setState({
      status: 'ready',
      coordinates: { latitude: 1, longitude: 2 },
      error: null,
    })
    useLocationStore.getState().clearLocation()
    expect(useLocationStore.getState().status).toBe('idle')
    expect(useLocationStore.getState().coordinates).toBeNull()
  })
})
