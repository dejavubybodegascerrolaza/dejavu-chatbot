import type { SkinType, SunSensitivity } from '../profile/profile.types'
import type {
  CalibrationConfidence,
  CalibrationProfile,
  CalibrationTier,
} from './calibration.types'

// ── Confidence ────────────────────────────────────────────────────────────────

function resolveConfidence(skinType: SkinType | null): CalibrationConfidence {
  // Both skin type + sensitivity are present → full calibration.
  // sunSensitivity is always set after onboarding, so this is binary:
  // skin type provided → high; skin type skipped → medium.
  return skinType !== null ? 'high' : 'medium'
}

// ── Tier ──────────────────────────────────────────────────────────────────────

function resolveTier(skinType: SkinType | null, sunSensitivity: SunSensitivity): CalibrationTier {
  // Very high sensitivity or fair skin types (I–II) warrant conservative estimates.
  if (sunSensitivity === 'very_high') return 'conservative'
  if (skinType === 1 || skinType === 2) return 'conservative'
  return 'standard'
}

// ── Summary ───────────────────────────────────────────────────────────────────

function buildSummary(confidence: CalibrationConfidence, tier: CalibrationTier): string {
  if (confidence === 'high' && tier === 'conservative') {
    return 'Calibración completa — estimaciones muy prudentes para tu perfil.'
  }
  if (confidence === 'high') {
    return 'Calibración completa — estimaciones ajustadas a tu fototipo.'
  }
  // medium confidence — skin type not provided
  return 'Calibración parcial — indicar el fototipo mejorará las estimaciones.'
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Derives a calibration profile from the user's skin type and sun sensitivity.
 * Pure function — no side effects, no network calls.
 *
 * Does NOT make medical claims.
 * Does NOT diagnose skin conditions.
 */
export function buildCalibrationProfile(profile: {
  skinType: SkinType | null
  sunSensitivity: SunSensitivity
}): CalibrationProfile {
  const confidence = resolveConfidence(profile.skinType)
  const tier = resolveTier(profile.skinType, profile.sunSensitivity)
  const missingSkinType = profile.skinType === null
  const summary = buildSummary(confidence, tier)

  return { confidence, tier, missingSkinType, summary }
}
