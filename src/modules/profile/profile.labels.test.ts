import {
  MAIN_GOAL_LABELS,
  SUN_SENSITIVITY_LABELS,
  SKIN_TYPE_LABELS,
  getSkinTypeLabel,
} from './profile.labels'
import type { MainGoal, SunSensitivity, SkinType } from './profile.types'

const ALL_GOALS: MainGoal[] = [
  'gradual_bronze',
  'avoid_overexposure',
  'track_sessions',
  'conscious_routine',
]

const ALL_SENSITIVITIES: SunSensitivity[] = ['very_high', 'high', 'medium', 'low']

const ALL_SKIN_TYPES: SkinType[] = [1, 2, 3, 4, 5, 6]

describe('MAIN_GOAL_LABELS', () => {
  it('has a label for every MainGoal', () => {
    for (const goal of ALL_GOALS) {
      expect(MAIN_GOAL_LABELS[goal]).toBeDefined()
      expect(MAIN_GOAL_LABELS[goal].length).toBeGreaterThan(0)
    }
  })

  it('maps gradual_bronze correctly', () => {
    expect(MAIN_GOAL_LABELS.gradual_bronze).toBe('Mantener un bronceado gradual')
  })

  it('maps avoid_overexposure correctly', () => {
    expect(MAIN_GOAL_LABELS.avoid_overexposure).toBe('Evitar pasarme con el sol')
  })
})

describe('SUN_SENSITIVITY_LABELS', () => {
  it('has a label for every SunSensitivity', () => {
    for (const s of ALL_SENSITIVITIES) {
      expect(SUN_SENSITIVITY_LABELS[s]).toBeDefined()
      expect(SUN_SENSITIVITY_LABELS[s].length).toBeGreaterThan(0)
    }
  })

  it('maps very_high correctly', () => {
    expect(SUN_SENSITIVITY_LABELS.very_high).toBe('Me quemo con facilidad')
  })
})

describe('SKIN_TYPE_LABELS', () => {
  it('has a label for types 1-6', () => {
    for (const t of ALL_SKIN_TYPES) {
      expect(SKIN_TYPE_LABELS[t]).toBeDefined()
    }
  })
})

describe('getSkinTypeLabel', () => {
  it('returns No indicado for null', () => {
    expect(getSkinTypeLabel(null)).toBe('No indicado')
  })

  it('returns label for type 1', () => {
    expect(getSkinTypeLabel(1)).toContain('Muy clara')
  })

  it('returns label for type 6', () => {
    expect(getSkinTypeLabel(6)).toContain('Muy oscura')
  })
})
