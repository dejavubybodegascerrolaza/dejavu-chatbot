import { fetchUvForecast } from './uv.repository'
import type { Coordinates, UvForecast } from './uv.types'

export async function loadUvForecast(coords: Coordinates): Promise<UvForecast> {
  return fetchUvForecast(coords)
}
