import type { SkinType } from '../profile/profile.types'

/** Named, user-facing tan shades, ordered from lightest to deepest. */
export type TanLevel = 'natural' | 'light_golden' | 'golden' | 'bronze' | 'deep_bronze'

export type TanPlanStatus = 'ok' | 'goal_below_current' | 'goal_exceeds_safe_ceiling'

export type PlanMilestone = {
  level: TanLevel
  /** ISO date this milestone is reached following the safe plan. */
  date: string
  /** Calendar days from the plan start. */
  dayOffset: number
}

export type TanPlanInput = {
  skinType: SkinType | null
  /** Where the user is starting from. Defaults to 'natural'. */
  currentLevel?: TanLevel
  goalLevel: TanLevel
  /** ISO date the plan starts. Defaults to today. */
  startDate?: string
  /** Safe sessions per week (skin needs recovery days). Defaults to 5. */
  sessionsPerWeek?: number
  /** Representative UV index used to size the daily safe dose. Defaults to 7. */
  typicalUvIndex?: number
}

export type TanPlanResult = {
  status: TanPlanStatus
  goalLevel: TanLevel
  /** Highest level safely reachable: equals goalLevel when status is 'ok'. */
  reachableLevel: TanLevel
  /** ISO date the reachable goal is met, or null if nothing above current is safe. */
  etaDate: string | null
  /** Calendar days from start to the reachable goal. */
  totalDays: number
  /** Number of exposure sessions in the plan. */
  sessionDays: number
  /** Recommended safe exposure minutes per session at the typical UV. */
  dailySafeMinutes: number | null
  milestones: PlanMilestone[]
}
