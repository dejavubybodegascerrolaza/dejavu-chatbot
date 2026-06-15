import { addDaysToISODate, daysBetweenISODates } from '@/utils/date'
import { DEFAULT_SESSIONS_PER_WEEK } from '../plan/plan.rules'
import type { AdherenceInput, AdherenceStatus, PlanAdherence } from './adherence.types'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Sensations that produced overexposure — those sessions do not count as
 * positive plan progress. Mirrors STREAK_BREAKING_SENSATIONS from gamification.
 */
const OVEREXPOSURE_SENSATIONS = new Set(['burned', 'slightly_red'])

/**
 * Sessions within this deficit are still considered "slightly behind" rather
 * than severely off-track. The plan is conservative; life happens.
 */
const MAX_SLIGHT_DEFICIT = 3

// ── Copy ──────────────────────────────────────────────────────────────────────

const SUMMARIES: Record<AdherenceStatus, string> = {
  unknown: '',
  insufficient_data:
    'Necesitamos más sesiones registradas para estimar el ritmo real. Sigue registrando.',
  on_track:
    'Vas en ritmo conservador. Bronze IQ ajusta la estimación orientativa con tus sesiones reales.',
  slightly_behind:
    'Llevas algo menos sesiones de las previstas. La ETA orientativa se ha ajustado. Continúa a tu ritmo, sin prisa.',
  paused_recovery:
    'Plan en pausa mientras tu piel se recupera. La ETA orientativa se actualizará al retomar.',
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Derives plan adherence from actual session history vs. the plan's projected
 * cadence. Pure function — no side effects.
 *
 * Does NOT recommend increasing exposure to catch up.
 * Does NOT make medical claims.
 */
export function buildPlanAdherence(input: AdherenceInput): PlanAdherence {
  const { plan, planStartDate, historySessions, recoveryStatus, today } = input

  // Recovery takes highest priority — plan is paused regardless of adherence.
  if (
    recoveryStatus.level === 'recovery_recommended' ||
    recoveryStatus.level === 'avoid_direct_exposure'
  ) {
    return {
      status: 'paused_recovery',
      completedSessions: 0,
      expectedSessions: 0,
      sessionDeficit: 0,
      adjustedEtaDate: null,
      summary: SUMMARIES.paused_recovery,
    }
  }

  const daysElapsed = daysBetweenISODates(planStartDate, today)

  // Plan start date is in the future — nothing to assess yet.
  if (daysElapsed < 0) {
    return {
      status: 'unknown',
      completedSessions: 0,
      expectedSessions: 0,
      sessionDeficit: 0,
      adjustedEtaDate: null,
      summary: SUMMARIES.unknown,
    }
  }

  // Qualifying sessions since plan start — excludes overexposure outcomes.
  const completed = historySessions.filter(
    (s) => s.sessionDate >= planStartDate && !OVEREXPOSURE_SENSATIONS.has(s.sensationAfter)
  ).length

  // Expected sessions by today at the default conservative cadence.
  const expected = Math.floor((daysElapsed / 7) * DEFAULT_SESSIONS_PER_WEEK)

  // Too early: first week with fewer than 2 sessions — not enough signal.
  if (expected === 0 && completed < 2) {
    return {
      status: 'insufficient_data',
      completedSessions: completed,
      expectedSessions: expected,
      sessionDeficit: 0,
      adjustedEtaDate: null,
      summary: SUMMARIES.insufficient_data,
    }
  }

  const deficit = Math.max(0, expected - completed)
  const status: AdherenceStatus = deficit <= 0 ? 'on_track' : 'slightly_behind'

  // Adjusted ETA: shift original ETA forward by the approximate days needed
  // to make up the session deficit at the default cadence.
  // Never shifts backward (being ahead doesn't shorten the ETA — skin recovery
  // still needs time and the model doesn't reward compression).
  let adjustedEtaDate = plan.etaDate
  if (adjustedEtaDate !== null && deficit > 0 && deficit <= MAX_SLIGHT_DEFICIT) {
    const extraDays = Math.ceil((deficit / DEFAULT_SESSIONS_PER_WEEK) * 7)
    adjustedEtaDate = addDaysToISODate(adjustedEtaDate, extraDays)
  } else if (deficit > MAX_SLIGHT_DEFICIT) {
    // Large deficit: don't compute a misleading adjusted ETA.
    adjustedEtaDate = null
  }

  return {
    status,
    completedSessions: completed,
    expectedSessions: expected,
    sessionDeficit: deficit,
    adjustedEtaDate,
    summary: SUMMARIES[status],
  }
}
