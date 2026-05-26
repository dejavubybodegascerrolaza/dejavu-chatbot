import { formatDisplayDate, getTodayISODate } from './date'

describe('formatDisplayDate', () => {
  it('formats YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDisplayDate('2026-05-25')).toBe('25/05/2026')
  })

  it('pads single-digit month and day', () => {
    expect(formatDisplayDate('2026-01-07')).toBe('07/01/2026')
  })

  it('handles year boundary', () => {
    expect(formatDisplayDate('2025-12-31')).toBe('31/12/2025')
  })
})

describe('getTodayISODate', () => {
  it('returns a string matching YYYY-MM-DD', () => {
    const result = getTodayISODate()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
