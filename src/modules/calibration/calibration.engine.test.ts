import { buildCalibrationProfile } from './calibration.engine'

describe('buildCalibrationProfile', () => {
  // ── Confidence ───────────────────────────────────────────────────────────────

  describe('confidence', () => {
    it('returns high when skinType is provided', () => {
      const result = buildCalibrationProfile({ skinType: 3, sunSensitivity: 'medium' })
      expect(result.confidence).toBe('high')
    })

    it('returns medium when skinType is null', () => {
      const result = buildCalibrationProfile({ skinType: null, sunSensitivity: 'medium' })
      expect(result.confidence).toBe('medium')
    })

    it('returns high for all numeric skin types', () => {
      for (const t of [1, 2, 3, 4, 5, 6] as const) {
        expect(buildCalibrationProfile({ skinType: t, sunSensitivity: 'medium' }).confidence).toBe(
          'high'
        )
      }
    })
  })

  // ── Tier ─────────────────────────────────────────────────────────────────────

  describe('tier', () => {
    it('returns conservative when sunSensitivity is very_high (any skinType)', () => {
      expect(buildCalibrationProfile({ skinType: null, sunSensitivity: 'very_high' }).tier).toBe(
        'conservative'
      )
      expect(buildCalibrationProfile({ skinType: 4, sunSensitivity: 'very_high' }).tier).toBe(
        'conservative'
      )
    })

    it('returns conservative for skin type I regardless of sensitivity', () => {
      expect(buildCalibrationProfile({ skinType: 1, sunSensitivity: 'low' }).tier).toBe(
        'conservative'
      )
    })

    it('returns conservative for skin type II regardless of sensitivity', () => {
      expect(buildCalibrationProfile({ skinType: 2, sunSensitivity: 'medium' }).tier).toBe(
        'conservative'
      )
    })

    it('returns standard for skin types III–VI with non-very_high sensitivity', () => {
      for (const t of [3, 4, 5, 6] as const) {
        for (const s of ['low', 'medium', 'high'] as const) {
          expect(buildCalibrationProfile({ skinType: t, sunSensitivity: s }).tier).toBe('standard')
        }
      }
    })

    it('returns standard for null skinType with high sensitivity', () => {
      expect(buildCalibrationProfile({ skinType: null, sunSensitivity: 'high' }).tier).toBe(
        'standard'
      )
    })
  })

  // ── missingSkinType ───────────────────────────────────────────────────────────

  describe('missingSkinType', () => {
    it('is false when skinType is provided', () => {
      expect(
        buildCalibrationProfile({ skinType: 3, sunSensitivity: 'medium' }).missingSkinType
      ).toBe(false)
    })

    it('is true when skinType is null', () => {
      expect(
        buildCalibrationProfile({ skinType: null, sunSensitivity: 'medium' }).missingSkinType
      ).toBe(true)
    })
  })

  // ── Summary ──────────────────────────────────────────────────────────────────

  describe('summary', () => {
    it('says complete + conservative when high confidence + conservative tier', () => {
      const result = buildCalibrationProfile({ skinType: 1, sunSensitivity: 'low' })
      expect(result.summary).toContain('Calibración completa')
      expect(result.summary).toContain('prudentes')
    })

    it('says complete + adjusted when high confidence + standard tier', () => {
      const result = buildCalibrationProfile({ skinType: 4, sunSensitivity: 'medium' })
      expect(result.summary).toContain('Calibración completa')
      expect(result.summary).toContain('fototipo')
    })

    it('says partial and mentions skin type when medium confidence', () => {
      const result = buildCalibrationProfile({ skinType: null, sunSensitivity: 'medium' })
      expect(result.summary).toContain('Calibración parcial')
      expect(result.summary).toContain('fototipo')
    })

    it('summary does not contain forbidden safety words', () => {
      const forbidden = [
        /dosis segura/i,
        /tiempo seguro/i,
        /sin riesgo/i,
        /garantiz/i,
        /diagnos/i,
        /safe tanning/i,
        /sin quemarse/i,
        /piel segura/i,
        /bronceado seguro/i,
      ]
      const profiles = [
        { skinType: null, sunSensitivity: 'medium' as const },
        { skinType: 1 as const, sunSensitivity: 'very_high' as const },
        { skinType: 4 as const, sunSensitivity: 'low' as const },
      ]
      for (const input of profiles) {
        const { summary } = buildCalibrationProfile(input)
        for (const re of forbidden) {
          expect(summary).not.toMatch(re)
        }
      }
    })
  })

  // ── Shape ─────────────────────────────────────────────────────────────────────

  describe('output shape', () => {
    it('always returns all required fields', () => {
      const result = buildCalibrationProfile({ skinType: 3, sunSensitivity: 'medium' })
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('tier')
      expect(result).toHaveProperty('missingSkinType')
      expect(result).toHaveProperty('summary')
    })

    it('summary is a non-empty string', () => {
      const result = buildCalibrationProfile({ skinType: null, sunSensitivity: 'high' })
      expect(typeof result.summary).toBe('string')
      expect(result.summary.length).toBeGreaterThan(0)
    })
  })
})
