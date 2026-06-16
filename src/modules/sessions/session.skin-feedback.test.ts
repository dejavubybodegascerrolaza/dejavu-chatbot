import { buildRecoveryStatus } from '../recovery/recovery.engine'
import type { RecoveryLevel } from '../recovery/recovery.types'
import { SENSATION_DESCRIPTIONS, SENSATION_LABELS, UV_BUCKETS } from './session.labels'
import { uvIndexToFormValue } from './session.prefill'
import type { ExposureSession, SensationAfter } from './session.types'
import type { UvCategory } from '../uv/uv.types'

const ALL_SENSATIONS: SensationAfter[] = ['great', 'normal', 'warm_tight', 'slightly_red', 'burned']

// ── Skin-response copy ──────────────────────────────────────────────────────────

describe('skin response copy', () => {
  it('has a non-empty description for every sensation', () => {
    for (const sensation of ALL_SENSATIONS) {
      expect(SENSATION_DESCRIPTIONS[sensation]).toBeDefined()
      expect(SENSATION_DESCRIPTIONS[sensation].length).toBeGreaterThan(0)
    }
  })

  it('avoids medical claims and unsafe wording', () => {
    const forbidden =
      /diagn[oó]stico|quemadura tratada|piel da[ñn]ada|sin riesgo|garantiz|recuperado|puedes volver al sol|respuesta detectada|todo correcto|\bsegur[oa]\b/i

    const strings = [...Object.values(SENSATION_LABELS), ...Object.values(SENSATION_DESCRIPTIONS)]
    for (const s of strings) {
      expect(s).not.toMatch(forbidden)
    }
  })
})

// ── Skin response → Recovery (feedback loop) ────────────────────────────────────

describe('skin response feeds Recovery through existing rules', () => {
  const TODAY = '2026-06-15'

  function sessionWith(sensationAfter: SensationAfter): ExposureSession {
    return {
      id: 'sess-1',
      userId: 'user-1',
      sessionDate: TODAY,
      durationMinutes: 30,
      context: 'beach',
      uvIndexManual: 6,
      protectionLevel: 'medium',
      sensationAfter,
      notes: null,
      createdAt: `${TODAY}T12:00:00Z`,
      updatedAt: `${TODAY}T12:00:00Z`,
    }
  }

  const EXPECTED: Record<SensationAfter, RecoveryLevel> = {
    great: 'none',
    normal: 'none',
    warm_tight: 'caution',
    slightly_red: 'recovery_recommended',
    burned: 'avoid_direct_exposure',
  }

  it.each(ALL_SENSATIONS)('maps a same-day "%s" response to the expected recovery level', (s) => {
    const result = buildRecoveryStatus({ recentSessions: [sessionWith(s)], today: TODAY })
    expect(result.level).toBe(EXPECTED[s])
  })
})

// ── UV buckets: single source of truth ──────────────────────────────────────────

describe('UV_BUCKETS shared source', () => {
  it('covers every UV category exactly once', () => {
    const categories = UV_BUCKETS.map((b) => b.category)
    const expected: UvCategory[] = ['low', 'moderate', 'high', 'very_high', 'extreme']
    expect(new Set(categories)).toEqual(new Set(expected))
    expect(categories).toHaveLength(expected.length)
  })

  it('has unique values', () => {
    const values = UV_BUCKETS.map((b) => b.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('drives the prefill mapping (uvIndexToFormValue returns only bucket values)', () => {
    const bucketValues = new Set(UV_BUCKETS.map((b) => b.value))
    for (const uv of [0, 2, 3, 5, 6, 7, 8, 10, 11, 14]) {
      expect(bucketValues.has(uvIndexToFormValue(uv))).toBe(true)
    }
  })
})
