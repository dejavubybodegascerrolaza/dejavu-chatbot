import {
  MED_BY_SKIN_TYPE,
  MED_UNKNOWN,
  SAFE_MED_FRACTION,
  UV_INDEX_TO_DOSE_PER_MINUTE,
} from './sun.rules'
import type { BurnTimeInput, BurnTimeResult } from './sun.types'

/**
 * Estimates how long bare (or SPF-protected) skin can be exposed before reaching
 * the sunburn threshold, given a real UV index and Fitzpatrick skin type.
 *
 * Model: time to 1 MED = MED × SPF / (UV index × dose-per-minute).
 * When the UV index is 0 there is no erythemal risk, so times are null
 * ("no practical limit").
 *
 * This is a transparent estimate for guidance, not a medical guarantee.
 */
export function calculateBurnTime(input: BurnTimeInput): BurnTimeResult {
  const spf = normaliseSpf(input.spf)
  const uvIndex = Math.max(0, input.uvIndex)

  if (uvIndex === 0) {
    return { minutesToBurn: null, safeMinutes: null, spf }
  }

  const med = input.skinType !== null ? MED_BY_SKIN_TYPE[input.skinType] : MED_UNKNOWN
  const dosePerMinute = uvIndex * UV_INDEX_TO_DOSE_PER_MINUTE

  const minutesToBurn = Math.round((med * spf) / dosePerMinute)
  const safeMinutes = Math.round((med * spf * SAFE_MED_FRACTION) / dosePerMinute)

  return { minutesToBurn, safeMinutes, spf }
}

function normaliseSpf(spf: number | undefined): number {
  if (spf === undefined || !Number.isFinite(spf) || spf < 1) return 1
  return spf
}
