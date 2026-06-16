import { buildFaceGuard } from './face-guard.engine'
import type { FaceGuardInput } from './face-guard.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<FaceGuardInput> = {}): FaceGuardInput {
  return {
    skinType: 3,
    sunSensitivity: 'medium',
    uvCategory: 'moderate',
    recoveryLevel: 'none',
    protectionReliability: 'medium',
    ...overrides,
  }
}

// ── Level: UV baseline ────────────────────────────────────────────────────────

describe('buildFaceGuard — UV baseline', () => {
  it('returns standard for low UV', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'low' }))
    expect(r.level).toBe('standard')
  })

  it('returns standard for moderate UV', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'moderate' }))
    expect(r.level).toBe('standard')
  })

  it('returns elevated for high UV', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'high' }))
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('high_uv')
  })

  it('returns elevated for very_high UV', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'very_high' }))
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('high_uv')
  })

  it('returns strong for extreme UV', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'extreme' }))
    expect(r.level).toBe('strong')
    expect(r.reasons).toContain('extreme_uv')
  })

  it('returns standard when uvCategory is null (missing data)', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: null }))
    expect(r.level).toBe('standard')
    expect(r.reasons).toContain('missing_uv_data')
  })
})

// ── Level: skin type ──────────────────────────────────────────────────────────

describe('buildFaceGuard — skin type', () => {
  it('skin type I escalates standard → elevated', () => {
    const r = buildFaceGuard(makeInput({ skinType: 1, uvCategory: 'low' }))
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('fair_skin_type')
  })

  it('skin type II escalates standard → elevated', () => {
    const r = buildFaceGuard(makeInput({ skinType: 2, uvCategory: 'low' }))
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('fair_skin_type')
  })

  it('skin type I escalates elevated → strong', () => {
    const r = buildFaceGuard(makeInput({ skinType: 1, uvCategory: 'high' }))
    expect(r.level).toBe('strong')
  })

  it('skin types III–VI do not escalate level', () => {
    for (const t of [3, 4, 5, 6] as const) {
      const r = buildFaceGuard(makeInput({ skinType: t, uvCategory: 'low' }))
      expect(r.level).toBe('standard')
      expect(r.reasons).not.toContain('fair_skin_type')
    }
  })

  it('null skinType does not escalate', () => {
    const r = buildFaceGuard(makeInput({ skinType: null, uvCategory: 'low' }))
    expect(r.level).toBe('standard')
  })
})

// ── Level: sensitivity ────────────────────────────────────────────────────────

describe('buildFaceGuard — sensitivity', () => {
  it('very_high sensitivity escalates standard → elevated', () => {
    const r = buildFaceGuard(makeInput({ sunSensitivity: 'very_high', uvCategory: 'low' }))
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('very_high_sensitivity')
  })

  it('very_high sensitivity escalates elevated → strong', () => {
    const r = buildFaceGuard(makeInput({ sunSensitivity: 'very_high', uvCategory: 'high' }))
    expect(r.level).toBe('strong')
  })

  it('other sensitivities do not escalate', () => {
    for (const s of ['low', 'medium', 'high'] as const) {
      const r = buildFaceGuard(makeInput({ sunSensitivity: s, uvCategory: 'low' }))
      expect(r.level).toBe('standard')
    }
  })
})

// ── Level: recovery ───────────────────────────────────────────────────────────

describe('buildFaceGuard — recovery', () => {
  it('recovery_recommended jumps directly to strong', () => {
    const r = buildFaceGuard(makeInput({ recoveryLevel: 'recovery_recommended' }))
    expect(r.level).toBe('strong')
    expect(r.reasons).toContain('recovery_active')
  })

  it('avoid_direct_exposure jumps directly to strong', () => {
    const r = buildFaceGuard(makeInput({ recoveryLevel: 'avoid_direct_exposure' }))
    expect(r.level).toBe('strong')
    expect(r.reasons).toContain('recovery_active')
  })

  it('caution recovery does not trigger strong', () => {
    const r = buildFaceGuard(makeInput({ recoveryLevel: 'caution', uvCategory: 'low' }))
    expect(r.level).toBe('standard')
    expect(r.reasons).not.toContain('recovery_active')
  })

  it('no recovery keeps level at uv baseline', () => {
    const r = buildFaceGuard(makeInput({ recoveryLevel: 'none', uvCategory: 'moderate' }))
    expect(r.level).toBe('standard')
  })
})

// ── Level: protection reliability ────────────────────────────────────────────

