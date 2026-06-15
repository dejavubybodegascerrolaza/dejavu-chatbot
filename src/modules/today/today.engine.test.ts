import { buildTodayDecision } from './today.engine'
import type { TodayDecisionInput } from './today.types'
import type { Profile } from '../profile/profile.types'
import type { ExposureSession } from '../sessions/session.types'
import type { UvForecast } from '../uv/uv.types'

/** Copy that must never appear in user-facing decision output. */
const FORBIDDEN = /dosis segura|tiempo seguro|sin riesgo|garantiza(?:do)?|diagnos|safe tanning/i

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = '2026-06-15'
const YESTERDAY = '2026-06-14'
const NOW = new Date('2026-06-15T12:00:00Z')

const BASE_PROFILE: Profile = {
  id: 'user-1',
  alias: 'Enrique',
  mainGoal: 'gradual_bronze',
  sunSensitivity: 'medium',
  skinType: 4,
  onboardingCompleted: true,
  disclaimerAcceptedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const SENSITIVE_PROFILE: Profile = {
  ...BASE_PROFILE,
  sunSensitivity: 'very_high',
  skinType: 1,
}

function makeUvForecast(uvIndex: number): UvForecast {
  return {
    coordinates: { latitude: 40.4, longitude: -3.7 },
    current: { time: `${TODAY}T12:00:00Z`, uvIndex },
    hourly: [{ time: `${TODAY}T12:00:00Z`, uvIndex }],
    maxToday: uvIndex,
    peakWindow: null,
    fetchedAt: `${TODAY}T12:00:00Z`,
  }
}

function makeSession(overrides: Partial<ExposureSession> = {}): ExposureSession {
  return {
    id: 'sess-1',
    userId: 'user-1',
    sessionDate: TODAY,
    durationMinutes: 30,
    context: 'urban',
    uvIndexManual: null,
    protectionLevel: 'medium',
    sensationAfter: 'normal',
    notes: null,
    createdAt: `${TODAY}T10:00:00Z`,
    updatedAt: `${TODAY}T10:00:00Z`,
    ...overrides,
  }
}

function makeInput(overrides: Partial<TodayDecisionInput> = {}): TodayDecisionInput {
  return {
    profile: BASE_PROFILE,
    recentSessions: [],
    todaySessions: [],
    historySessions: [],
    uvForecast: null,
    locationStatus: 'ready',
    planGoal: null,
    planCurrentLevel: 'natural',
    today: TODAY,
    now: NOW,
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildTodayDecision — state derivation', () => {
  it('returns unavailable when profile is null', () => {
    const result = buildTodayDecision(makeInput({ profile: null }))
    expect(result.state).toBe('unavailable')
    expect(result.recommendationLevel).toBeNull()
  })

  it('returns ready for low UV and no recent sessions', () => {
    const result = buildTodayDecision(
      makeInput({ uvForecast: makeUvForecast(3), locationStatus: 'ready' })
    )
    expect(result.state).toBe('ready')
    expect(result.recommendationLevel).toBe('low')
  })

  it('returns caution when high UV forces high_caution recommendation', () => {
    // UV >= 8 → recommendation engine forces at least high_caution
    const result = buildTodayDecision(
      makeInput({ uvForecast: makeUvForecast(8), locationStatus: 'ready' })
    )
    expect(result.state).toBe('caution')
    expect(['caution', 'high_caution']).toContain(result.recommendationLevel)
  })

  it('returns caution for extreme UV (11)', () => {
    const result = buildTodayDecision(
      makeInput({ uvForecast: makeUvForecast(11), locationStatus: 'ready' })
    )
    expect(result.state).toBe('caution')
    expect(result.reasons).toContain('high_uv_today')
  })

  it('returns caution for sensitive profile with accumulated load', () => {
    // 3 beach sessions at UV 7 → high load for very_high sensitivity skin type 1
    const sessions = Array.from({ length: 3 }, (_, i) =>
      makeSession({
        sessionDate: TODAY,
        durationMinutes: 40,
        context: 'beach',
        uvIndexManual: 7,
        sensationAfter: 'normal',
        id: `sess-${i}`,
      })
    )
    const result = buildTodayDecision(
      makeInput({
        profile: SENSITIVE_PROFILE,
        recentSessions: sessions,
        uvForecast: makeUvForecast(4),
      })
    )
    expect(['caution', 'avoid']).toContain(result.state)
  })

  it('returns recovery when burned_recently is in reasons', () => {
    const sessions = [makeSession({ sensationAfter: 'burned', sessionDate: YESTERDAY })]
    const result = buildTodayDecision(makeInput({ recentSessions: sessions }))
    expect(result.state).toBe('recovery')
    expect(result.reasons).toContain('burned_recently')
  })

  it('returns avoid for rest level without burn reason', () => {
    // Very high load → rest level (load-based, not health signal)
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `sess-${i}`,
        durationMinutes: 60,
        context: 'beach',
        uvIndexManual: 11,
        protectionLevel: 'none',
      })
    )
    const result = buildTodayDecision(
      makeInput({
        profile: SENSITIVE_PROFILE,
        recentSessions: sessions,
      })
    )
    expect(result.state).toBe('avoid')
    expect(result.recommendationLevel).toBe('rest')
  })

  it('returns location_needed when location denied and no UV forecast', () => {
    const result = buildTodayDecision(makeInput({ uvForecast: null, locationStatus: 'denied' }))
    expect(result.state).toBe('location_needed')
  })

  it('returns location_needed when location error and no UV forecast', () => {
    const result = buildTodayDecision(makeInput({ uvForecast: null, locationStatus: 'error' }))
    expect(result.state).toBe('location_needed')
  })

  it('returns ready (not location_needed) when UV forecast is available despite denied location', () => {
    // Edge case: UV was cached before location was denied
    const result = buildTodayDecision(
      makeInput({ uvForecast: makeUvForecast(3), locationStatus: 'denied' })
    )
    expect(result.state).toBe('ready')
  })

  it('recovery takes priority over avoid (burned + high load)', () => {
    const sessions = [
      makeSession({ sensationAfter: 'burned', durationMinutes: 60, context: 'beach' }),
      makeSession({
        id: 'sess-2',
        durationMinutes: 60,
        context: 'beach',
        uvIndexManual: 11,
        protectionLevel: 'none',
      }),
    ]
    const result = buildTodayDecision(makeInput({ recentSessions: sessions }))
    expect(result.state).toBe('recovery')
  })
})

