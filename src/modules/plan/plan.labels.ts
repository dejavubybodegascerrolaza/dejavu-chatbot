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
  deep_bronze: 'El tono más intenso, solo seguro para pieles que lo toleran.',
}

export const PLAN_STATUS_MESSAGES: Record<TanPlanStatus, string> = {
  ok: 'Tu objetivo es alcanzable de forma segura siguiendo el plan.',
  goal_below_current: 'Tu objetivo ya está por debajo de tu tono actual. Elige uno más intenso.',
  goal_exceeds_safe_ceiling:
    'Tu objetivo supera lo que tu piel puede broncear sin riesgo. Te proponemos la meta más intensa que sí es segura para ti.',
}

/** "el 12 de julio de 2026" from an ISO date. */
export function formatEtaDate(isoDate: string | null): string {
  if (isoDate === null) return 'No alcanzable de forma segura'
  return formatDisplayDate(isoDate)
}

/** Converts a number of calendar days into an approximate weeks label. */
export function formatPlanDuration(totalDays: number): string {
  if (totalDays <= 0) return 'Ya alcanzado'
  if (totalDays < 7) return `${totalDays} días`
  const weeks = Math.round(totalDays / 7)
  return weeks === 1 ? '1 semana' : `${weeks} semanas`
}
