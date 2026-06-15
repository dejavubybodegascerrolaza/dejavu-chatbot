import type { UvCategory, UvPeakWindow, UvReading } from './uv.types'

/** WHO UV Index categories. */
export function classifyUv(uvIndex: number): UvCategory {
  if (uvIndex < 3) return 'low'
  if (uvIndex < 6) return 'moderate'
  if (uvIndex < 8) return 'high'
  if (uvIndex < 11) return 'very_high'
  return 'extreme'
}

/** UV index at or above which sun protection is strongly advised (WHO "high"). */
export const UV_HIGH_THRESHOLD = 6

/**
 * Computes the contiguous peak window of the day: first and last hour where the
 * UV index reaches the high threshold, plus the day's maximum reading.
 * Returns null when the day never reaches the threshold.
 */
export function computePeakWindow(hourly: UvReading[]): UvPeakWindow {
  const highHours: number[] = []
  let maxUvIndex = 0

  for (const reading of hourly) {
    if (reading.uvIndex > maxUvIndex) maxUvIndex = reading.uvIndex
    if (reading.uvIndex >= UV_HIGH_THRESHOLD) {
      highHours.push(hourOf(reading.time))
    }
  }

  const firstHour = highHours[0]
  const lastHour = highHours[highHours.length - 1]
  if (firstHour === undefined || lastHour === undefined) return null

  return {
    startHour: firstHour,
    endHour: lastHour,
    maxUvIndex: Math.round(maxUvIndex * 10) / 10,
  }
}

export function maxUvOf(hourly: UvReading[]): number {
  let max = 0
  for (const reading of hourly) {
    if (reading.uvIndex > max) max = reading.uvIndex
  }
  return Math.round(max * 10) / 10
}

function hourOf(isoTime: string): number {
  const timePart = isoTime.split('T')[1] ?? '00:00'
  const hourPart = timePart.split(':')[0] ?? '0'
  return Number.parseInt(hourPart, 10)
}
