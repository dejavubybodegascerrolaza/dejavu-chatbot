import type { SensationAfter } from '../sessions/session.types'
import type { ExposureSession } from '../sessions/session.types'

/**
 * Severity of the current recovery need based on recent post-session sensations.
 * Ordered from least to most severe.
 */
export type RecoveryLevel =
  | 'none' //                   No signals of overexposure
  | 'caution' //                Mild signal (warm/tight, or slight redness 3-7d ago)
  | 'recovery_recommended' //   Moderate signal (slight redness last 48h)
  | 'avoid_direct_exposure' //  Severe signal (burn in last 7 days)

export type RecoveryStatus = {
  level: RecoveryLevel
  /** The sensation that triggered this recovery status, or null when level is 'none'. */
  triggeredBy: SensationAfter | null
  /** Calendar days since the triggering session, or null when level is 'none'. */
  daysSince: number | null
  /** Conservative, non-medical guidance message. Empty string when level is 'none'. */
  message: string
}

export type RecoveryInput = {
  recentSessions: ExposureSession[]
  /** ISO YYYY-MM-DD string used as the reference "today". */
  today: string
}
