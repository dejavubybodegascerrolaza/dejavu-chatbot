import type { ExposureSession } from '../sessions/session.types'
import type { RecoveryInput, RecoveryLevel, RecoveryStatus } from './recovery.types'

// ── Severity ordering ─────────────────────────────────────────────────────────

const SEVERITY: Record<RecoveryLevel, number> = {
  none: 0,
  caution: 1,
  recovery_recommended: 2,
  avoid_direct_exposure: 3,
}

// ── Copy ──────────────────────────────────────────────────────────────────────

const RECOVERY_MESSAGES: Record<Exclude<RecoveryLevel, 'none'>, string> = {
  caution:
    'Tu piel registró señales de calor o enrojecimiento leve recientemente. Ve con calma y escucha cómo responde. No es consejo médico.',
  recovery_recommended:
    'Tu piel mostró enrojecimiento en las últimas 48 horas. Bronze IQ recomienda un descanso de la exposición directa hasta que desaparezca. No es consejo médico.',
  avoid_direct_exposure:
    'Tu piel registró una respuesta intensa. Evita la exposición directa durante unos días y mantén la piel hidratada. No es consejo médico.',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000)
}

function candidateLevel(session: ExposureSession, days: number): RecoveryLevel {
  const { sensationAfter } = session
  if (sensationAfter === 'burned' && days <= 7) return 'avoid_direct_exposure'
  if (sensationAfter === 'slightly_red') return days <= 2 ? 'recovery_recommended' : 'caution'
  if (sensationAfter === 'warm_tight' && days <= 2) return 'caution'
  return 'none'
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Derives the current recovery need from recent post-session skin response.
 *
 * Pure function — no side effects. Safe to call in useMemo.
 * Does NOT make medical claims — output is conservative orientation only.
 */
export function buildRecoveryStatus(input: RecoveryInput): RecoveryStatus {
  const { recentSessions, today } = input

  let worstLevel: RecoveryLevel = 'none'
  let triggerSession: ExposureSession | null = null

  for (const session of recentSessions) {
    const days = daysBetween(session.sessionDate, today)
    if (days < 0 || days > 7) continue

    const level = candidateLevel(session, days)
    if (SEVERITY[level] > SEVERITY[worstLevel]) {
      worstLevel = level
      triggerSession = session
    }
  }

  if (worstLevel === 'none') {
    return { level: 'none', triggeredBy: null, daysSince: null, message: '' }
  }

  return {
    level: worstLevel,
    triggeredBy: triggerSession!.sensationAfter,
    daysSince: daysBetween(triggerSession!.sessionDate, today),
    message: RECOVERY_MESSAGES[worstLevel],
  }
}
