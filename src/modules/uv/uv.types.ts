export type UvCategory = 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'

export type Coordinates = {
  latitude: number
  longitude: number
}

export type UvReading = {
  /** ISO timestamp of the reading (local to the requested location). */
  time: string
  uvIndex: number
}

/**
 * The peak UV window for the day: the range of hours during which the UV index
 * stays at or above the high threshold. Null when the day never reaches it.
 */
export type UvPeakWindow = {
  startHour: number
  endHour: number
  maxUvIndex: number
} | null

export type UvForecast = {
  coordinates: Coordinates
  current: UvReading
  hourly: UvReading[]
  maxToday: number
  peakWindow: UvPeakWindow
  /** ISO timestamp of when this forecast was fetched by the client. */
  fetchedAt: string
}
