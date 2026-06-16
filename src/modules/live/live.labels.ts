import type { BadgeLevel } from '@/components/ui'
import type { LiveStatus } from './live.types'
import type { RecoveryLevel } from '../recovery/recovery.types'
import type { UvCategory } from '../uv/uv.types'

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

// ── Persistent support notes ──────────────────────────────────────────────────

/** Calm, persistent reminders shown during an active session. */
export const LIVE_DISCOMFORT_NOTE = 'Si notas calor, tirantez o rojez, termina la sesión.'
export const LIVE_END_EARLY_NOTE = 'Terminar antes también cuenta como una buena decisión.'
export const LIVE_DISCLAIMER_NOTE = 'No es consejo médico.'

// ── Pre-start recovery caution ─────────────────────────────────────────────────

/**
 * Conservative caution shown before starting a session when recent skin response
 * suggests recovery. Returns null when there is no recovery signal.
 * Reuses the recovery engine's level — does not re-derive recovery logic.
 */
export function getLiveRecoveryNote(level: RecoveryLevel): string | null {
  switch (level) {
    case 'avoid_direct_exposure':
      return 'Tu piel registró una señal de exceso reciente. Lo más prudente es evitar la exposición directa hoy.'
    case 'recovery_recommended':
      return 'Tu piel está en recuperación. Considera posponer la exposición directa o mantenerla mínima.'
    case 'caution':
      return 'Tu piel mostró una señal leve hace poco. Ve con calma y mantén la sesión corta.'
    case 'none':
    default:
      return null
  }
}

// ── UV intensity warning ───────────────────────────────────────────────────────

/**
 * Warning note for high UV categories. Returns null for low/moderate UV and when
 * the category is unknown. Reuses the UV classifier's category — no thresholds here.
 */
export function getLiveUvWarning(uvCategory: UvCategory | null): string | null {
  switch (uvCategory) {
    case 'extreme':
      return 'Índice UV extremo. Prioriza sombra y protección; reduce al mínimo la exposición directa.'
    case 'very_high':
      return 'Índice UV muy alto. Mantén la sesión corta y refuerza la protección.'
    case 'high':
      return 'Índice UV alto. Ve con prudencia y vigila el tiempo estimado.'
    default:
      return null
  }
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
