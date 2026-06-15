import type { BadgeLevel } from '@/components/ui'
import type { LiveStatus } from './live.types'

export const LIVE_STATUS_LABELS: Record<LiveStatus, string> = {
  no_risk: 'Índice UV nulo',
  safe: 'Dentro del tiempo estimado',
  caution: 'Has alcanzado el techo estimado',
  danger: 'Cúbrete ya',
}

export const LIVE_STATUS_MESSAGES: Record<LiveStatus, string> = {
  no_risk: 'El índice UV es nulo ahora mismo. La intensidad solar es mínima.',
  safe: 'Disfruta con prudencia. Te avisaremos al acercarte al techo estimado.',
  caution: 'Has alcanzado el techo estimado. Lo prudente es buscar sombra o cubrirte.',
  danger: 'Has superado el umbral de quemadura estimado. Sal del sol y protege tu piel.',
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
