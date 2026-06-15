import type { ExposureContext, SensationAfter } from '../sessions/session.types'

export type AchievementId =
  | 'first_session'
  | 'protected_week'
  | 'protected_month'
  | 'consistency'
  | 'explorer'
  | 'planner'

export type GamificationSessionInput = {
  sessionDate: string
  sensationAfter: SensationAfter
  context: ExposureContext
}

export type GamificationInput = {
  sessions: GamificationSessionInput[]
  /** Today's ISO date, the anchor for the safety streak. */
  today: string
  /** Whether the user has set a tanning plan goal. */
  hasPlan: boolean
}

export type Achievement = {
  id: AchievementId
  unlocked: boolean
  /** Progress toward the target, capped at the target. */
  current: number
  target: number
}

export type GamificationSummary = {
  /** Consecutive days, ending today, with no burn signal. */
  safetyStreak: number
  achievements: Achievement[]
  unlockedCount: number
  totalCount: number
  /** First not-yet-unlocked achievement, for "you're close" nudges. */
  nextAchievement: Achievement | null
}
