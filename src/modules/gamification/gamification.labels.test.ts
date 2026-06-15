import {
  ACHIEVEMENT_DESCRIPTIONS,
  ACHIEVEMENT_LABELS,
  formatStreakMessage,
} from './gamification.labels'

describe('achievement labels', () => {
  it('has a label and description for every achievement', () => {
    expect(ACHIEVEMENT_LABELS.first_session).toBe('Primera sesión')
    expect(ACHIEVEMENT_LABELS.protected_month).toBe('Mes protegido')
    expect(ACHIEVEMENT_DESCRIPTIONS.explorer).toContain('contextos')
  })
})

describe('formatStreakMessage', () => {
  it('encourages starting when the streak is 0', () => {
    expect(formatStreakMessage(0)).toBe('Empieza hoy a cuidar tu piel')
  })

  it('uses the singular for one day', () => {
    expect(formatStreakMessage(1)).toBe('1 día cuidando tu piel')
  })

  it('uses the plural for multiple days', () => {
    expect(formatStreakMessage(12)).toBe('12 días cuidando tu piel')
  })
})
