import type { OpenMeteoResponse } from './uv.schema'
import { computePeakWindow, maxUvOf } from './uv.rules'
import type { Coordinates, UvForecast, UvReading } from './uv.types'

/**
 * Maps a validated Open-Meteo response into the domain UvForecast, keeping only
 * the hourly readings for the same calendar day as the current reading.
 */
export function mapOpenMeteoToForecast(
  response: OpenMeteoResponse,
  requested: Coordinates,
  fetchedAt: string
): UvForecast {
  const today = response.current.time.slice(0, 10)

  const hourly: UvReading[] = []
  for (let i = 0; i < response.hourly.time.length; i++) {
    const time = response.hourly.time[i]
    const uvIndex = response.hourly.uv_index[i]
    if (time === undefined || uvIndex === undefined) continue
    if (time.slice(0, 10) !== today) continue
    hourly.push({ time, uvIndex: round1(Math.max(0, uvIndex)) })
  }

  return {
    coordinates: requested,
    current: {
      time: response.current.time,
      uvIndex: round1(Math.max(0, response.current.uv_index)),
    },
    hourly,
    maxToday: maxUvOf(hourly),
    peakWindow: computePeakWindow(hourly),
    fetchedAt,
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
