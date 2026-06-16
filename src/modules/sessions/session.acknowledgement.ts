import { sensationAfterSchema } from './session.schema'
import type { SensationAfter } from './session.types'

/**
 * Tone of the post-save acknowledgement, used by the UI to pick calm colours.
 * Mirrors the recovery escalation without re-deriving recovery rules.
 */
export type SaveAckTone = 'positive' | 'caution' | 'recovery' | 'avoid'

export type SessionSaveAcknowledgement = {
  tone: SaveAckTone
  title: string
  message: string
}

const ACKNOWLEDGEMENTS: Record<SensationAfter, SessionSaveAcknowledgement> = {
  great: {
    tone: 'positive',
    title: 'Sesión registrada.',
    message: 'Gracias. Esto ayuda a ajustar tus próximas recomendaciones.',
  },
  normal: {
    tone: 'positive',
    title: 'Sesión registrada.',
    message: 'Gracias. Esto ayuda a ajustar tus próximas recomendaciones.',
  },
  warm_tight: {
    tone: 'caution',
    title: 'Sesión registrada.',
    message: 'Has registrado calor o tirantez; Bronze IQ reducirá el margen de forma prudente.',
  },
  slightly_red: {
    tone: 'recovery',
    title: 'Sesión registrada.',
    message: 'Has registrado rojez; hoy priorizamos recuperación.',
  },
  burned: {
    tone: 'avoid',
    title: 'Sesión registrada.',
    message: 'Has registrado sobreexposición; pausa la exposición directa. No es consejo médico.',
  },
}

/**
 * Builds the calm, contextual acknowledgement shown after a session is saved.
 * Pure — no side effects. The copy reflects the logged skin response so the user
 * sees that logging matters, without alarmism or medical claims.
 */
export function buildSessionSaveAcknowledgement(
  sensationAfter: SensationAfter
): SessionSaveAcknowledgement {
  return ACKNOWLEDGEMENTS[sensationAfter]
}

/**
 * Parses a raw navigation param into an acknowledgement. Anything missing or not
 * a valid SensationAfter is ignored (returns null), so a bad deep link can never
 * surface a confusing banner.
 */
export function parseSessionSaveAcknowledgement(
  param: string | string[] | undefined
): SessionSaveAcknowledgement | null {
  const value = typeof param === 'string' ? param : Array.isArray(param) ? (param[0] ?? null) : null
  if (value === null) return null
  const parsed = sensationAfterSchema.safeParse(value)
  if (!parsed.success) return null
  return buildSessionSaveAcknowledgement(parsed.data)
}
