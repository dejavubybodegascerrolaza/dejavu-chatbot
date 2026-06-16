import { spfToProtectionLevel } from '../protection/protection.engine'
import { protectionLevelSchema } from './session.schema'
import type { ProtectionLevel } from './session.types'

/** Maximum duration the session form accepts, in minutes. */
const MAX_DURATION_MINUTES = 300

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
}

export type LiveSessionPrefillInput = {
  /** Actual elapsed seconds from the live session timer. */
  elapsedSeconds: number
  /** SPF preset selected during the live session (1 = none). */
  spf: number
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
  return params
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? null
  return null
}
