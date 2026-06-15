import type { RecommendationLevel } from '../recommendations/recommendation.types'
import type { UvCategory } from '../uv/uv.types'
import type { TanLevel, TanPlanResult } from '../plan/plan.types'
import type { Profile } from '../profile/profile.types'
import type { ExposureSession } from '../sessions/session.types'
import type { UvForecast } from '../uv/uv.types'
import type { LocationStatus } from '../location/location.store'
import type { RecoveryStatus } from '../recovery/recovery.types'

/**
 * Driving state for the primary Home decision card.
 * Derived from the recommendation engine output, UV availability, and health signals.
 */
export type TodayDecisionState =
  | 'ready' //           Low/moderate: proceed with awareness
  | 'caution' //         Caution/high_caution: be more careful
  | 'avoid' //           Rest (load-based): no more exposure today
  | 'recovery' //        Burned recently: rest and recover
  | 'location_needed' // No UV + location denied: conservative guidance only
  | 'unavailable' //     Profile missing or data still loading

export type TodayDecision = {
  // ── Core decision ─────────────────────────────────────────────────────────────
  state: TodayDecisionState
  /** Short, action-oriented headline for the primary decision card. */
  title: string
  /** Explanatory sentence shown below the title. */
  explanation: string
  /** Label for the primary CTA button. */
  bestNextAction: string
  /** Machine-readable reasons from the underlying modules. */
  reasons: string[]
  /** Legal disclaimer (passed through from the recommendation engine). */
  disclaimer: string

  // ── Source metadata ───────────────────────────────────────────────────────────
  recommendationLevel: RecommendationLevel | null
  weeklyExposureLoad: number | null
  uvCategory: UvCategory | null
  uvIndexNow: number | null
  /** Rough minutes before skin may show signs of overexposure (SPF 30 baseline). */
  minutesToBurnEstimate: number | null
  /** Full tan plan result if the user has set a goal; null otherwise. */
  tanPlan: TanPlanResult | null
  hasActivePlan: boolean
  planGoal: TanLevel | null
  safetyStreak: number
  hasLocationPermission: boolean
  todayMinutes: number
  /** Current skin recovery status derived from recent post-session sensations. */
  recoveryStatus: RecoveryStatus
}

export type TodayDecisionInput = {
  profile: Profile | null
  /** Sessions from the last 7 days — feeds the recommendation engine. */
  recentSessions: ExposureSession[]
  /** Sessions recorded today — used for today's total. */
  todaySessions: ExposureSession[]
  /** All-time history — used to compute the safety streak. */
  historySessions: ExposureSession[]
  uvForecast: UvForecast | null
  locationStatus: LocationStatus
  planGoal: TanLevel | null
  planCurrentLevel: TanLevel
  /** ISO YYYY-MM-DD, anchor for streak and "today" logic. */
  today: string
  now?: Date
}
