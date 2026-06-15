import {
  ceilingFor,
  clampSessionsPerWeek,
  isSessionDay,
  MAX_TAN_UNKNOWN,
  tanLevelIndex,
  tanRateFor,
  TAN_RATE_UNKNOWN,
} from './plan.rules'

describe('tanLevelIndex', () => {
  it('orders levels from light to deep', () => {
    expect(tanLevelIndex('natural')).toBe(0)
    expect(tanLevelIndex('deep_bronze')).toBe(4)
    expect(tanLevelIndex('golden')).toBeGreaterThan(tanLevelIndex('light_golden'))
  })
})

describe('ceilingFor / tanRateFor', () => {
  it('uses skin-type values when known', () => {
    expect(ceilingFor(1)).toBeLessThan(ceilingFor(6))
    expect(tanRateFor(1)).toBeLessThan(tanRateFor(6))
  })

  it('falls back to defaults when skin type is unknown', () => {
    expect(ceilingFor(null)).toBe(MAX_TAN_UNKNOWN)
    expect(tanRateFor(null)).toBe(TAN_RATE_UNKNOWN)
  })
})

describe('clampSessionsPerWeek', () => {
  it('defaults when undefined or invalid', () => {
    expect(clampSessionsPerWeek(undefined)).toBe(5)
    expect(clampSessionsPerWeek(Number.NaN)).toBe(5)
  })

  it('clamps to the 1–7 range and rounds', () => {
    expect(clampSessionsPerWeek(0)).toBe(1)
    expect(clampSessionsPerWeek(10)).toBe(7)
    expect(clampSessionsPerWeek(3.6)).toBe(4)
  })
})

describe('isSessionDay', () => {
  it('marks every day when sessions/week is 7', () => {
    for (let d = 0; d < 7; d++) {
      expect(isSessionDay(d, 7)).toBe(true)
    }
  })

  it('spreads N sessions across each 7-day window', () => {
    const count = Array.from({ length: 7 }, (_, d) => isSessionDay(d, 5)).filter(Boolean).length
    expect(count).toBe(5)
  })

  it('always includes day 0 as a session day', () => {
    expect(isSessionDay(0, 3)).toBe(true)
  })
})
