import { BODY_EXPOSURE_LABELS, formatMinutes, formatVitaminDIu } from './sun.labels'

describe('formatMinutes', () => {
  it('returns a no-limit message for null', () => {
    expect(formatMinutes(null)).toBe('Sin límite práctico')
  })

  it('formats minutes under an hour', () => {
    expect(formatMinutes(45)).toBe('45 min')
  })

  it('formats whole hours', () => {
    expect(formatMinutes(120)).toBe('2 h')
  })

  it('formats hours and minutes', () => {
    expect(formatMinutes(95)).toBe('1 h 35 min')
  })
})

describe('formatVitaminDIu', () => {
  it('returns a no-synthesis message for zero or less', () => {
    expect(formatVitaminDIu(0)).toBe('Sin síntesis estimada')
    expect(formatVitaminDIu(-10)).toBe('Sin síntesis estimada')
  })

  it('formats an IU value with the UI suffix', () => {
    expect(formatVitaminDIu(4590)).toContain('UI')
    expect(formatVitaminDIu(4590)).toContain('≈')
  })
})

describe('BODY_EXPOSURE_LABELS', () => {
  it('has a Spanish label for each exposure level', () => {
    expect(BODY_EXPOSURE_LABELS.face_hands).toBe('Cara y manos')
    expect(BODY_EXPOSURE_LABELS.full_body).toBe('Cuerpo completo')
  })
})
