import { generateTanPlan } from './plan.engine'
import { TAN_LEVEL_SHADE } from './plan.rules'

const START = '2026-06-15'

describe('generateTanPlan', () => {
  it('reaches a safe goal and predicts an ETA in the future', () => {
    const plan = generateTanPlan({
      skinType: 4,
      goalLevel: 'bronze',
      startDate: START,
      typicalUvIndex: 7,
    })
    expect(plan.status).toBe('ok')
    expect(plan.reachableLevel).toBe('bronze')
    expect(plan.etaDate).not.toBeNull()
    expect(plan.etaDate! > START).toBe(true)
    expect(plan.totalDays).toBeGreaterThan(0)
    expect(plan.sessionDays).toBeGreaterThan(0)
  })

  it('produces ordered milestones up to the goal', () => {
    const plan = generateTanPlan({ skinType: 4, goalLevel: 'bronze', startDate: START })
    const levels = plan.milestones.map((m) => m.level)
    expect(levels).toEqual(['light_golden', 'golden', 'bronze'])
    // dates are non-decreasing
    for (let i = 1; i < plan.milestones.length; i++) {
      expect(plan.milestones[i]!.dayOffset).toBeGreaterThanOrEqual(
        plan.milestones[i - 1]!.dayOffset
      )
    }
  })

  it('takes longer for fairer skin than for darker skin to reach the same goal', () => {
    const fair = generateTanPlan({ skinType: 3, goalLevel: 'golden', startDate: START })
    const dark = generateTanPlan({ skinType: 5, goalLevel: 'golden', startDate: START })
    expect(fair.totalDays).toBeGreaterThan(dark.totalDays)
  })

  it('caps the goal at the safe ceiling for fair skin', () => {
    const plan = generateTanPlan({ skinType: 3, goalLevel: 'deep_bronze', startDate: START })
    expect(plan.status).toBe('goal_exceeds_safe_ceiling')
    // type III cannot safely reach deep_bronze (85); reachable is capped lower
    expect(TAN_LEVEL_SHADE[plan.reachableLevel]).toBeLessThan(TAN_LEVEL_SHADE.deep_bronze)
  })

  it('returns no reachable progress for type I skin (does not tan safely)', () => {
    const plan = generateTanPlan({ skinType: 1, goalLevel: 'bronze', startDate: START })
    expect(plan.status).toBe('goal_exceeds_safe_ceiling')
    expect(plan.reachableLevel).toBe('natural')
    expect(plan.etaDate).toBeNull()
    expect(plan.milestones).toHaveLength(0)
  })

  it('handles a goal at or below the current level', () => {
    const plan = generateTanPlan({
      skinType: 4,
      currentLevel: 'bronze',
      goalLevel: 'golden',
      startDate: START,
    })
    expect(plan.status).toBe('goal_below_current')
    expect(plan.totalDays).toBe(0)
    expect(plan.etaDate).toBe(START)
  })

  it('starts from a non-natural current level', () => {
    const fromScratch = generateTanPlan({ skinType: 4, goalLevel: 'bronze', startDate: START })
    const fromGolden = generateTanPlan({
      skinType: 4,
      currentLevel: 'golden',
      goalLevel: 'bronze',
      startDate: START,
    })
    expect(fromGolden.totalDays).toBeLessThan(fromScratch.totalDays)
    expect(fromGolden.milestones.map((m) => m.level)).toEqual(['bronze'])
  })

  it('reaches the goal faster with more sessions per week', () => {
    const few = generateTanPlan({
      skinType: 4,
      goalLevel: 'bronze',
      startDate: START,
      sessionsPerWeek: 2,
    })
    const many = generateTanPlan({
      skinType: 4,
      goalLevel: 'bronze',
      startDate: START,
      sessionsPerWeek: 6,
    })
    expect(many.totalDays).toBeLessThan(few.totalDays)
  })

  it('exposes a safe daily exposure time', () => {
    const plan = generateTanPlan({
      skinType: 4,
      goalLevel: 'bronze',
      startDate: START,
      typicalUvIndex: 8,
    })
    expect(plan.dailySafeMinutes).toBeGreaterThan(0)
  })
})
