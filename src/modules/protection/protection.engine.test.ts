import { buildProtectionReality, spfToProtectionLevel } from './protection.engine'
import type { ProtectionRealityInput } from './protection.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<ProtectionRealityInput> = {}): ProtectionRealityInput {
  return {
    protectionLevel: 'medium',
    elapsedMinutes: 0,
    uvCategory: 'moderate',
    sunSensitivity: 'medium',
    ...overrides,
  }
}

// ── spfToProtectionLevel ──────────────────────────────────────────────────────

describe('spfToProtectionLevel', () => {
  it('returns none for spf 1 (no protection)', () => {
    expect(spfToProtectionLevel(1)).toBe('none')
  })

  it('returns none for undefined spf', () => {
    expect(spfToProtectionLevel(undefined)).toBe('none')
  })

  it('returns none for spf < 1', () => {
    expect(spfToProtectionLevel(0)).toBe('none')
  })

  it('returns medium for spf 30', () => {
    expect(spfToProtectionLevel(30)).toBe('medium')
  })

  it('returns high for spf 50', () => {
    expect(spfToProtectionLevel(50)).toBe('high')
  })

  it('returns high for spf >= 40', () => {
    expect(spfToProtectionLevel(40)).toBe('high')
    expect(spfToProtectionLevel(100)).toBe('high')
  })
})

// ── buildProtectionReality ────────────────────────────────────────────────────

