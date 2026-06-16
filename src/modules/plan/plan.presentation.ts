import { ADHERENCE_STATUS_LABELS } from '../adherence/adherence.labels'
import type { PlanAdherence } from '../adherence/adherence.types'
import type { TanPlanResult } from './plan.types'

/**
 * At-a-glance plan state for the Plan screen's status card. Composed purely from
 * existing plan + adherence outputs — this never re-derives plan or recovery
 * rules, it only maps already-computed statuses to conservative copy.
 */
export type PlanStatusKey =
  | 'no_plan'
  | 'on_track'
  | 'slightly_behind'
  | 'paused_recovery'
  | 'insufficient_data'

export type PlanStatusTone = 'neutral' | 'positive' | 'caution'

export type PlanStatusSummary = {
  key: PlanStatusKey
  tone: PlanStatusTone
  title: string
  detail: string
}

/**
 * Short, conservative lines explaining how Bronze IQ adjusts a plan. Kept as
 * data (not JSX) so copy safety can be unit-tested. Never encourages catching up
 * by taking more sun.
 */
export const PLAN_ADJUSTMENT_NOTES: readonly string[] = [
  'Tu plan se ajusta con tus sesiones registradas.',
  'Si hubo rojez, calor o tirantez, Bronze IQ reduce el margen.',
  'La recuperación pausa la progresión del plan.',
  'No recomendamos recuperar exposición forzando más sol. La constancia sin sobreexposición es el objetivo.',
]

const DETAILS: Record<PlanStatusKey, string> = {
  no_plan: 'Elige un objetivo de tono para que Bronze IQ estime un ritmo orientativo.',
  on_track: 'Vas al ritmo estimado. Estimación, no garantía.',
  slightly_behind:
    'Necesitas registrar más sesiones para mantener el ritmo. La constancia sin sobreexposición es el objetivo.',
  paused_recovery:
    'Plan pausado por recuperación. Se reanuda cuando tu piel esté bien. No recomendamos recuperar exposición forzando más sol.',
  insufficient_data:
    'Registra algunas sesiones para estimar tu ritmo. Tu plan se ajusta con tus sesiones registradas.',
}

const TITLES: Record<PlanStatusKey, string> = {
  no_plan: 'Sin plan activo',
  on_track: ADHERENCE_STATUS_LABELS.on_track,
  slightly_behind: ADHERENCE_STATUS_LABELS.slightly_behind,
  paused_recovery: ADHERENCE_STATUS_LABELS.paused_recovery,
  insufficient_data: ADHERENCE_STATUS_LABELS.insufficient_data,
}

const TONES: Record<PlanStatusKey, PlanStatusTone> = {
  no_plan: 'neutral',
  on_track: 'positive',
  slightly_behind: 'caution',
  paused_recovery: 'caution',
  insufficient_data: 'neutral',
}

function summary(key: PlanStatusKey): PlanStatusSummary {
  return { key, tone: TONES[key], title: TITLES[key], detail: DETAILS[key] }
}

/**
 * Maps an active plan + its adherence into a single at-a-glance status.
 *
 * Recovery pause takes priority (from either the plan or the adherence engine),
 * then behind/on-track, otherwise we are still gathering data. Goal edge states
 * (already reached / above ceiling) are intentionally not handled here — the
 * detailed plan card explains those.
 */
export function resolvePlanStatus(
  plan: TanPlanResult | null,
  adherence: PlanAdherence | null
): PlanStatusSummary {
  if (plan === null) return summary('no_plan')
  if (plan.status === 'paused_recovery' || adherence?.status === 'paused_recovery') {
    return summary('paused_recovery')
  }
  if (adherence?.status === 'slightly_behind') return summary('slightly_behind')
  if (adherence?.status === 'on_track') return summary('on_track')
  return summary('insufficient_data')
}
