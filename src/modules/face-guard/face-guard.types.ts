import type { SkinType, SunSensitivity } from '../profile/profile.types'
import type { UvCategory } from '../uv/uv.types'
import type { RecoveryLevel } from '../recovery/recovery.types'
import type { ProtectionReliability } from '../protection/protection.types'

/** How much extra caution the face deserves given current signals. */
export type FaceGuardLevel = 'standard' | 'elevated' | 'strong'

export type FaceGuardAction =
  | 'continue_with_face_protection'
  | 'use_spf50_face'
  | 'add_hat_or_shade'
  | 'reapply_facial_protection'
  | 'avoid_direct_face_exposure'

export type FaceGuard = {
  level: FaceGuardLevel
  /** User-facing summary shown on Home and Live Session. */
  summary: string
  /** Machine-readable reasons that contributed to this level. */
  reasons: string[]
  suggestedAction: FaceGuardAction
}

export type FaceGuardInput = {
  skinType: SkinType | null
  sunSensitivity: SunSensitivity
  uvCategory: UvCategory | null
  /** From recovery module. Defaults to 'none' when not provided. */
  recoveryLevel?: RecoveryLevel
  /** From protection module. Absent when not yet computed. */
  protectionReliability?: ProtectionReliability
}
