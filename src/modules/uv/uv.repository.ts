import { mapOpenMeteoToForecast } from './uv.mapper'
import { openMeteoResponseSchema } from './uv.schema'
import type { Coordinates, UvForecast } from './uv.types'
import { captureError, getAppContext } from '@/lib/observability'

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

/**
 * Fetches the current and hourly UV index for a location from Open-Meteo.
 * Open-Meteo is free and key-less for non-commercial use. Throws a
 * Spanish, user-facing error on any failure (network, HTTP, or schema).
 */
export async function fetchUvForecast(coords: Coordinates): Promise<UvForecast> {
  const url =
    `${OPEN_METEO_URL}?latitude=${coords.latitude}&longitude=${coords.longitude}` +
    `&current=uv_index&hourly=uv_index&timezone=auto&forecast_days=1`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('No se ha podido conectar con el servicio de índice UV.')
  }

  if (!response.ok) {
    throw new Error('El servicio de índice UV no está disponible ahora mismo.')
  }

  const json: unknown = await response.json()
  const parsed = openMeteoResponseSchema.safeParse(json)
  if (!parsed.success) {
    // Schema mismatch means the Open-Meteo API changed its response format —
    // not a user error. Capture so we know to update the schema/mapper.
    captureError(new Error('UV forecast schema mismatch'), {
      module: 'uv.repository',
      operation: 'fetchUvForecast',
      ...getAppContext(),
    })
    throw new Error('La respuesta del servicio de índice UV no es válida.')
  }

  return mapOpenMeteoToForecast(parsed.data, coords, new Date().toISOString())
}
