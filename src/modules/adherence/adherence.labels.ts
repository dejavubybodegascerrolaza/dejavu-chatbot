import type { AdherenceStatus } from './adherence.types'

/**
 * Short, shared chip labels for adherence status. Single source of truth used by
 * both the Home TanPlanCard and the Plan screen so the two never diverge.
 */
export const ADHERENCE_STATUS_LABELS: Record<AdherenceStatus, string> = {
  unknown: 'Estimando ritmo…',
  insufficient_data: 'Estimando ritmo…',
  on_track: 'En ritmo estimado',
  slightly_behind: 'Algo por detrás del ritmo',
  paused_recovery: 'Plan pausado',
}
