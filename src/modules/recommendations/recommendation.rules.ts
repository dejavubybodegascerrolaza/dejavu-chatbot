import type { SunSensitivity, SkinType } from '../profile/profile.types'
import type { ExposureContext, ProtectionLevel } from '../sessions/session.types'
import type { RecommendationLevel } from './recommendation.types'

export function getUvFactor(uvIndex: number | null): number {
  if (uvIndex === null) return 1.1
  if (uvIndex <= 2) return 0.7
  if (uvIndex <= 5) return 1.0
  if (uvIndex <= 7) return 1.3
  if (uvIndex <= 10) return 1.7
  return 2.0
}

export const SENSITIVITY_FACTOR: Record<SunSensitivity, number> = {
  low: 0.85,
  medium: 1.0,
  high: 1.25,
  very_high: 1.5,
}

export const SKIN_TYPE_FACTOR: Record<SkinType, number> = {
  1: 1.6,
  2: 1.35,
  3: 1.15,
  4: 1.0,
  5: 0.9,
  6: 0.85,
}

export const SKIN_TYPE_FACTOR_UNKNOWN = 1.2

export const CONTEXT_FACTOR: Record<ExposureContext, number> = {
  beach: 1.25,
  pool: 1.2,
  urban: 0.8,
  terrace_garden: 1.0,
  outdoor_sport: 1.25,
  other: 1.0,
}

export const PROTECTION_FACTOR: Record<ProtectionLevel, number> = {
  high: 0.85,
  medium: 1.0,
  unknown: 1.1,
  not_sure: 1.15,
  none: 1.35,
}

export const WEEKLY_LOAD_THRESHOLDS: Array<{ max: number; level: RecommendationLevel }> = [
  { max: 50, level: 'low' },
  { max: 110, level: 'moderate' },
  { max: 180, level: 'caution' },
  { max: 260, level: 'high_caution' },
]

export const FORBIDDEN_WORDS = [
  'seguro',
  'sin riesgo',
  'garantizado',
  'garantiza',
  'perfecto',
  'puedes tomar el sol sin problema',
]

export const DISCLAIMER =
  'Orientación general, no médica. Bronze IQ no garantiza seguridad frente a la exposición solar.'
