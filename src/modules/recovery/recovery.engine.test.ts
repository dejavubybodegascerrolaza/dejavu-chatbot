import { buildRecoveryStatus } from './recovery.engine'
import type { RecoveryInput } from './recovery.types'
import type { ExposureSession } from '../sessions/session.types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = '2026-06-15'
const YESTERDAY = '2026-06-14'
const TWO_DAYS_AGO = '2026-06-13'
const THREE_DAYS_AGO = '2026-06-12'
const SEVEN_DAYS_AGO = '2026-06-08'
const EIGHT_DAYS_AGO = '2026-06-07'

function makeSession(overrides: Partial<ExposureSession> = {}): ExposureSession {
  return {
    id: 'sess-1',
    userId: 'user-1',
    sessionDate: TODAY,
    durationMinutes: 30,
    context: 'beach',
    uvIndexManual: 6,
    protectionLevel: 'medium',
    sensationAfter: 'normal',
    notes: null,
    createdAt: `${TODAY}T12:00:00Z`,
    updatedAt: `${TODAY}T12:00:00Z`,
    ...overrides,
  }
}

function buildInput(sessions: ExposureSession[]): RecoveryInput {
  return { recentSessions: sessions, today: TODAY }
}

// ── Level: none ───────────────────────────────────────────────────────────────

describe('buildRecoveryStatus — level: none', () => {
  it('returns none for empty sessions', () => {
    const result = buildRecoveryStatus(buildInput([]))
    expect(result.level).toBe('none')
    expect(result.triggeredBy).toBeNull()
    expect(result.daysSince).toBeNull()
    expect(result.message).toBe('')
  })

  it('returns none when all sensations are great or normal', () => {
    const sessions = [
      makeSession({ sensationAfter: 'great', sessionDate: TODAY }),
      makeSession({ id: 'sess-2', sensationAfter: 'normal', sessionDate: YESTERDAY }),
    ]
    expect(buildRecoveryStatus(buildInput(sessions)).level).toBe('none')
  })

  it('returns none when warm_tight is more than 2 days ago', () => {
    const sessions = [makeSession({ sensationAfter: 'warm_tight', sessionDate: THREE_DAYS_AGO })]
    expect(buildRecoveryStatus(buildInput(sessions)).level).toBe('none')
  })

  it('returns none when session is in the future', () => {
    const sessions = [makeSession({ sensationAfter: 'burned', sessionDate: '2026-06-20' })]
    expect(buildRecoveryStatus(buildInput(sessions)).level).toBe('none')
  })

  it('returns none when session is 8 days ago (beyond the 7-day window)', () => {
    const sessions = [makeSession({ sensationAfter: 'burned', sessionDate: EIGHT_DAYS_AGO })]
    expect(buildRecoveryStatus(buildInput(sessions)).level).toBe('none')
  })
})

// ── Level: caution ────────────────────────────────────────────────────────────

describe('buildRecoveryStatus — level: caution', () => {
  it('returns caution for warm_tight today', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'warm_tight', sessionDate: TODAY })])
    )
    expect(result.level).toBe('caution')
    expect(result.triggeredBy).toBe('warm_tight')
    expect(result.daysSince).toBe(0)
  })

  it('returns caution for warm_tight yesterday', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'warm_tight', sessionDate: YESTERDAY })])
    )
    expect(result.level).toBe('caution')
    expect(result.daysSince).toBe(1)
  })

  it('returns caution for warm_tight 2 days ago (boundary)', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'warm_tight', sessionDate: TWO_DAYS_AGO })])
    )
    expect(result.level).toBe('caution')
    expect(result.daysSince).toBe(2)
  })

  it('returns caution for slightly_red 3 days ago', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'slightly_red', sessionDate: THREE_DAYS_AGO })])
    )
    expect(result.level).toBe('caution')
    expect(result.triggeredBy).toBe('slightly_red')
    expect(result.daysSince).toBe(3)
  })

  it('returns caution for slightly_red 7 days ago (boundary)', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'slightly_red', sessionDate: SEVEN_DAYS_AGO })])
    )
    expect(result.level).toBe('caution')
    expect(result.daysSince).toBe(7)
  })

  it('caution message is non-empty and not medical claim', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'warm_tight', sessionDate: TODAY })])
    )
    expect(result.message.length).toBeGreaterThan(0)
    expect(result.message).not.toMatch(/diagnos|garantiz|seguro|safe tanning/i)
  })
})

// ── Level: recovery_recommended ───────────────────────────────────────────────

