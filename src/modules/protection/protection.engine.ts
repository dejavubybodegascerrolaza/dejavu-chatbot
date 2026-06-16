import type { ProtectionLevel } from '../sessions/session.types'
import type { UvCategory } from '../uv/uv.types'
import type {
  ProtectionAction,
  ProtectionReality,
  ProtectionReliability,
  ProtectionRealityInput,
} from './protection.types'

// ── Reapplication thresholds ──────────────────────────────────────────────────

// Conservative thresholds: shorter than standard 2-hour guidance because we
// cannot account for water, sweat, or towel events that accelerate degradation.
const REAPPLY_MINUTES: Record<'high' | 'medium', { standard: number; very_high: number }> = {
  high: { standard: 90, very_high: 60 },
  medium: { standard: 60, very_high: 40 },
}

// ── Explanation copy ──────────────────────────────────────────────────────────

const EXPLANATION: Record<ProtectionReliability, string> = {
  unknown:
    'Protección no confirmada. Bronze IQ reduce el margen estimado cuando la protección es incierta.',
  low: 'Sin protección registrada. La exposición acumula carga más rápido sin protector solar.',
  medium:
    'Protección media registrada. Tu SPF ayuda, pero no convierte la exposición en ilimitada.',
  high: 'Protección alta registrada. Tiempo estimado con protección aplicada.',
  reduced:
    'Tu protección puede haber perdido eficacia. Si te has bañado o secado con toalla, reaplica antes de seguir.',
}

// ── Action labels (exported for UI use) ──────────────────────────────────────

export const PROTECTION_ACTION_LABELS: Record<ProtectionAction, string> = {
  apply_protection: 'Aplicar protección',
  reapply_protection: 'Reaplica protección',
  keep_session_short: 'Mantén la sesión corta',
  pause_direct_exposure: 'Pausa la exposición directa',
  continue_conservatively: 'Continúa con prudencia',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps a numeric SPF value (from the live session selector) to a categorical
 * ProtectionLevel. Used as a bridge when no explicit ProtectionLevel is provided.
 */
export function spfToProtectionLevel(spf: number | undefined): ProtectionLevel {
  if (spf === undefined || spf <= 1) return 'none'
  if (spf < 40) return 'medium'
  return 'high'
}

function isHighUv(uvCategory: UvCategory | null | undefined): boolean {
  return uvCategory === 'very_high' || uvCategory === 'extreme'
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Derives a protection reliability assessment from available signals.
 * Pure function — no side effects, no network calls.
 *
 * SPF degrades with time; without water/sweat/towel data we use elapsed
 * session time as a conservative proxy. When information is missing, the
 * conservative interpretation is always chosen.
 *
 * Does NOT make medical claims.
 * Does NOT imply SPF makes exposure safe or unlimited.
 */
export function buildProtectionReality(input: ProtectionRealityInput): ProtectionReality {
  const { protectionLevel, elapsedMinutes, uvCategory, sunSensitivity } = input
  const isVeryHighSensitivity = sunSensitivity === 'very_high'

  // 1. Base reliability from protection level
  let baseReliability: ProtectionReliability
  switch (protectionLevel) {
    case 'high':
      baseReliability = 'high'
      break
    case 'medium':
      baseReliability = 'medium'
      break
    case 'none':
      baseReliability = 'low'
      break
    case 'unknown':
    case 'not_sure':
    default:
      baseReliability = 'unknown'
  }

  // 2. Time-based degradation for applied protection
  let reliability: ProtectionReliability = baseReliability
  let reapplyWarning = false

  if (baseReliability === 'high') {
    const threshold = isVeryHighSensitivity
      ? REAPPLY_MINUTES.high.very_high
      : REAPPLY_MINUTES.high.standard
    if (elapsedMinutes >= threshold) {
      reliability = 'reduced'
      reapplyWarning = true
    }
  } else if (baseReliability === 'medium') {
    const threshold = isVeryHighSensitivity
      ? REAPPLY_MINUTES.medium.very_high
      : REAPPLY_MINUTES.medium.standard
    if (elapsedMinutes >= threshold) {
      reliability = 'reduced'
      reapplyWarning = true
    }
  }
  // 'low' and 'unknown' do not degrade further — they're already at the floor.

  // 3. Determine suggested action
  let suggestedAction: ProtectionAction
  if (reapplyWarning) {
    suggestedAction = 'reapply_protection'
  } else {
    switch (reliability) {
      case 'unknown':
        suggestedAction = 'apply_protection'
        break
      case 'low':
        suggestedAction = 'keep_session_short'
        break
      case 'medium':
      case 'high':
        suggestedAction = 'continue_conservatively'
        break
      default:
        suggestedAction = 'continue_conservatively'
    }
  }

  // 4. UV amplification: high UV + uncertain/low protection → stronger warning
  if (isHighUv(uvCategory) && (reliability === 'unknown' || reliability === 'low')) {
    suggestedAction = 'pause_direct_exposure'
  }

  return {
    reliability,
    explanation: EXPLANATION[reliability],
    suggestedAction,
    reapplyWarning,
  }
}
