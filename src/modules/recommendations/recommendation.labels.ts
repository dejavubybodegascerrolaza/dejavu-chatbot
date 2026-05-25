import type { RecommendationLevel } from './recommendation.types'

const REASON_LABELS: Record<string, string> = {
  burned_recently: 'Has registrado una señal clara de exceso recientemente.',
  slightly_red_recently: 'Tu historial reciente muestra enrojecimiento.',
  warm_tight_recently: 'Has registrado piel caliente o tirante.',
  low_weekly_load: 'Tu acumulación reciente es baja.',
  moderate_weekly_load: 'Tu acumulación reciente es moderada.',
  caution_weekly_load: 'Has acumulado exposición en los últimos días.',
  high_weekly_load: 'Tu acumulación reciente es elevada.',
  very_high_weekly_load: 'Tu historial sugiere descanso de exposición directa.',
  high_uv_today: 'El índice UV indicado es muy alto.',
}

const FALLBACK_REASON_LABEL = 'Recomendación basada en tu historial reciente.'

export function getReasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? FALLBACK_REASON_LABEL
}

export const LEVEL_LABELS: Record<RecommendationLevel, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  caution: 'Prudencia',
  high_caution: 'Prudencia alta',
  rest: 'Descanso recomendado',
}

export const LEVEL_SUBTEXTS: Record<RecommendationLevel, string> = {
  low: 'Puedes empezar con prudencia.',
  moderate: 'Mantén un ritmo gradual.',
  caution: 'Hoy conviene ir con calma.',
  high_caution: 'Baja el ritmo y revisa tu historial.',
  rest: 'Mejor priorizar descanso.',
}
