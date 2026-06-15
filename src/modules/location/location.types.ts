import type { Coordinates } from '@/modules/uv'

export type { Coordinates }

export type LocationPermission = 'granted' | 'denied' | 'undetermined'

/** Thrown when the user denies foreground location permission. */
export class LocationPermissionError extends Error {
  constructor(message = 'Bronze IQ necesita permiso de ubicación para obtener el índice UV.') {
    super(message)
    this.name = 'LocationPermissionError'
  }
}
