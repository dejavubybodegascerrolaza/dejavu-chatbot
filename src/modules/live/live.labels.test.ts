import { formatClock, LIVE_STATUS_LABELS, LIVE_STATUS_MESSAGES } from './live.labels'

describe('formatClock', () => {
  it('formats under a minute', () => {
    expect(formatClock(5)).toBe('00:05')
  })

  it('formats minutes and seconds', () => {
    expect(formatClock(125)).toBe('02:05')
  })

  it('formats past an hour', () => {
    expect(formatClock(3725)).toBe('1:02:05')
  })

  it('clamps negatives to zero', () => {
    expect(formatClock(-30)).toBe('00:00')
  })
})

describe('live status copy', () => {
  it('has a label and message for every status', () => {
    expect(LIVE_STATUS_LABELS.danger).toBe('Cúbrete ya')
    expect(LIVE_STATUS_MESSAGES.caution).toContain('dosis segura')
    expect(LIVE_STATUS_MESSAGES.no_risk).toContain('UV')
  })
})
