import { getReasonLabel, LEVEL_LABELS, LEVEL_SUBTEXTS } from './recommendation.labels'
import type { RecommendationLevel } from './recommendation.types'

const ALL_LEVELS: RecommendationLevel[] = ['low', 'moderate', 'caution', 'high_caution', 'rest']

describe('getReasonLabel', () => {
  it('returns label for burned_recently', () => {
    expect(getReasonLabel('burned_recently')).toContain('exceso')
  })

  it('returns label for slightly_red_recently', () => {
    expect(getReasonLabel('slightly_red_recently')).toContain('enrojecimiento')
  })

  it('returns label for warm_tight_recently', () => {
    expect(getReasonLabel('warm_tight_recently')).toContain('tirante')
  })

  it('returns label for low_weekly_load', () => {
    expect(getReasonLabel('low_weekly_load')).toContain('baja')
  })

  it('returns label for moderate_weekly_load', () => {
    expect(getReasonLabel('moderate_weekly_load')).toContain('moderada')
  })

  it('returns label for caution_weekly_load', () => {
    expect(getReasonLabel('caution_weekly_load')).toContain('acumulado')
  })

  it('returns label for high_weekly_load', () => {
    expect(getReasonLabel('high_weekly_load')).toContain('elevada')
  })

  it('returns label for very_high_weekly_load', () => {
    expect(getReasonLabel('very_high_weekly_load')).toContain('descanso')
  })

  it('returns label for high_uv_today', () => {
    expect(getReasonLabel('high_uv_today')).toContain('UV')
  })

  it('returns fallback for unknown reason', () => {
    const fallback = getReasonLabel('totally_unknown_reason')
    expect(typeof fallback).toBe('string')
    expect(fallback.length).toBeGreaterThan(0)
    expect(fallback).toContain('historial')
  })
})

describe('LEVEL_LABELS', () => {
  it('has a label for every RecommendationLevel', () => {
    for (const level of ALL_LEVELS) {
      expect(LEVEL_LABELS[level]).toBeDefined()
      expect(typeof LEVEL_LABELS[level]).toBe('string')
      expect(LEVEL_LABELS[level].length).toBeGreaterThan(0)
    }
  })

  it('maps level values to human-readable labels', () => {
    expect(LEVEL_LABELS.low).toBe('Bajo')
    expect(LEVEL_LABELS.moderate).toBe('Moderado')
    expect(LEVEL_LABELS.caution).toBe('Prudencia')
    expect(LEVEL_LABELS.high_caution).toBe('Prudencia alta')
    expect(LEVEL_LABELS.rest).toBe('Descanso recomendado')
  })
})

describe('LEVEL_SUBTEXTS', () => {
  it('has a subtext for every RecommendationLevel', () => {
    for (const level of ALL_LEVELS) {
      expect(LEVEL_SUBTEXTS[level]).toBeDefined()
      expect(typeof LEVEL_SUBTEXTS[level]).toBe('string')
      expect(LEVEL_SUBTEXTS[level].length).toBeGreaterThan(0)
    }
  })
})
