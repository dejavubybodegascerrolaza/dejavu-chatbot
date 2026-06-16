import { buildHistoryInsights } from './history.engine'
import type { ExposureSession, SensationAfter } from '../sessions/session.types'

const TODAY = '2026-06-15'
const YESTERDAY = '2026-06-14'
const TWO_DAYS_AGO = '2026-06-13'
const TEN_DAYS_AGO = '2026-06-05'

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

function insightsFor(sessions: ExposureSession[]) {
  return buildHistoryInsights({ sessions, today: TODAY })
}

// ── Trend ─────────────────────────────────────────────────────────────────────

describe('buildHistoryInsights — trend', () => {
  it('returns insufficient_data when there are no sessions', () => {
    const result = insightsFor([])
    expect(result.trend).toBe('insufficient_data')
    expect(result.reasons).toEqual([])
  })

  it('returns insufficient_data when sessions exist but none in the last 7 days', () => {
    const result = insightsFor([
      makeSession({ sessionDate: TEN_DAYS_AGO, sensationAfter: 'great' }),
    ])
    expect(result.trend).toBe('insufficient_data')
  })

  it('returns stable for recent positive-only sessions', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: YESTERDAY, sensationAfter: 'great' }),
      makeSession({ id: 'b', sessionDate: TODAY, sensationAfter: 'normal' }),
    ])
    expect(result.trend).toBe('stable')
  })

  it('returns caution when warm_tight was logged recently', () => {
    const result = insightsFor([makeSession({ sessionDate: TODAY, sensationAfter: 'warm_tight' })])
    expect(result.trend).toBe('caution')
  })

  it('returns recovery_needed when slightly_red was logged recently', () => {
    const result = insightsFor([
      makeSession({ sessionDate: YESTERDAY, sensationAfter: 'slightly_red' }),
    ])
    expect(result.trend).toBe('recovery_needed')
  })

  it('returns recovery_needed when burned was logged recently', () => {
    const result = insightsFor([
      makeSession({ sessionDate: TWO_DAYS_AGO, sensationAfter: 'burned' }),
    ])
    expect(result.trend).toBe('recovery_needed')
  })
})

// ── Metrics ─────────────────────────────────────────────────────────────────────

describe('buildHistoryInsights — metrics', () => {
  it('counts only sessions within the last 7 days', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: TODAY }),
      makeSession({ id: 'b', sessionDate: YESTERDAY }),
      makeSession({ id: 'c', sessionDate: TEN_DAYS_AGO }),
    ])
    expect(result.metrics.sessionsLoggedLast7Days).toBe(2)
  })

  it('sums estimated minutes only from structured duration fields in the window', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: TODAY, durationMinutes: 20 }),
      makeSession({ id: 'b', sessionDate: YESTERDAY, durationMinutes: 25 }),
      makeSession({ id: 'c', sessionDate: TEN_DAYS_AGO, durationMinutes: 99 }),
    ])
    expect(result.metrics.totalEstimatedMinutesLast7Days).toBe(45)
  })

  it('counts recovery signals (discomfort/redness/overexposure) in the window', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: TODAY, sensationAfter: 'warm_tight' }),
      makeSession({ id: 'b', sessionDate: YESTERDAY, sensationAfter: 'slightly_red' }),
      makeSession({ id: 'c', sessionDate: TWO_DAYS_AGO, sensationAfter: 'normal' }),
    ])
    expect(result.metrics.recoverySignalsLast7Days).toBe(2)
  })

  it('reports the most common skin response in the window', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: TODAY, sensationAfter: 'normal' }),
      makeSession({ id: 'b', sessionDate: YESTERDAY, sensationAfter: 'normal' }),
      makeSession({ id: 'c', sessionDate: TWO_DAYS_AGO, sensationAfter: 'warm_tight' }),
    ])
    expect(result.metrics.mostCommonSkinResponse).toBe('normal')
  })

  it('breaks most-common ties toward the more severe response', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: TODAY, sensationAfter: 'normal' }),
      makeSession({ id: 'b', sessionDate: YESTERDAY, sensationAfter: 'slightly_red' }),
    ])
    expect(result.metrics.mostCommonSkinResponse).toBe('slightly_red')
  })

  it('reports the last negative response date across all history', () => {
    const result = insightsFor([
      makeSession({ id: 'a', sessionDate: TEN_DAYS_AGO, sensationAfter: 'burned' }),
      makeSession({ id: 'b', sessionDate: TODAY, sensationAfter: 'great' }),
    ])
    expect(result.metrics.lastNegativeResponseDate).toBe(TEN_DAYS_AGO)
  })

  it('has a null last negative response date when there are none', () => {
    const result = insightsFor([makeSession({ sessionDate: TODAY, sensationAfter: 'great' })])
    expect(result.metrics.lastNegativeResponseDate).toBeNull()
  })

  it('ignores free-text notes entirely', () => {
    const withNote = insightsFor([
      makeSession({ sessionDate: TODAY, sensationAfter: 'great', notes: 'me quemé muchísimo' }),
    ])
    const withoutNote = insightsFor([
      makeSession({ sessionDate: TODAY, sensationAfter: 'great', notes: null }),
    ])
    expect(withNote.trend).toBe(withoutNote.trend)
    expect(withNote.metrics).toEqual(withoutNote.metrics)
  })
})

