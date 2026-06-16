import type { ProtectionLevel } from '../sessions/session.types'
import type { SunSensitivity } from '../profile/profile.types'
import type { UvCategory } from '../uv/uv.types'

export type ProtectionReliability = 'unknown' | 'low' | 'medium' | 'high' | 'reduced'

export type ProtectionAction =
  | 'apply_protection'
  | 'reapply_protection'
  | 'keep_session_short'
  | 'pause_direct_exposure'
  | 'continue_conservatively'

export type ProtectionReality = {
  reliability: ProtectionReliability
  /** Short user-facing explanation. Empty string when there is nothing meaningful to show. */
  explanation: string
  suggestedAction: ProtectionAction
  /** True when elapsed time suggests protection may have degraded and reapplication is warranted. */
  reapplyWarning: boolean
}

export type ProtectionRealityInput = {
  protectionLevel: ProtectionLevel
  /** Minutes elapsed since the session started (proxy for time since application). */
  elapsedMinutes: number
  uvCategory?: UvCategory | null
  sunSensitivity?: SunSensitivity | null
}
