import {
  formatEtaDate,
  formatPlanDuration,
  PLAN_STATUS_MESSAGES,
  TAN_LEVEL_LABELS,
} from './plan.labels'

describe('TAN_LEVEL_LABELS', () => {
  it('has a Spanish label for every level', () => {
    expect(TAN_LEVEL_LABELS.natural).toBe('Tono natural')
    expect(TAN_LEVEL_LABELS.deep_bronze).toBe('Bronceado intenso')
  })
})

describe('formatEtaDate', () => {
  it('returns a not-reachable message for null', () => {
    expect(formatEtaDate(null)).toBe('No alcanzable de forma segura')
  })

  it('formats an ISO date as DD/MM/YYYY', () => {
    expect(formatEtaDate('2026-07-12')).toBe('12/07/2026')
  })
})

describe('formatPlanDuration', () => {
  it('handles already-reached plans', () => {
    expect(formatPlanDuration(0)).toBe('Ya alcanzado')
  })

  it('reports days under a week', () => {
    expect(formatPlanDuration(5)).toBe('5 días')
  })

  it('rounds to whole weeks', () => {
    expect(formatPlanDuration(7)).toBe('1 semana')
    expect(formatPlanDuration(21)).toBe('3 semanas')
  })
})

describe('PLAN_STATUS_MESSAGES', () => {
  it('has a message for each status', () => {
    expect(PLAN_STATUS_MESSAGES.ok).toContain('alcanzable')
    expect(PLAN_STATUS_MESSAGES.goal_exceeds_safe_ceiling).toContain('segura')
  })
})