describe('buildTodayDecision — metadata', () => {
  it('minutesToBurnEstimate is null when no UV forecast', () => {
    const result = buildTodayDecision(makeInput({ uvForecast: null, locationStatus: 'ready' }))
    expect(result.minutesToBurnEstimate).toBeNull()
  })

  it('minutesToBurnEstimate is a positive number when UV is available', () => {
    const result = buildTodayDecision(
      makeInput({ uvForecast: makeUvForecast(5), locationStatus: 'ready' })
    )
    expect(typeof result.minutesToBurnEstimate).toBe('number')
    expect(result.minutesToBurnEstimate).toBeGreaterThan(0)
  })

  it('uvCategory is null when no UV forecast', () => {
    const result = buildTodayDecision(makeInput({ uvForecast: null }))
    expect(result.uvCategory).toBeNull()
  })

  it('uvCategory reflects the real UV index', () => {
    expect(buildTodayDecision(makeInput({ uvForecast: makeUvForecast(2) })).uvCategory).toBe('low')
    expect(buildTodayDecision(makeInput({ uvForecast: makeUvForecast(5) })).uvCategory).toBe(
      'moderate'
    )
    expect(buildTodayDecision(makeInput({ uvForecast: makeUvForecast(11) })).uvCategory).toBe(
      'extreme'
    )
  })

  it('safetyStreak is 0 with no history sessions', () => {
    const result = buildTodayDecision(makeInput({ historySessions: [] }))
    expect(result.safetyStreak).toBe(0)
  })

  it('safetyStreak counts consecutive days without burn signals', () => {
    const history = [makeSession({ sessionDate: YESTERDAY, sensationAfter: 'great' })]
    const result = buildTodayDecision(makeInput({ historySessions: history }))
    // YESTERDAY to TODAY = 1 day gap + first session day → streak = 2
    expect(result.safetyStreak).toBeGreaterThan(0)
  })

  it('safetyStreak is 0 when burned today', () => {
    const history = [makeSession({ sessionDate: TODAY, sensationAfter: 'burned' })]
    const result = buildTodayDecision(makeInput({ historySessions: history }))
    expect(result.safetyStreak).toBe(0)
  })

  it('tanPlan is null when no planGoal', () => {
    const result = buildTodayDecision(makeInput({ planGoal: null }))
    expect(result.tanPlan).toBeNull()
    expect(result.hasActivePlan).toBe(false)
  })

  it('tanPlan is non-null and hasActivePlan is true when planGoal set', () => {
    const result = buildTodayDecision(
      makeInput({ planGoal: 'golden', planCurrentLevel: 'natural' })
    )
    expect(result.tanPlan).not.toBeNull()
    expect(result.hasActivePlan).toBe(true)
    expect(result.planGoal).toBe('golden')
  })

  it('hasLocationPermission is true only when status is ready', () => {
    expect(buildTodayDecision(makeInput({ locationStatus: 'ready' })).hasLocationPermission).toBe(
      true
    )
    expect(buildTodayDecision(makeInput({ locationStatus: 'denied' })).hasLocationPermission).toBe(
      false
    )
    expect(buildTodayDecision(makeInput({ locationStatus: 'idle' })).hasLocationPermission).toBe(
      false
    )
  })

  it('todayMinutes sums durations of today sessions', () => {
    const today = [
      makeSession({ durationMinutes: 20, id: 'a' }),
      makeSession({ durationMinutes: 15, id: 'b' }),
    ]
    const result = buildTodayDecision(makeInput({ todaySessions: today }))
    expect(result.todayMinutes).toBe(35)
  })

  it('todayMinutes is 0 when no sessions today', () => {
    const result = buildTodayDecision(makeInput({ todaySessions: [] }))
    expect(result.todayMinutes).toBe(0)
  })
})

