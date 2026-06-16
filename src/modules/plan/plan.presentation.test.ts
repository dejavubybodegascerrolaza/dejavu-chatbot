import { resolvePlanStatus, PLAN_ADJUSTMENT_NOTES } from './plan.presentation'
import { ADHERENCE_STATUS_LABELS } from '../adherence/adherence.labels'
import type { TanPlanResult } from './plan.types'
import type { PlanAdherence, AdherenceStatus } from '../adherence/adherence.types'

function makePlan(overrides: Partial<TanPlanResult> = {}): TanPlanResult {
  return {
    status: 'ok',
    goalLevel: 'golden',
    reachableLevel: 'golden',
    etaDate: '2026-07-06',
    totalDays: 21,
    sessionDays: 9,
    dailySafeMinutes: 20,
    milestones: [],
    ...overrides,
  }
}

function makeAdherence(status: AdherenceStatus): PlanAdherence {
  return {
    status,
    completedSessions: 3,
    expectedSessions: 4,
    sessionDeficit: status === 'slightly_behind' ? 2 : 0,
    adjustedEtaDate: null,
    summary: '',
  }
}

// ── State mapping ───────────────────────────────────────────────────────────────

describe('resolvePlanStatus', () => {
  it('returns no_plan when there is no plan', () => {
    expect(resolvePlanStatus(null, null).key).toBe('no_plan')
  })

  it('returns paused_recovery when the plan is paused', () => {
    const result = resolvePlanStatus(makePlan({ status: 'paused_recovery' }), null)
    expect(result.key).toBe('paused_recovery')
  })

  it('returns paused_recovery when adherence is paused even if plan status is ok', () => {
    const result = resolvePlanStatus(makePlan(), makeAdherence('paused_recovery'))
    expect(result.key).toBe('paused_recovery')
  })

  it('returns slightly_behind from adherence', () => {
    expect(resolvePlanStatus(makePlan(), makeAdherence('slightly_behind')).key).toBe(
      'slightly_behind'
    )
  })

  it('returns on_track from adherence', () => {
    expect(resolvePlanStatus(makePlan(), makeAdherence('on_track')).key).toBe('on_track')
  })

  it('returns insufficient_data when adherence is unknown or missing', () => {
    expect(resolvePlanStatus(makePlan(), null).key).toBe('insufficient_data')
    expect(resolvePlanStatus(makePlan(), makeAdherence('unknown')).key).toBe('insufficient_data')
    expect(resolvePlanStatus(makePlan(), makeAdherence('insufficient_data')).key).toBe(
      'insufficient_data'
    )
  })

  it('prioritises recovery pause over a behind status', () => {
    // paused should win even if a deficit also exists
    const result = resolvePlanStatus(
      makePlan({ status: 'paused_recovery' }),
      makeAdherence('slightly_behind')
    )
    expect(result.key).toBe('paused_recovery')
  })
})

// ── Tone + shared labels ─────────────────────────────────────────────────────────

describe('resolvePlanStatus — tone and labels', () => {
  it('uses positive tone only for on_track', () => {
    expect(resolvePlanStatus(makePlan(), makeAdherence('on_track')).tone).toBe('positive')
  })

  it('uses caution tone for behind and paused', () => {
    expect(resolvePlanStatus(makePlan(), makeAdherence('slightly_behind')).tone).toBe('caution')
    expect(resolvePlanStatus(makePlan({ status: 'paused_recovery' }), null).tone).toBe('caution')
  })

  it('shares titles with the adherence status labels', () => {
    expect(resolvePlanStatus(makePlan(), makeAdherence('on_track')).title).toBe(
      ADHERENCE_STATUS_LABELS.on_track
    )
    expect(resolvePlanStatus(makePlan(), makeAdherence('slightly_behind')).title).toBe(
      ADHERENCE_STATUS_LABELS.slightly_behind
    )
    expect(resolvePlanStatus(makePlan({ status: 'paused_recovery' }), null).title).toBe(
      ADHERENCE_STATUS_LABELS.paused_recovery
    )
  })
})

// ── Copy safety ─────────────────────────────────────────────────────────────────

describe('plan presentation — copy safety', () => {
  const forbidden =
    /fecha garantizada|dosis segura|sin riesgo|puedes acelerar|recupera tomando m[aá]s sol|bronceado seguro|todo correcto|ya est[aá]s recuperado|garantiz/i

  it('status copy never uses absolute or catch-up wording', () => {
    const statuses: (AdherenceStatus | null)[] = [
      null,
      'unknown',
      'insufficient_data',
      'on_track',
      'slightly_behind',
      'paused_recovery',
    ]
    const plans: (TanPlanResult | null)[] = [
      null,
      makePlan(),
      makePlan({ status: 'paused_recovery' }),
    ]
    for (const plan of plans) {
      for (const status of statuses) {
        const result = resolvePlanStatus(plan, status === null ? null : makeAdherence(status))
        expect(result.title).not.toMatch(forbidden)
        expect(result.detail).not.toMatch(forbidden)
      }
    }
  })

  it('adjustment notes are conservative and explicitly anti catch-up', () => {
    for (const note of PLAN_ADJUSTMENT_NOTES) {
      expect(note).not.toMatch(forbidden)
    }
    const joined = PLAN_ADJUSTMENT_NOTES.join(' ')
    expect(joined).toContain('forzando más sol')
    expect(joined).toContain('constancia')
  })

  it('on_track frames the ETA as an estimate, not a guarantee', () => {
    expect(resolvePlanStatus(makePlan(), makeAdherence('on_track')).detail).toContain(
      'Estimación, no garantía'
    )
  })

  it('paused_recovery explains the pause without medical claims', () => {
    const detail = resolvePlanStatus(makePlan({ status: 'paused_recovery' }), null).detail
    expect(detail).toContain('recuperación')
    expect(detail).toContain('forzando más sol')
  })
})
