import { daysBetweenISODates } from '@/utils/date'
import { ACHIEVEMENT_ORDER, ACHIEVEMENT_TARGETS, isStreakBreaking } from './gamification.rules'
import type {
  Achievement,
  AchievementId,
  GamificationInput,
  GamificationSessionInput,
  GamificationSummary,
} from './gamification.types'

/**
 * Counts consecutive days, ending today, with no burn signal. A day with a burn
 * or reddening breaks the streak; rest days and safe sessions keep it alive.
 *
 * - Burn today → 0.
 * - Last burn N days ago → N.
 * - Never burned, but with sessions → days since the first session (inclusive).
 * - No sessions at all → 0.
 */
export function calculateSafetyStreak(sessions: GamificationSessionInput[], today: string): number {
  if (sessions.length === 0) return 0

  let lastUnhealthy: string | null = null
  let earliest: string | null = null

  for (const session of sessions) {
    const date = session.sessionDate.slice(0, 10)
    if (date > today) continue
    if (earliest === null || date < earliest) earliest = date
    if (isStreakBreaking(session.sensationAfter)) {
      if (lastUnhealthy === null || date > lastUnhealthy) lastUnhealthy = date
    }
  }

  if (lastUnhealthy !== null) {
    return Math.max(0, daysBetweenISODates(lastUnhealthy, today))
  }

  if (earliest === null) return 0
  return daysBetweenISODates(earliest, today) + 1
}

function buildAchievement(id: AchievementId, rawCurrent: number): Achievement {
  const target = ACHIEVEMENT_TARGETS[id]
  return {
    id,
    unlocked: rawCurrent >= target,
    current: Math.min(rawCurrent, target),
    target,
  }
}

export function calculateAchievements(input: GamificationInput): Achievement[] {
  const inPast = input.sessions.filter((s) => s.sessionDate.slice(0, 10) <= input.today)
  const distinctDays = new Set(inPast.map((s) => s.sessionDate.slice(0, 10))).size
  const distinctContexts = new Set(inPast.map((s) => s.context)).size
  const streak = calculateSafetyStreak(input.sessions, input.today)

  const raw: Record<AchievementId, number> = {
    first_session: inPast.length,
    protected_week: streak,
    protected_month: streak,
    consistency: distinctDays,
    explorer: distinctContexts,
    planner: input.hasPlan ? 1 : 0,
  }

  return ACHIEVEMENT_ORDER.map((id) => buildAchievement(id, raw[id]))
}

export function buildGamificationSummary(input: GamificationInput): GamificationSummary {
  const achievements = calculateAchievements(input)
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const nextAchievement = achievements.find((a) => !a.unlocked) ?? null

  return {
    safetyStreak: calculateSafetyStreak(input.sessions, input.today),
    achievements,
    unlockedCount,
    totalCount: achievements.length,
    nextAchievement,
  }
}
