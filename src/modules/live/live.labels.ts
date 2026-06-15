import type { BadgeLevel } from '@/components/ui'
import type { LiveStatus } from './live.types'

export const LIVE_STATUS_LABELS: Record<LiveStatus, string> = {
  no_risk: 'Sin riesgo UV',
  safe: 'En tiempo seguro',
  caution: 'Has llegado a tu dosis segura',
  danger: 'Cúbrete ya',
}

export const LIVE_STATUS_MESSAGES: Record<LiveStatus, string> = {
  no_risk: 'El índice UV es nulo: no hay riesgo de quemadura ahora mismo.',
  safe: 'Disfruta con prudencia. Te avisaremos al llegar a tu dosis segura.',
  caution: 'Has alcanzado tu dosis segura. Lo prudente es buscar sombra o cubrirte.',
  danger: 'Has superado tu umbral de quemadura. Sal del sol y protege tu piel.',
}

export const LIVE_STATUS_TO_BADGE: Record<LiveStatus, BadgeLevel> = {
  no_risk: 'low',
  safe: 'low',
  caution: 'moderate',
  danger: 'avoid',
}

/** Formats seconds as mm:ss (or h:mm:ss past an hour). */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
