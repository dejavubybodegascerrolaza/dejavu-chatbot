import * as Location from 'expo-location'
import type { Coordinates } from './location.types'
import { LocationPermissionError } from './location.types'

/**
 * Requests foreground location permission and returns the device coordinates.
 * Throws LocationPermissionError if permission is denied, or a generic Error if
 * the position cannot be obtained.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new LocationPermissionError()
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch {
    throw new Error('No se ha podido obtener tu ubicación. Inténtalo de nuevo.')
  }
}