// ── Copy safety ─────────────────────────────────────────────────────────────────

describe('buildHistoryInsights — copy safety', () => {
  const forbidden =
    /diagn[oó]stico|tratamiento|piel da[ñn]ada|todo seguro|sin riesgo|perfecto para tomar m[aá]s sol|\brecuperado\b|puedes volver al sol|progreso m[eé]dico|\bsegur[oa]\b/i

  const scenarios: ExposureSession[][] = [
    [],
    [makeSession({ sessionDate: TODAY, sensationAfter: 'great' })],
    [makeSession({ sessionDate: TODAY, sensationAfter: 'warm_tight' })],
    [makeSession({ sessionDate: YESTERDAY, sensationAfter: 'slightly_red' })],
    [makeSession({ sessionDate: TODAY, sensationAfter: 'burned' })],
  ]

  it('never uses medical or unsafe wording', () => {
    for (const sessions of scenarios) {
      const result = insightsFor(sessions)
      const strings = [
        result.title,
        result.explanation,
        result.cautionNote ?? '',
        ...result.reasons,
      ]
      for (const s of strings) {
        expect(s).not.toMatch(forbidden)
      }
    }
  })

  it('recovery_needed includes a non-medical-advice disclaimer in its note', () => {
    const result = insightsFor([makeSession({ sessionDate: TODAY, sensationAfter: 'burned' })])
    expect(result.cautionNote).toContain('No es consejo médico')
  })
})

// ── Reasons ─────────────────────────────────────────────────────────────────────

describe('buildHistoryInsights — reasons', () => {
  it('summarises session count for non-empty trends', () => {
    const result = insightsFor([makeSession({ sessionDate: TODAY, sensationAfter: 'great' })])
    expect(result.reasons[0]).toContain('1 sesión en los últimos 7 días')
  })

  it('uses plural wording for multiple sessions', () => {
    const sessions: ExposureSession[] = [
      makeSession({ id: 'a', sessionDate: TODAY }),
      makeSession({ id: 'b', sessionDate: YESTERDAY }),
    ]
    const result = insightsFor(sessions)
    expect(result.reasons[0]).toContain('2 sesiones')
  })
})

// ── Exhaustive trend mapping ─────────────────────────────────────────────────────

describe('buildHistoryInsights — same-day response drives trend', () => {
  const EXPECTED: Record<SensationAfter, string> = {
    great: 'stable',
    normal: 'stable',
    warm_tight: 'caution',
    slightly_red: 'recovery_needed',
    burned: 'recovery_needed',
  }

  it.each(Object.keys(EXPECTED) as SensationAfter[])('maps "%s" today to the right trend', (s) => {
    const result = insightsFor([makeSession({ sessionDate: TODAY, sensationAfter: s })])
    expect(result.trend).toBe(EXPECTED[s])
  })
})