describe('buildTodayDecision — copy safety', () => {
  const SCENARIOS: Array<[string, Partial<TodayDecisionInput>]> = [
    ['no sessions, no UV', {}],
    ['burned recently', { recentSessions: [makeSession({ sensationAfter: 'burned' })] }],
    ['high UV', { uvForecast: makeUvForecast(9) }],
    ['extreme UV', { uvForecast: makeUvForecast(11) }],
    ['location denied', { locationStatus: 'denied' }],
    [
      'very high load',
      {
        profile: SENSITIVE_PROFILE,
        recentSessions: Array.from({ length: 5 }, (_, i) =>
          makeSession({
            id: `s${i}`,
            durationMinutes: 60,
            context: 'beach',
            uvIndexManual: 11,
            protectionLevel: 'none',
          })
        ),
      },
    ],
  ]

  it.each(SCENARIOS)('no forbidden terms for scenario: %s', (_label, overrides) => {
    const result = buildTodayDecision(makeInput(overrides))
    const visible = [result.title, result.explanation, result.bestNextAction].join(' ')
    expect(visible).not.toMatch(FORBIDDEN)
  })

  it('disclaimer is always present and non-empty', () => {
    const scenarios = SCENARIOS.map(([, overrides]) => makeInput(overrides))
    scenarios.push(makeInput({ profile: null }))
    for (const input of scenarios) {
      const result = buildTodayDecision(input)
      expect(result.disclaimer.length).toBeGreaterThan(10)
    }
  })
})

