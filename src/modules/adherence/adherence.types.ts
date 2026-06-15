import type { ExposureSession } from '../sessions/session.types'
import type { RecoveryStatus } from '../recovery/recovery.types'
import type { TanPlanResult } from '../plan/plan.types'

/**
 * How closely the user's actual sessions match the plan's projected cadence.
 * Derived from session history and recovery status — never from free-text.
 */
export type AdherenceStatus =
  | 'unknown' //           No startDate, or plan was just created
  | 'insufficient_data' // Plan too new or too few sessions to assess
  | 'on_track' //          Actual sessions >= expected by today
  | 'slightly_behind' //   1–3 session deficit vs. expected cadence
  | 'paused_recovery' //   Recovery level requires plan pause

export type PlanAdherence = {
  status: AdherenceStatus
  /** Qualifying sessions since plan start (burned/slightly_red excluded). */
  completedSessions: number
  /** Expected sessions by today given the default cadence. */
  expectedSessions: number
  /** How many sessions behind the expected cadence (0 when on track or ahead). */
  sessionDeficit: number
  /**
   * Adjusted ETA accounting for the current deficit.
   * Null when paused, unknown, or insufficient data.
   */
  adjustedEtaDate: string | null
  /** Conservative, non-medical user-facing summary. */
  summary: string
}

export type AdherenceInput = {
  plan: TanPlanResult
  planStartDate: string
  historySessions: ExposureSession[]
  recoveryStatus: RecoveryStatus
  today: string
}
