import {
  formatPeakWindow,
  UV_CATEGORY_ADVICE,
  UV_CATEGORY_LABELS,
  UV_CATEGORY_TO_BADGE,
} from './uv.labels'

describe('UV labels', () => {
  it('has a Spanish label for every category', () => {
    expect(UV_CATEGORY_LABELS.low).toBe('Bajo')
    expect(UV_CATEGORY_LABELS.extreme).toBe('Extremo')
  })

  it('has advice for every category', () => {
    expect(UV_CATEGORY_ADVICE.high).toContain('Protección')
    expect(UV_CATEGORY_ADVICE.extreme).toContain('extremo')
  })

  it('maps categories to badge levels', () => {
    expect(UV_CATEGORY_TO_BADGE.low).toBe('low')
    expect(UV_CATEGORY_TO_BADGE.extreme).toBe('avoid')
  })
})

describe('formatPeakWindow', () => {
  it('returns a no-peak message for null', () => {
    expect(formatPeakWindow(null)).toBe('Sin pico de riesgo alto hoy')
  })

  it('formats a window with zero-padded hours', () => {
    expect(formatPeakWindow({ startHour: 9, endHour: 16, maxUvIndex: 8 })).toBe('de 09:00 a 16:00')
  })
})
