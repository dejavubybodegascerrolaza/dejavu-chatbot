jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}))

import * as Location from 'expo-location'
import { getCurrentCoordinates } from './location.service'
import { LocationPermissionError } from './location.types'

const mockedRequest = Location.requestForegroundPermissionsAsync as jest.Mock
const mockedPosition = Location.getCurrentPositionAsync as jest.Mock

describe('getCurrentCoordinates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns coordinates when permission is granted', async () => {
    mockedRequest.mockResolvedValue({ status: 'granted' })
    mockedPosition.mockResolvedValue({ coords: { latitude: 40.4, longitude: -3.7 } })

    const coords = await getCurrentCoordinates()
    expect(coords).toEqual({ latitude: 40.4, longitude: -3.7 })
  })

  it('throws LocationPermissionError when permission is denied', async () => {
    mockedRequest.mockResolvedValue({ status: 'denied' })
    await expect(getCurrentCoordinates()).rejects.toBeInstanceOf(LocationPermissionError)
    expect(mockedPosition).not.toHaveBeenCalled()
  })

  it('throws a generic error when the position cannot be read', async () => {
    mockedRequest.mockResolvedValue({ status: 'granted' })
    mockedPosition.mockRejectedValue(new Error('gps off'))
    await expect(getCurrentCoordinates()).rejects.toThrow('No se ha podido obtener tu ubicación')
  })
})