describe('buildProtectionReality', () => {
  // ── Reliability from protectionLevel ───────────────────────────────────────

  describe('initial reliability from protectionLevel', () => {
    it('returns unknown when protectionLevel is unknown', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'unknown' }))
      expect(r.reliability).toBe('unknown')
    })

    it('returns unknown when protectionLevel is not_sure', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'not_sure' }))
      expect(r.reliability).toBe('unknown')
    })

    it('returns low when protectionLevel is none', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'none' }))
      expect(r.reliability).toBe('low')
    })

    it('returns medium when protectionLevel is medium and elapsed is short', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'medium', elapsedMinutes: 10 }))
      expect(r.reliability).toBe('medium')
    })

    it('returns high when protectionLevel is high and elapsed is short', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'high', elapsedMinutes: 10 }))
      expect(r.reliability).toBe('high')
    })
  })

  // ── Time-based degradation ──────────────────────────────────────────────────

  describe('time-based degradation (standard sensitivity)', () => {
    it('high protection: stays high below 90 min', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'high', elapsedMinutes: 89 }))
      expect(r.reliability).toBe('high')
      expect(r.reapplyWarning).toBe(false)
    })

    it('high protection: degrades to reduced at 90 min', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'high', elapsedMinutes: 90 }))
      expect(r.reliability).toBe('reduced')
      expect(r.reapplyWarning).toBe(true)
    })

    it('high protection: still reduced past 120 min', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'high', elapsedMinutes: 150 }))
      expect(r.reliability).toBe('reduced')
      expect(r.reapplyWarning).toBe(true)
    })

    it('medium protection: stays medium below 60 min', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'medium', elapsedMinutes: 59 }))
      expect(r.reliability).toBe('medium')
      expect(r.reapplyWarning).toBe(false)
    })

    it('medium protection: degrades to reduced at 60 min', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'medium', elapsedMinutes: 60 }))
      expect(r.reliability).toBe('reduced')
      expect(r.reapplyWarning).toBe(true)
    })

    it('low/none protection: no reapply warning (already at floor)', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'none', elapsedMinutes: 120 }))
      expect(r.reliability).toBe('low')
      expect(r.reapplyWarning).toBe(false)
    })

    it('unknown protection: no reapply warning', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'unknown', elapsedMinutes: 120 })
      )
      expect(r.reliability).toBe('unknown')
      expect(r.reapplyWarning).toBe(false)
    })
  })

  describe('time-based degradation (very_high sensitivity)', () => {
    it('high protection: degrades to reduced at 60 min for very_high sensitivity', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'high', elapsedMinutes: 60, sunSensitivity: 'very_high' })
      )
      expect(r.reliability).toBe('reduced')
      expect(r.reapplyWarning).toBe(true)
    })

    it('high protection: stays high at 59 min for very_high sensitivity', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'high', elapsedMinutes: 59, sunSensitivity: 'very_high' })
      )
      expect(r.reliability).toBe('high')
      expect(r.reapplyWarning).toBe(false)
    })

    it('medium protection: degrades to reduced at 40 min for very_high sensitivity', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'medium', elapsedMinutes: 40, sunSensitivity: 'very_high' })
      )
      expect(r.reliability).toBe('reduced')
      expect(r.reapplyWarning).toBe(true)
    })

    it('medium protection: stays medium at 39 min for very_high sensitivity', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'medium', elapsedMinutes: 39, sunSensitivity: 'very_high' })
      )
      expect(r.reliability).toBe('medium')
      expect(r.reapplyWarning).toBe(false)
    })
  })

  // ── Suggested action ────────────────────────────────────────────────────────

  describe('suggested action', () => {
    it('apply_protection when unknown', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'unknown' }))
      expect(r.suggestedAction).toBe('apply_protection')
    })

    it('keep_session_short when low (none)', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'none' }))
      expect(r.suggestedAction).toBe('keep_session_short')
    })

    it('continue_conservatively when medium and within threshold', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'medium', elapsedMinutes: 10 }))
      expect(r.suggestedAction).toBe('continue_conservatively')
    })

    it('continue_conservatively when high and within threshold', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'high', elapsedMinutes: 10 }))
      expect(r.suggestedAction).toBe('continue_conservatively')
    })

    it('reapply_protection when reliability is reduced', () => {
      const r = buildProtectionReality(makeInput({ protectionLevel: 'high', elapsedMinutes: 90 }))
      expect(r.suggestedAction).toBe('reapply_protection')
    })
  })

  // ── UV amplification ────────────────────────────────────────────────────────

  describe('UV amplification', () => {
    it('pause_direct_exposure when very_high UV + unknown protection', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'unknown', uvCategory: 'very_high' })
      )
      expect(r.suggestedAction).toBe('pause_direct_exposure')
    })

    it('pause_direct_exposure when extreme UV + none protection', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'none', uvCategory: 'extreme' })
      )
      expect(r.suggestedAction).toBe('pause_direct_exposure')
    })

    it('reapply_protection (not pause) when very_high UV + reduced protection', () => {
      // Reduced protection is more specific than unknown/low — reapply is the fix.
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'high', elapsedMinutes: 90, uvCategory: 'very_high' })
      )
      expect(r.suggestedAction).toBe('reapply_protection')
    })

    it('continue_conservatively when very_high UV + high protection and within threshold', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'high', elapsedMinutes: 10, uvCategory: 'very_high' })
      )
      expect(r.suggestedAction).toBe('continue_conservatively')
    })

    it('no UV amplification when uvCategory is moderate', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'unknown', uvCategory: 'moderate' })
      )
      expect(r.suggestedAction).toBe('apply_protection')
    })
  })

  // ── Sensitive profile ────────────────────────────────────────────────────────

  describe('sensitive profile + uncertain protection', () => {
    it('very_high sensitivity + unknown → apply_protection regardless of UV', () => {
      const r = buildProtectionReality(
        makeInput({ protectionLevel: 'unknown', sunSensitivity: 'very_high', uvCategory: 'low' })
      )
      expect(r.suggestedAction).toBe('apply_protection')
    })

    it('very_high sensitivity + unknown + very_high UV → pause_direct_exposure', () => {
      const r = buildProtectionReality(
        makeInput({
          protectionLevel: 'unknown',
          sunSensitivity: 'very_high',
          uvCategory: 'very_high',
        })
      )
      expect(r.suggestedAction).toBe('pause_direct_exposure')
    })
  })

  // ── Copy safety ──────────────────────────────────────────────────────────────

  describe('copy safety', () => {
    const forbidden = [
      /tiempo seguro/i,
      /dosis segura/i,
      /protección total/i,
      /sin riesgo/i,
      /puedes seguir sin problema/i,
      /spf.{0,10}protege.{0,15}d[íi]a/i,
      /seguro con spf/i,
      /garantiz/i,
      /diagnos/i,
    ]

    const inputs: Partial<ProtectionRealityInput>[] = [
      { protectionLevel: 'unknown' },
      { protectionLevel: 'none' },
      { protectionLevel: 'medium', elapsedMinutes: 10 },
      { protectionLevel: 'high', elapsedMinutes: 10 },
      { protectionLevel: 'high', elapsedMinutes: 90 },
      { protectionLevel: 'medium', elapsedMinutes: 60 },
      { protectionLevel: 'unknown', uvCategory: 'very_high' },
    ]

    it('no explanation contains forbidden phrases', () => {
      for (const partial of inputs) {
        const { explanation } = buildProtectionReality(makeInput(partial))
        for (const re of forbidden) {
          expect(explanation).not.toMatch(re)
        }
      }
    })
  })

  // ── Output shape ─────────────────────────────────────────────────────────────

  describe('output shape', () => {
    it('always returns all required fields', () => {
      const r = buildProtectionReality(makeInput())
      expect(r).toHaveProperty('reliability')
      expect(r).toHaveProperty('explanation')
      expect(r).toHaveProperty('suggestedAction')
      expect(r).toHaveProperty('reapplyWarning')
    })

    it('reapplyWarning is boolean', () => {
      const r = buildProtectionReality(makeInput())
      expect(typeof r.reapplyWarning).toBe('boolean')
    })
  })
})
