import type { SensationAfter } from '../sessions/session.types'
import type { AchievementId } from './gamification.types'

/**
 * Sensations that break the safety streak. Only clear over-exposure signals
 * count — mild warmth does not, and rest days never break the streak. This
 * keeps the streak a reward for safe behaviour, never for more sun.
 */
export const STREAK_BREAKING_SENSATIONS: SensationAfter[] = ['burned', 'slightly_red']

export const ACHIEVEMENT_TARGETS: Record<AchievementId, number> = {
  first_session: 1,
  protected_week: 7,
  protected_month: 30,
  consistency: 10,
  explorer: 3,
  planner: 1,
}

/** Display order of achievements (roughly easiest to hardest). */
export const ACHIEVEMENT_ORDER: AchievementId[] = [
  'first_session',
  'planner',
  'explorer',
  'protected_week',
  'consistency',
  'protected_month',
]

export function isStreakBreaking(sensation: SensationAfter): boolean {
  return STREAK_BREAKING_SENSATIONS.includes(sensation)
}
