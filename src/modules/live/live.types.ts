import type { SkinType, SunSensitivity } from '../profile/profile.types'
import type { ProtectionReality } from '../protection/protection.types'
import type { FaceGuard } from '../face-guard/face-guard.types'

/** Live session status, from safe to a clear stop signal. */
export type LiveStatus = 'no_risk' | 'safe' | 'caution' | 'danger'

export type LiveSessionInput = {
  elapsedSeconds: number
  skinType: SkinType | null
  uvIndex: number
  /** SPF applied to bare skin (1 = none). */
  spf?: number
  /** Minutes between "turn over" reminders. */
  flipIntervalMinutes?: number
  /** Profile sensitivity — used to tighten protection degradation thresholds. */
  sunSensitivity?: SunSensitivity | null
}

export type LiveSessionState = {
  status: LiveStatus
  elapsedSeconds: number
  /** Conservative safe limit in minutes (null when there is no UV risk). */
  safeMinutes: number | null
  /** Sunburn threshold in minutes (null when there is no UV risk). */
  burnMinutes: number | null
  /** Seconds remaining until the safe limit, 0 once passed, null with no risk. */
  remainingSafeSeconds: number | null
  /** Progress toward the safe limit, 0–1 (capped). */
  progress: number
  /** Number of completed flip intervals. */
  flipCount: number
  /** Protection reliability and suggested next action. */
  protectionReality: ProtectionReality
  /** Face-specific guidance derived from UV and profile signals. */
  faceGuard: FaceGuard
}