describe('buildTodayDecision — unavailable state', () => {
  it('unavailable decision has safe copy', () => {
    const result = buildTodayDecision(makeInput({ profile: null }))
    const visible = [result.title, result.explanation, result.bestNextAction].join(' ')
    expect(visible).not.toMatch(FORBIDDEN)
  })

  it('unavailable decision has all null/zero metadata', () => {
    const result = buildTodayDecision(makeInput({ profile: null }))
    expect(result.recommendationLevel).toBeNull()
    expect(result.uvCategory).toBeNull()
    expect(result.uvIndexNow).toBeNull()
    expect(result.minutesToBurnEstimate).toBeNull()
    expect(result.tanPlan).toBeNull()
    expect(result.weeklyExposureLoad).toBeNull()
    expect(result.safetyStreak).toBe(0)
    expect(result.todayMinutes).toBe(0)
  })
})

// ── RC-2D: Recovery status integration ────────────────────────────────────────

describe('buildTodayDecision — recoveryStatus', () => {
  it('recoveryStatus is none when no bad sensations', () => {
    const result = buildTodayDecision(makeInput({}))
    expect(result.recoveryStatus.level).toBe('none')
    expect(result.recoveryStatus.triggeredBy).toBeNull()
  })

  it('recoveryStatus is avoid_direct_exposure when burned recently', () => {
    const result = buildTodayDecision(
      makeInput({
        recentSessions: [makeSession({ sensationAfter: 'burned', sessionDate: YESTERDAY })],
      })
    )
    expect(result.recoveryStatus.level).toBe('avoid_direct_exposure')
    expect(result.recoveryStatus.triggeredBy).toBe('burned')
    expect(result.recoveryStatus.daysSince).toBe(1)
  })

  it('recoveryStatus is recovery_recommended when slightly_red yesterday', () => {
    const result = buildTodayDecision(
      makeInput({
        recentSessions: [makeSession({ sensationAfter: 'slightly_red', sessionDate: YESTERDAY })],
      })
    )
    expect(result.recoveryStatus.level).toBe('recovery_recommended')
  })

  it('recoveryStatus is caution when warm_tight today', () => {
    const result = buildTodayDecision(
      makeInput({
        recentSessions: [makeSession({ sensationAfter: 'warm_tight', sessionDate: TODAY })],
      })
    )
    expect(result.recoveryStatus.level).toBe('caution')
  })

  it('unavailable state has recoveryStatus level none', () => {
    const result = buildTodayDecision(makeInput({ profile: null }))
    expect(result.recoveryStatus.level).toBe('none')
  })
})

// ── RC-2D: Plan paused during recovery ────────────────────────────────────────

describe('buildTodayDecision — plan paused during recovery', () => {
  it('tanPlan is paused_recovery when burned and plan goal is set', () => {
    const result = buildTodayDecision(
      makeInput({
        planGoal: 'bronze',
        recentSessions: [makeSession({ sensationAfter: 'burned', sessionDate: TODAY })],
      })
    )
    expect(result.tanPlan?.status).toBe('paused_recovery')
    expect(result.tanPlan?.etaDate).toBeNull()
  })

  it('tanPlan is paused_recovery when slightly_red in last 2 days', () => {
    const result = buildTodayDecision(
      makeInput({
        planGoal: 'golden',
        recentSessions: [makeSession({ sensationAfter: 'slightly_red', sessionDate: YESTERDAY })],
      })
    )
    expect(result.tanPlan?.status).toBe('paused_recovery')
  })

  it('tanPlan is NOT paused for warm_tight (caution only, not overexposure)', () => {
    const result = buildTodayDecision(
      makeInput({
        planGoal: 'golden',
        recentSessions: [makeSession({ sensationAfter: 'warm_tight', sessionDate: TODAY })],
      })
    )
    expect(result.tanPlan?.status).not.toBe('paused_recovery')
  })

  it('tanPlan is null when no plan goal, regardless of recovery', () => {
    const result = buildTodayDecision(
      makeInput({
        planGoal: null,
        recentSessions: [makeSession({ sensationAfter: 'burned', sessionDate: TODAY })],
      })
    )
    expect(result.tanPlan).toBeNull()
  })
})
