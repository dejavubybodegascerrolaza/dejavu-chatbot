import { classifyUv } from './uv.rules'
import type { UvCategory, UvPeakWindow, UvReading } from './uv.types'

export type SolarWindowStatus =
  | 'avoid_peak' //        Currently within the high-UV peak window
  | 'better_later' //      UV is elevated now but a calmer hour exists later today
  | 'conservative_now' //  Already at the calmest point of the day; nothing better ahead
  | 'insufficient_data' // No hourly forecast available to reason about

export type SolarWindow = {
  status: SolarWindowStatus
  /** The calmer hour (0-23) ahead, when status is avoid_peak or better_later. */
  conservativeHour: number | null
  /** User-facing note. Empty string when status is insufficient_data. */
  note: string
}

/**
 * Derives a conservative solar window summary from today's hourly UV forecast.
 *
 * Pure function — no side effects. Safe to call in useMemo.
 * Does NOT use the words "safe / seguro / sin riesgo / garantizado" in its copy.
 */
export function buildSolarWindow(input: {
  hourly: UvReading[]
  currentHour: number
  peakWindow: UvPeakWindow
}): SolarWindow {
  const { hourly, currentHour, peakWindow } = input

  if (hourly.length === 0) {
    return { status: 'insufficient_data', conservativeHour: null, note: '' }
  }

  // Are we currently inside the high-UV peak window?
  if (
    peakWindow !== null &&
    currentHour >= peakWindow.startHour &&
    currentHour <= peakWindow.endHour
  ) {
    const afterPeak = peakWindow.endHour + 1
    const note = `UV en pico ahora. La intensidad empieza a bajar a partir de las ${pad(afterPeak)}:00 h.`
    return { status: 'avoid_peak', conservativeHour: afterPeak, note }
  }

  // Find UV for the current hour (closest reading wins when there's no exact match).
  const currentReading = findClosestReading(hourly, currentHour)
  const currentUv = currentReading?.uvIndex ?? null

  // Find readings that are strictly later today.
  const futureReadings = hourly.filter((r) => hourOf(r.time) > currentHour)

  if (futureReadings.length === 0 || currentUv === null) {
    return {
      status: 'conservative_now',
      conservativeHour: null,
      note: 'El índice UV de tu zona está en su punto más tranquilo del día.',
    }
  }

  // Find the future reading with the lowest UV index.
  let bestFuture: UvReading | null = null
  for (const r of futureReadings) {
    if (bestFuture === null || r.uvIndex < bestFuture.uvIndex) {
      bestFuture = r
    }
  }

  if (bestFuture === null) {
    return {
      status: 'conservative_now',
      conservativeHour: null,
      note: 'El índice UV de tu zona está en su punto más tranquilo del día.',
    }
  }

  const currentCategory = classifyUv(currentUv)
  const bestFutureCategory = classifyUv(bestFuture.uvIndex)

  // Only surface a better window when the future is in a strictly lower WHO category.
  if (categoryRank(bestFutureCategory) < categoryRank(currentCategory)) {
    const bestHour = hourOf(bestFuture.time)
    const note = `La intensidad UV baja a partir de las ${pad(bestHour)}:00 h.`
    return { status: 'better_later', conservativeHour: bestHour, note }
  }

  return {
    status: 'conservative_now',
    conservativeHour: null,
    note: 'El índice UV de tu zona está en su punto más tranquilo del día.',
  }
}

function categoryRank(cat: UvCategory): number {
  const ranks: Record<UvCategory, number> = {
    low: 0,
    moderate: 1,
    high: 2,
    very_high: 3,
    extreme: 4,
  }
  return ranks[cat]
}

function findClosestReading(hourly: UvReading[], targetHour: number): UvReading | null {
  let closest: UvReading | null = null
  let minDiff = Infinity
  for (const r of hourly) {
    const diff = Math.abs(hourOf(r.time) - targetHour)
    if (diff < minDiff) {
      minDiff = diff
      closest = r
    }
  }
  return closest
}

function hourOf(isoTime: string): number {
  const timePart = isoTime.split('T')[1] ?? '00:00'
  const hourPart = timePart.split(':')[0] ?? '0'
  return Number.parseInt(hourPart, 10)
}

function pad(hour: number): string {
  return hour < 10 ? `0${hour}` : String(hour)
}
