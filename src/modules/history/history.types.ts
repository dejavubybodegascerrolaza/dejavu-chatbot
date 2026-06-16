import type { ExposureSession, SensationAfter } from '../sessions/session.types'

/**
 * Conservative classification of recent skin-response behaviour. Mirrors the
 * recovery escalation (derived from the recovery engine, not re-implemented).
 */
export type SafetyTrend = 'stable' | 'caution' | 'recovery_needed' | 'insufficient_data'

export type HistoryMetrics = {
  sessionsLoggedLast7Days: number
  totalEstimatedMinutesLast7Days: number
  /** Consecutive days ending today with no burn signal (from the gamification engine). */
  burnFreeDays: number
  /** Count of last-7-days sessions reporting discomfort/redness/overexposure. */
  recoverySignalsLast7Days: number
  /** Most frequent skin response in the last 7 days; null when there are none. */
  mostCommonSkinResponse: SensationAfter | null
  /** Most recent date (any time) with a non-positive skin response; null if none. */
  lastNegativeResponseDate: string | null
}

export type HistoryInsights = {
  trend: SafetyTrend
  title: string
  explanation: string
  reasons: string[]
  metrics: HistoryMetrics
  /** Conservative caution/recovery note when relevant; null otherwise. */
  cautionNote: string | null
}

export type HistoryInsightsInput = {
  sessions: ExposureSession[]
  /** ISO YYYY-MM-DD anchor for "today". */
  today: string
}
