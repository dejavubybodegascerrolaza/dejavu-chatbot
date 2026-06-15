import { addDaysToISODate, daysBetweenISODates, formatDisplayDate, getTodayISODate } from './date'

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

describe('addDaysToISODate', () => {
  it('adds whole days', () => {
    expect(addDaysToISODate('2026-06-15', 10)).toBe('2026-06-25')
  })

  it('crosses month boundaries', () => {
    expect(addDaysToISODate('2026-06-25', 10)).toBe('2026-07-05')
  })

  it('crosses year boundaries', () => {
    expect(addDaysToISODate('2025-12-28', 5)).toBe('2026-01-02')
  })

  it('subtracts with a negative value', () => {
    expect(addDaysToISODate('2026-06-15', -1)).toBe('2026-06-14')
  })

  it('returns the same date when adding zero', () => {
    expect(addDaysToISODate('2026-06-15', 0)).toBe('2026-06-15')
  })
})

describe('daysBetweenISODates', () => {
  it('returns the day span between two dates', () => {
    expect(daysBetweenISODates('2026-06-15', '2026-06-25')).toBe(10)
  })

  it('returns 0 for the same date', () => {
    expect(daysBetweenISODates('2026-06-15', '2026-06-15')).toBe(0)
  })

  it('is negative when the second date is earlier', () => {
    expect(daysBetweenISODates('2026-06-15', '2026-06-14')).toBe(-1)
  })

  it('spans month and year boundaries', () => {
    expect(daysBetweenISODates('2025-12-28', '2026-01-02')).toBe(5)
  })
})
