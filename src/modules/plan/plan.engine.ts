import { addDaysToISODate, getTodayISODate } from '@/utils/date'
import { calculateBurnTime } from '../sun/sun.burn-time'
import {
  ceilingFor,
  clampSessionsPerWeek,
  DEFAULT_TYPICAL_UV,
  isSessionDay,
  MAX_PLAN_DAYS,
  REACHABLE_CEILING_FRACTION,
  TAN_LEVEL_ORDER,
  TAN_LEVEL_SHADE,
  tanLevelIndex,
  tanRateFor,
} from './plan.rules'
import type { PlanMilestone, TanLevel, TanPlanInput, TanPlanResult } from './plan.types'

/**
 * Builds a healthy, progressive tanning plan. The plan optimises for the deepest
 * tan reachable WITHOUT burning: every session uses only the safe daily dose,
 * and the ceiling per skin type is never exceeded. It predicts the date each
 * milestone — and the final goal — is reached.
 *
 * This is a transparent projection assuming the user follows the plan, not a
 * medical promise. It never recommends exceeding the safe daily dose.
 */
export function generateTanPlan(input: TanPlanInput): TanPlanResult {
  const currentLevel: TanLevel = input.currentLevel ?? 'natural'
  const { goalLevel } = input
  const startDate = input.startDate ?? getTodayISODate()
  const sessionsPerWeek = clampSessionsPerWeek(input.sessionsPerWeek)
  const typicalUv = input.typicalUvIndex ?? DEFAULT_TYPICAL_UV

  const ceiling = ceilingFor(input.skinType)
  const rate = tanRateFor(input.skinType)
  const dailySafeMinutes = calculateBurnTime({
    skinType: input.skinType,
    uvIndex: typicalUv,
  }).safeMinutes

  // Skin is in recovery: pause the plan until the user feels better.
  if (input.hasRecentOverexposure === true) {
    return {
      status: 'paused_recovery',
      goalLevel,
      reachableLevel: currentLevel,
      etaDate: null,
      totalDays: 0,
      sessionDays: 0,
      dailySafeMinutes,
      milestones: [],
    }
  }

  // Goal at or below the current tan: nothing to do.
  if (tanLevelIndex(goalLevel) <= tanLevelIndex(currentLevel)) {
    return {
      status: 'goal_below_current',
      goalLevel,
      reachableLevel: currentLevel,
      etaDate: startDate,
      totalDays: 0,
      sessionDays: 0,
      dailySafeMinutes,
      milestones: [],
    }
  }

  const practicalMax = ceiling * REACHABLE_CEILING_FRACTION
  const goalShade = TAN_LEVEL_SHADE[goalLevel]
  const targetShade = Math.min(goalShade, practicalMax)
  const goalReachable = goalShade <= practicalMax + 1e-6

  // Named levels strictly above the current one that the skin can safely reach.
  const reachableLevels = TAN_LEVEL_ORDER.filter(
    (level) =>
      tanLevelIndex(level) > tanLevelIndex(currentLevel) &&
      TAN_LEVEL_SHADE[level] <= practicalMax + 1e-6 &&
      TAN_LEVEL_SHADE[level] <= targetShade + 1e-6
  )

  const lastReachable = reachableLevels[reachableLevels.length - 1]

  // Even the first step beyond the current tan is unsafe for this skin type.
  if (lastReachable === undefined) {
    return {
      status: 'goal_exceeds_safe_ceiling',
      goalLevel,
      reachableLevel: currentLevel,
      etaDate: null,
      totalDays: 0,
      sessionDays: 0,
      dailySafeMinutes,
      milestones: [],
    }
  }

  // Simulate day by day, applying the safe gain on session days.
  let shade = TAN_LEVEL_SHADE[currentLevel]
  let sessionDays = 0
  const milestones: PlanMilestone[] = []
  const pending = [...reachableLevels]
  let totalDays = 0

  for (let day = 0; day <= MAX_PLAN_DAYS; day++) {
    while (pending.length > 0 && shade >= TAN_LEVEL_SHADE[pending[0] as TanLevel] - 1e-6) {
      const level = pending.shift() as TanLevel
      milestones.push({ level, date: addDaysToISODate(startDate, day), dayOffset: day })
    }
    if (pending.length === 0) {
      totalDays = day
      break
    }
    if (isSessionDay(day, sessionsPerWeek)) {
      shade += (ceiling - shade) * rate
      sessionDays++
    }
    totalDays = day
  }

  const finalMilestone = milestones[milestones.length - 1]

  return {
    status: goalReachable ? 'ok' : 'goal_exceeds_safe_ceiling',
    goalLevel,
    reachableLevel: lastReachable,
    etaDate: finalMilestone?.date ?? null,
    totalDays: finalMilestone?.dayOffset ?? totalDays,
    sessionDays,
    dailySafeMinutes,
    milestones,
  }
}