describe('buildRecoveryStatus — level: recovery_recommended', () => {
  it('returns recovery_recommended for slightly_red today', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'slightly_red', sessionDate: TODAY })])
    )
    expect(result.level).toBe('recovery_recommended')
    expect(result.triggeredBy).toBe('slightly_red')
    expect(result.daysSince).toBe(0)
  })

  it('returns recovery_recommended for slightly_red yesterday', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'slightly_red', sessionDate: YESTERDAY })])
    )
    expect(result.level).toBe('recovery_recommended')
    expect(result.daysSince).toBe(1)
  })

  it('returns recovery_recommended for slightly_red 2 days ago (boundary)', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'slightly_red', sessionDate: TWO_DAYS_AGO })])
    )
    expect(result.level).toBe('recovery_recommended')
    expect(result.daysSince).toBe(2)
  })

  it('returns recovery_recommended even if an older warm_tight also present', () => {
    const sessions = [
      makeSession({ sensationAfter: 'slightly_red', sessionDate: YESTERDAY }),
      makeSession({ id: 's2', sensationAfter: 'warm_tight', sessionDate: TODAY }),
    ]
    const result = buildRecoveryStatus(buildInput(sessions))
    expect(result.level).toBe('recovery_recommended')
    expect(result.triggeredBy).toBe('slightly_red')
  })

  it('recovery_recommended message mentions rest and is non-medical', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'slightly_red', sessionDate: TODAY })])
    )
    expect(result.message.length).toBeGreaterThan(0)
    expect(result.message).not.toMatch(/diagnos|garantiz|safe tanning/i)
  })
})

// ── Level: avoid_direct_exposure ──────────────────────────────────────────────

describe('buildRecoveryStatus — level: avoid_direct_exposure', () => {
  it('returns avoid_direct_exposure for burned today', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'burned', sessionDate: TODAY })])
    )
    expect(result.level).toBe('avoid_direct_exposure')
    expect(result.triggeredBy).toBe('burned')
    expect(result.daysSince).toBe(0)
  })

  it('returns avoid_direct_exposure for burned 7 days ago (boundary)', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'burned', sessionDate: SEVEN_DAYS_AGO })])
    )
    expect(result.level).toBe('avoid_direct_exposure')
    expect(result.daysSince).toBe(7)
  })

  it('burned overrides a concurrent slightly_red', () => {
    const sessions = [
      makeSession({ sensationAfter: 'slightly_red', sessionDate: TODAY }),
      makeSession({ id: 's2', sensationAfter: 'burned', sessionDate: YESTERDAY }),
    ]
    const result = buildRecoveryStatus(buildInput(sessions))
    expect(result.level).toBe('avoid_direct_exposure')
    expect(result.triggeredBy).toBe('burned')
  })

  it('burned overrides warm_tight', () => {
    const sessions = [
      makeSession({ sensationAfter: 'warm_tight', sessionDate: TODAY }),
      makeSession({ id: 's2', sensationAfter: 'burned', sessionDate: THREE_DAYS_AGO }),
    ]
    expect(buildRecoveryStatus(buildInput(sessions)).level).toBe('avoid_direct_exposure')
  })

  it('avoid_direct_exposure message is present and non-medical', () => {
    const result = buildRecoveryStatus(
      buildInput([makeSession({ sensationAfter: 'burned', sessionDate: TODAY })])
    )
    expect(result.message.length).toBeGreaterThan(0)
    expect(result.message).not.toMatch(/diagnos|garantiz|safe tanning/i)
  })
})

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('buildRecoveryStatus — edge cases', () => {
  it('picks the single worst session across mixed array', () => {
    const sessions = [
      makeSession({ id: 's1', sensationAfter: 'normal', sessionDate: TODAY }),
      makeSession({ id: 's2', sensationAfter: 'warm_tight', sessionDate: YESTERDAY }),
      makeSession({ id: 's3', sensationAfter: 'slightly_red', sessionDate: TWO_DAYS_AGO }),
    ]
    const result = buildRecoveryStatus(buildInput(sessions))
    // slightly_red within 2 days → recovery_recommended beats warm_tight caution
    expect(result.level).toBe('recovery_recommended')
    expect(result.triggeredBy).toBe('slightly_red')
  })

  it('ignores slightly_red older than 7 days', () => {
    const sessions = [makeSession({ sensationAfter: 'slightly_red', sessionDate: EIGHT_DAYS_AGO })]
    expect(buildRecoveryStatus(buildInput(sessions)).level).toBe('none')
  })
})
