import type { FaceGuard, FaceGuardAction, FaceGuardInput, FaceGuardLevel } from './face-guard.types'

// ── Level helpers ─────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<FaceGuardLevel, number> = {
  standard: 0,
  elevated: 1,
  strong: 2,
}

function maxLevel(a: FaceGuardLevel, b: FaceGuardLevel): FaceGuardLevel {
  return LEVEL_ORDER[a] >= LEVEL_ORDER[b] ? a : b
}

function escalate(level: FaceGuardLevel): FaceGuardLevel {
  if (level === 'standard') return 'elevated'
  return 'strong'
}

// ── Copy ──────────────────────────────────────────────────────────────────────

const SUMMARIES: Record<FaceGuardLevel, string> = {
  standard: 'Bronze IQ trata el rostro con más prudencia. Considera SPF facial.',
  elevated:
    'Face Guard activo. El rostro usa un margen más conservador. Añade gorra, sombra o SPF facial.',
  strong:
    'Face Guard activo: protege cara y labios antes de seguir. El objetivo no es broncear más la cara, sino evitar sobreexposición acumulada.',
}

export const FACE_GUARD_ACTION_LABELS: Record<FaceGuardAction, string> = {
  continue_with_face_protection: 'Continúa con protección en el rostro',
  use_spf50_face: 'Usa SPF 50+ en el rostro',
  add_hat_or_shade: 'Añade gorra o busca sombra',
  reapply_facial_protection: 'Reaplica protección facial',
  avoid_direct_face_exposure: 'Evita la exposición directa en el rostro',
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Derives a face-specific protection level from existing signals.
 * Pure function — no side effects, no network calls.
 *
 * The face is treated more conservatively than the general body because
 * facial skin is thinner, more exposed, and rarely covered by clothing.
 * This is a guidance signal, not a medical diagnosis.
 *
 * Does NOT analyze skin lesions, moles, or spots.
 * Does NOT make medical claims.
 * Does NOT imply that any exposure level is safe for the face.
 */
export function buildFaceGuard(input: FaceGuardInput): FaceGuard {
  const { skinType, sunSensitivity, uvCategory, recoveryLevel, protectionReliability } = input

  const reasons: string[] = []
  let level: FaceGuardLevel = 'standard'

  // 1. UV category sets the baseline
  if (uvCategory === null) {
    reasons.push('missing_uv_data')
    // No UV data — remain at standard but note the gap
  } else if (uvCategory === 'extreme') {
    level = maxLevel(level, 'strong')
    reasons.push('extreme_uv')
  } else if (uvCategory === 'very_high' || uvCategory === 'high') {
    level = maxLevel(level, 'elevated')
    reasons.push('high_uv')
  }
  // 'low' and 'moderate' keep level at 'standard'

  // 2. Fair skin types (I–II) escalate by one step
  if (skinType === 1 || skinType === 2) {
    level = escalate(level)
    reasons.push('fair_skin_type')
  }

  // 3. Very high sensitivity escalates by one step
  if (sunSensitivity === 'very_high') {
    level = escalate(level)
    reasons.push('very_high_sensitivity')
  }

  // 4. Active recovery jumps directly to strong
  if (recoveryLevel === 'recovery_recommended' || recoveryLevel === 'avoid_direct_exposure') {
    level = 'strong'
    reasons.push('recovery_active')
  }

  // 5. Uncertain or reduced protection escalates by one step
  if (
    protectionReliability === 'unknown' ||
    protectionReliability === 'low' ||
    protectionReliability === 'reduced'
  ) {
    level = escalate(level)
    reasons.push('uncertain_protection')
  }

  // 6. Suggested action
  let suggestedAction: FaceGuardAction
  if (protectionReliability === 'reduced' && level !== 'standard') {
    suggestedAction = 'reapply_facial_protection'
  } else {
    switch (level) {
      case 'standard':
        suggestedAction = 'continue_with_face_protection'
        break
      case 'elevated':
        suggestedAction = 'use_spf50_face'
        break
      case 'strong':
        suggestedAction = 'avoid_direct_face_exposure'
        break
    }
  }

  return {
    level,
    summary: SUMMARIES[level],
    reasons,
    suggestedAction,
  }
}
