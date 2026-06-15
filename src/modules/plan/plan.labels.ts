import { formatDisplayDate } from '@/utils/date'
import type { TanLevel, TanPlanStatus } from './plan.types'

export const TAN_LEVEL_LABELS: Record<TanLevel, string> = {
  natural: 'Tono natural',
  light_golden: 'Dorado suave',
  golden: 'Dorado',
  bronze: 'Bronceado',
  deep_bronze: 'Bronceado intenso',
}

export const TAN_LEVEL_DESCRIPTIONS: Record<TanLevel, string> = {
  natural: 'Tu punto de partida, sin exposición acumulada.',
  light_golden: 'Un brillo cálido y sutil.',
  golden: 'Un dorado visible y uniforme.',
  bronze: 'Un bronceado marcado.',
  deep_bronze: 'El tono más intenso. Requiere una piel que lo tolere bien y mucha constancia.',
}

export const PLAN_STATUS_MESSAGES: Record<TanPlanStatus, string> = {
  ok: 'Tu objetivo parece alcanzable siguiendo el plan de forma conservadora. Escucha siempre las señales de tu piel.',
  goal_below_current: 'Tu objetivo ya está por debajo de tu tono actual. Elige uno más intenso.',
  goal_exceeds_safe_ceiling:
    'Tu objetivo supera el techo estimado para tu fototipo. Te sugerimos el objetivo más ambicioso que el modelo estima como alcanzable para ti.',
  paused_recovery:
    'Tu plan está en pausa mientras tu piel se recupera. Retoma las sesiones cuando te encuentres bien. No es consejo médico.',
}

/** "el 12 de julio de 2026" from an ISO date. */
export function formatEtaDate(isoDate: string | null): string {
  if (isoDate === null) return 'No alcanzable con el plan conservador'
  return formatDisplayDate(isoDate)
}

/** Converts a number of calendar days into an approximate weeks label. */
export function formatPlanDuration(totalDays: number): string {
  if (totalDays <= 0) return 'Ya alcanzado'
  if (totalDays < 7) return `${totalDays} días`
  const weeks = Math.round(totalDays / 7)
  return weeks === 1 ? '1 semana' : `${weeks} semanas`
}
