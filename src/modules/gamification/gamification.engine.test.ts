import {
  buildGamificationSummary,
  calculateAchievements,
  calculateSafetyStreak,
} from './gamification.engine'
import type { GamificationSessionInput } from './gamification.types'

const TODAY = '2026-06-15'

function session(
  sessionDate: string,
  sensationAfter: GamificationSessionInput['sensationAfter'] = 'normal',
  context: GamificationSessionInput['context'] = 'beach'
): GamificationSessionInput {
  return { sessionDate, sensationAfter, context }
}

describe('calculateSafetyStreak', () => {
  it('returns 0 with no sessions', () => {
    expect(calculateSafetyStreak([], TODAY)).toBe(0)
  })

  it('counts days since the first session when never burned', () => {
    // first session 5 days ago → inclusive streak of 6
    expect(calculateSafetyStreak([session('2026-06-10')], TODAY)).toBe(6)
  })

  it('returns 0 when burned today', () => {
    expect(calculateSafetyStreak([session(TODAY, 'burned')], TODAY)).toBe(0)
  })

  it('counts days since the last burn', () => {
    const sessions = [session('2026-06-10', 'burned'), session('2026-06-12', 'normal')]
    // last burn 5 days ago → streak 5
    expect(calculateSafetyStreak(sessions, TODAY)).toBe(5)
  })

  it('treats reddening as streak-breaking but mild warmth as safe', () => {
    expect(calculateSafetyStreak([session('2026-06-13', 'slightly_red')], TODAY)).toBe(2)
    expect(calculateSafetyStreak([session('2026-06-10', 'warm_tight')], TODAY)).toBe(6)
  })

  it('uses the most recent burn among several', () => {
    const sessions = [
      session('2026-06-05', 'burned'),
      session('2026-06-14', 'burned'),
      session('2026-06-08', 'normal'),
    ]
    expect(calculateSafetyStreak(sessions, TODAY)).toBe(1)
  })

  it('ignores sessions dated in the future', () => {
    const sessions = [session('2026-06-20', 'burned'), session('2026-06-13', 'normal')]
    expect(calculateSafetyStreak(sessions, TODAY)).toBe(3)
  })
})

describe('calculateAchievements', () => {
  it('unlocks first_session after one session', () => {
    const achievements = calculateAchievements({
      sessions: [session('2026-06-14')],
      today: TODAY,
      hasPlan: false,
    })
    const first = achievements.find((a) => a.id === 'first_session')!
    expect(first.unlocked).toBe(true)
  })

  it('unlocks planner only when a plan exists', () => {
    const withPlan = calculateAchievements({ sessions: [], today: TODAY, hasPlan: true })
    const withoutPlan = calculateAchievements({ sessions: [], today: TODAY, hasPlan: false })
    expect(withPlan.find((a) => a.id === 'planner')!.unlocked).toBe(true)
    expect(withoutPlan.find((a) => a.id === 'planner')!.unlocked).toBe(false)
  })

  it('tracks explorer progress across distinct contexts', () => {
    const achievements = calculateAchievements({
      sessions: [
        session('2026-06-10', 'normal', 'beach'),
        session('2026-06-11', 'normal', 'pool'),
        session('2026-06-12', 'normal', 'beach'),
      ],
      today: TODAY,
      hasPlan: false,
    })
    const explorer = achievements.find((a) => a.id === 'explorer')!
    expect(explorer.current).toBe(2)
    expect(explorer.unlocked).toBe(false)
  })

  it('caps progress at the target', () => {
    const sessions = Array.from({ length: 15 }, (_, i) => session(`2026-06-${10 + i}`))
    const achievements = calculateAchievements({ sessions, today: '2026-07-10', hasPlan: false })
    const consistency = achievements.find((a) => a.id === 'consistency')!
    expect(consistency.current).toBe(consistency.target)
    expect(consistency.unlocked).toBe(true)
  })
})

describe('buildGamificationSummary', () => {
  it('summarises streak, counts and the next achievement', () => {
    const summary = buildGamificationSummary({
      sessions: [session('2026-06-14', 'normal', 'beach')],
      today: TODAY,
      hasPlan: false,
    })
    expect(summary.safetyStreak).toBe(2)
    expect(summary.totalCount).toBe(summary.achievements.length)
    expect(summary.unlockedCount).toBeGreaterThanOrEqual(1)
    expect(summary.nextAchievement).not.toBeNull()
    expect(summary.nextAchievement!.unlocked).toBe(false)
  })

  it('reports no next achievement when all are unlocked', () => {
    const sessions = Array.from({ length: 30 }, (_, i) =>
      session(
        `2026-05-${String(1 + (i % 28)).padStart(2, '0')}`,
        'normal',
        i % 3 === 0 ? 'beach' : i % 3 === 1 ? 'pool' : 'urban'
      )
    )
    // 30+ distinct-ish days, 3 contexts, plan, long streak
    const summary = buildGamificationSummary({ sessions, today: '2026-06-30', hasPlan: true })
    expect(summary.nextAchievement).toBeNull()
    expect(summary.unlockedCount).toBe(summary.totalCount)
  })
})