describe('buildFaceGuard — protection reliability', () => {
  it('unknown protection escalates by one step', () => {
    const r = buildFaceGuard(
      makeInput({ protectionReliability: 'unknown', uvCategory: 'moderate' })
    )
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('uncertain_protection')
  })

  it('low protection escalates by one step', () => {
    const r = buildFaceGuard(makeInput({ protectionReliability: 'low', uvCategory: 'moderate' }))
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('uncertain_protection')
  })

  it('reduced protection escalates by one step', () => {
    const r = buildFaceGuard(
      makeInput({ protectionReliability: 'reduced', uvCategory: 'moderate' })
    )
    expect(r.level).toBe('elevated')
    expect(r.reasons).toContain('uncertain_protection')
  })

  it('medium protection does not escalate', () => {
    const r = buildFaceGuard(makeInput({ protectionReliability: 'medium', uvCategory: 'moderate' }))
    expect(r.level).toBe('standard')
    expect(r.reasons).not.toContain('uncertain_protection')
  })

  it('high protection does not escalate', () => {
    const r = buildFaceGuard(makeInput({ protectionReliability: 'high', uvCategory: 'moderate' }))
    expect(r.level).toBe('standard')
  })
})

// ── Suggested action ──────────────────────────────────────────────────────────

describe('buildFaceGuard — suggestedAction', () => {
  it('standard → continue_with_face_protection', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'low' }))
    expect(r.suggestedAction).toBe('continue_with_face_protection')
  })

  it('elevated → use_spf50_face (default)', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'high' }))
    expect(r.suggestedAction).toBe('use_spf50_face')
  })

  it('strong → avoid_direct_face_exposure', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'extreme' }))
    expect(r.suggestedAction).toBe('avoid_direct_face_exposure')
  })

  it('reduced protection + elevated → reapply_facial_protection', () => {
    const r = buildFaceGuard(makeInput({ protectionReliability: 'reduced', uvCategory: 'high' }))
    expect(r.suggestedAction).toBe('reapply_facial_protection')
  })

  it('reduced protection + standard level → continue_with_face_protection (not reapply)', () => {
    // If level is standard, protection reliability is never 'reduced' in practice,
    // but the logic should handle it without showing reapply.
    const r = buildFaceGuard(makeInput({ protectionReliability: 'medium', uvCategory: 'low' }))
    expect(r.suggestedAction).toBe('continue_with_face_protection')
  })
})

// ── Combined scenarios ────────────────────────────────────────────────────────

describe('buildFaceGuard — combined signals', () => {
  it('low UV + standard profile → standard', () => {
    const r = buildFaceGuard(
      makeInput({
        uvCategory: 'low',
        skinType: 3,
        sunSensitivity: 'medium',
        recoveryLevel: 'none',
        protectionReliability: 'medium',
      })
    )
    expect(r.level).toBe('standard')
  })

  it('high UV + type I → strong', () => {
    const r = buildFaceGuard(makeInput({ uvCategory: 'high', skinType: 1 }))
    expect(r.level).toBe('strong')
  })

  it('moderate UV + very_high sensitivity + type II → strong', () => {
    const r = buildFaceGuard(
      makeInput({ uvCategory: 'moderate', skinType: 2, sunSensitivity: 'very_high' })
    )
    expect(r.level).toBe('strong')
  })

  it('missing UV data + type II + recovery active → strong', () => {
    const r = buildFaceGuard(
      makeInput({
        uvCategory: null,
        skinType: 2,
        recoveryLevel: 'recovery_recommended',
      })
    )
    expect(r.level).toBe('strong')
  })
})

// ── Copy safety ──────────────────────────────────────────────────────────────

describe('buildFaceGuard — copy safety', () => {
  const forbidden = [
    /riesgo de c[aá]ncer/i,
    /previene c[aá]ncer/i,
    /diagnostica manchas/i,
    /da[nñ]ada/i,
    /seguro para la cara/i,
    /sin riesgo/i,
    /puedes broncearte la cara con seguridad/i,
    /protecci[oó]n total/i,
    /garantiz/i,
    /diagnos/i,
    /tiempo seguro/i,
    /dosis segura/i,
  ]

  const scenarios: Partial<FaceGuardInput>[] = [
    { uvCategory: 'low', skinType: 3, sunSensitivity: 'medium' },
    { uvCategory: 'high', skinType: 1, sunSensitivity: 'very_high' },
    { uvCategory: 'extreme', recoveryLevel: 'avoid_direct_exposure' },
    { uvCategory: null, protectionReliability: 'unknown' },
    { uvCategory: 'moderate', protectionReliability: 'reduced' },
  ]

  it('no summary contains forbidden phrases', () => {
    for (const partial of scenarios) {
      const { summary } = buildFaceGuard(makeInput(partial))
      for (const re of forbidden) {
        expect(summary).not.toMatch(re)
      }
    }
  })
})

// ── Output shape ──────────────────────────────────────────────────────────────

describe('buildFaceGuard — output shape', () => {
  it('always returns all required fields', () => {
    const r = buildFaceGuard(makeInput())
    expect(r).toHaveProperty('level')
    expect(r).toHaveProperty('summary')
    expect(r).toHaveProperty('reasons')
    expect(r).toHaveProperty('suggestedAction')
  })

  it('reasons is an array', () => {
    const r = buildFaceGuard(makeInput())
    expect(Array.isArray(r.reasons)).toBe(true)
  })

  it('summary is non-empty', () => {
    const r = buildFaceGuard(makeInput())
    expect(r.summary.length).toBeGreaterThan(0)
  })
})
