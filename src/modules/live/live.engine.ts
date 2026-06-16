import { calculateBurnTime } from '../sun/sun.burn-time'
import { buildProtectionReality, spfToProtectionLevel } from '../protection/protection.engine'
import { buildFaceGuard } from '../face-guard/face-guard.engine'
import { classifyUv } from '../uv/uv.rules'
import { DEFAULT_FLIP_INTERVAL_MINUTES } from './live.rules'
import type { ProtectionReality } from '../protection/protection.types'
import type { FaceGuard } from '../face-guard/face-guard.types'
import type { LiveSessionInput, LiveSessionState, LiveStatus } from './live.types'

// ── Sentinels ─────────────────────────────────────────────────────────────────

// When UV is zero there is no erythemal risk; protection reality is moot.
const NO_RISK_PROTECTION: ProtectionReality = {
  reliability: 'high',
  explanation: '',
  suggestedAction: 'continue_conservatively',
  reapplyWarning: false,
}

const NO_RISK_FACE_GUARD: FaceGuard = {
  level: 'standard',
  summary: '',
  reasons: [],
  suggestedAction: 'continue_with_face_protection',
}

/**
 * Pure state of a live tanning session at a given elapsed time. Drives the
 * real-time countdown and the safety/flip alerts. Holds no timer — the screen
 * ticks elapsed seconds and calls this each tick, so it stays fully testable.
 *
 * Safety first: the primary signal is reaching the conservative safe dose
 * ('caution'); 'danger' marks the sunburn threshold. Guidance, not a guarantee.
 */
export function computeLiveSessionState(input: LiveSessionInput): LiveSessionState {
  const elapsedSeconds = Math.max(0, Math.floor(input.elapsedSeconds))
  const elapsedMinutes = elapsedSeconds / 60
  const flipInterval = input.flipIntervalMinutes ?? DEFAULT_FLIP_INTERVAL_MINUTES
  const flipCount = flipInterval > 0 ? Math.floor(elapsedMinutes / flipInterval) : 0

  const { safeMinutes, minutesToBurn } = calculateBurnTime({
    skinType: input.skinType,
    uvIndex: input.uvIndex,
    ...(input.spf !== undefined ? { spf: input.spf } : {}),
  })

  // No UV (night/indoor): no erythemal risk, no countdown, no alerts.
  if (safeMinutes === null || minutesToBurn === null) {
    return {
      status: 'no_risk',
      elapsedSeconds,
      safeMinutes: null,
      burnMinutes: null,
      remainingSafeSeconds: null,
      progress: 0,
      flipCount,
      protectionReality: NO_RISK_PROTECTION,
      faceGuard: NO_RISK_FACE_GUARD,
    }
  }

  const remainingSafeSeconds = Math.max(0, Math.round(safeMinutes * 60 - elapsedSeconds))
  const progress = Math.min(elapsedMinutes / safeMinutes, 1)

  let status: LiveStatus = 'safe'
  if (elapsedMinutes >= minutesToBurn) {
    status = 'danger'
  } else if (elapsedMinutes >= safeMinutes) {
    status = 'caution'
  }

  // Protection reality — derived from SPF preset and elapsed time.
  const uvCategory = classifyUv(input.uvIndex)
  const protectionLevel = spfToProtectionLevel(input.spf)
  const protectionReality = buildProtectionReality({
    protectionLevel,
    elapsedMinutes,
    uvCategory,
    sunSensitivity: input.sunSensitivity ?? null,
  })

  // Face Guard — derived from UV, profile signals, and current protection reliability.
  const faceGuard = buildFaceGuard({
    skinType: input.skinType,
    sunSensitivity: input.sunSensitivity ?? 'medium',
    uvCategory,
    protectionReliability: protectionReality.reliability,
  })

  return {
    status,
    elapsedSeconds,
    safeMinutes,
    burnMinutes: minutesToBurn,
    remainingSafeSeconds,
    progress,
    flipCount,
    protectionReality,
    faceGuard,
  }
}
