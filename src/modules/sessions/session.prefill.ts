import { spfToProtectionLevel } from '../protection/protection.engine'
import { classifyUv } from '../uv/uv.rules'
import { protectionLevelSchema } from './session.schema'
import { UV_BUCKETS } from './session.labels'
import type { ProtectionLevel } from './session.types'
import type { UvCategory } from '../uv/uv.types'

/** Maximum duration the session form accepts, in minutes. */
const MAX_DURATION_MINUTES = 300

// Derived from the shared UV_BUCKETS source so the form options and this mapping
// can never drift apart. Thresholds live only in classifyUv.
const UV_CATEGORY_TO_FORM_VALUE = Object.fromEntries(
  UV_BUCKETS.map((bucket) => [bucket.category, bucket.value])
) as Record<UvCategory, number>

const VALID_UV_FORM_VALUES = new Set<number>(UV_BUCKETS.map((bucket) => bucket.value))

/**
 * Maps a continuous live UV index to the form's bucket representative value,
 * reusing the shared WHO classifier so thresholds are never duplicated.
 */
export function uvIndexToFormValue(uvIndex: number): number {
  return UV_CATEGORY_TO_FORM_VALUE[classifyUv(uvIndex)]
}

/**
 * Values that can be safely carried from a finished live session into the
 * Session Log form. Only fields that are truly known are included.
 *
 * Skin response (sensationAfter), redness/burn/discomfort and any subjective or
 * medical signal are deliberately excluded — those must always be confirmed by
 * the user. Context is also excluded because the live session never captures it.
 */
export type SessionLogPrefill = {
  /** Rounded elapsed minutes, clamped to the form's accepted range. */
  durationMinutes?: number
  /** Protection level inferred from the SPF chosen during the live session. */
  protectionLevel?: ProtectionLevel
  /** UV index bucketed to a form option value, from the known live UV index. */
  uvIndexManual?: number
}

export type LiveSessionPrefillInput = {
  /** Actual elapsed seconds from the live session timer. */
  elapsedSeconds: number
  /** SPF preset selected during the live session (1 = none). */
  spf: number
  /** Live UV index during the session, when known. */
  uvIndex?: number | null
}

/**
 * Builds a prefill object from a finished live session. Pure — no side effects.
 *
 * Duration is rounded to the nearest minute and clamped to the form's range.
 * Very short, likely-accidental sessions (rounding to < 1 min) omit the duration
 * so the user fills it in rather than saving a misleading record.
 */
export function buildLiveSessionPrefill(input: LiveSessionPrefillInput): SessionLogPrefill {
  const prefill: SessionLogPrefill = {}

  const minutes = Math.round(Math.max(0, input.elapsedSeconds) / 60)
  if (minutes >= 1) {
    prefill.durationMinutes = Math.min(minutes, MAX_DURATION_MINUTES)
  }

  // SPF is always known in the live session (the preset selector defaults to 1).
  prefill.protectionLevel = spfToProtectionLevel(input.spf)

  // UV is bucketed to a form option when a valid (non-negative) reading is known.
  if (input.uvIndex !== undefined && input.uvIndex !== null && Number.isFinite(input.uvIndex)) {
    if (input.uvIndex >= 0) {
      prefill.uvIndexManual = uvIndexToFormValue(input.uvIndex)
    }
  }

  return prefill
}

/**
 * Parses raw navigation params (all strings) into a validated prefill. Anything
 * missing, malformed or out of range is ignored, so a bad deep link can never
 * corrupt the form. Never produces skin-response or subjective fields.
 */
export function parseSessionLogPrefillParams(
  params: Record<string, string | string[] | undefined>
): SessionLogPrefill {
  const prefill: SessionLogPrefill = {}

  const duration = firstParam(params.durationMinutes)
  if (duration !== null) {
    const n = Number.parseInt(duration, 10)
    if (Number.isInteger(n) && n >= 1 && n <= MAX_DURATION_MINUTES) {
      prefill.durationMinutes = n
    }
  }

  const protection = firstParam(params.protectionLevel)
  if (protection !== null) {
    const parsed = protectionLevelSchema.safeParse(protection)
    if (parsed.success) {
      prefill.protectionLevel = parsed.data
    }
  }

  const uv = firstParam(params.uvIndexManual)
  if (uv !== null) {
    const n = Number.parseInt(uv, 10)
    // Only accept values that map to a real form option, so a prefilled value is
    // always visible and selectable — never a hidden, unconfirmed UV reading.
    if (Number.isInteger(n) && VALID_UV_FORM_VALUES.has(n)) {
      prefill.uvIndexManual = n
    }
  }

  return prefill
}

/**
 * Serializes a prefill into a plain string param record for expo-router. Omits
 * any field that is not present, so absent values never appear as "undefined".
 */
export function toSessionLogPrefillParams(prefill: SessionLogPrefill): Record<string, string> {
  const params: Record<string, string> = {}
  if (prefill.durationMinutes !== undefined) {
    params.durationMinutes = String(prefill.durationMinutes)
  }
  if (prefill.protectionLevel !== undefined) {
    params.protectionLevel = prefill.protectionLevel
  }
  if (prefill.uvIndexManual !== undefined) {
    params.uvIndexManual = String(prefill.uvIndexManual)
  }
  return params
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? null
  return null
}
