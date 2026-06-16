import { generateRecommendation } from '../recommendations/recommendation.service'
import { DISCLAIMER } from '../recommendations/recommendation.rules'
import { classifyUv } from '../uv/uv.rules'
import { calculateBurnTime } from '../sun/sun.burn-time'
import { generateTanPlan } from '../plan/plan.engine'
import { calculateSafetyStreak } from '../gamification/gamification.engine'
import { buildRecoveryStatus } from '../recovery/recovery.engine'
import { buildPlanAdherence } from '../adherence/adherence.engine'
import { buildCalibrationProfile } from '../calibration/calibration.engine'
import { buildFaceGuard } from '../face-guard/face-guard.engine'
import type { RecommendationLevel } from '../recommendations/recommendation.types'
import type { MainGoal } from '../profile/profile.types'
import type { LocationStatus } from '../location/location.store'
import type { RecoveryStatus } from '../recovery/recovery.types'
import type { FaceGuard } from '../face-guard/face-guard.types'
import type { TodayDecision, TodayDecisionInput, TodayDecisionState } from './today.types'

// ── State derivation ──────────────────────────────────────────────────────────

function deriveState(
  level: RecommendationLevel,
  reasons: string[],
  locationStatus: LocationStatus,
  uvIndexNow: number | null
): TodayDecisionState {
  // Highest priority: recent burn signals recovery
  if (reasons.includes('burned_recently')) return 'recovery'
  // Rest level without a burn reason → load-based avoid
  if (level === 'rest') return 'avoid'
  // Caution levels
  if (level === 'high_caution' || level === 'caution') return 'caution'
  // Low/moderate but no UV data due to denied/errored location
  if (uvIndexNow === null && (locationStatus === 'denied' || locationStatus === 'error')) {
    return 'location_needed'
  }
  return 'ready'
}

// ── Sentinels ─────────────────────────────────────────────────────────────────

const NULL_RECOVERY: RecoveryStatus = {
  level: 'none',
  triggeredBy: null,
  daysSince: null,
  message: '',
}

const NULL_FACE_GUARD: FaceGuard = {
  level: 'standard',
  summary: '',
  reasons: [],
  suggestedAction: 'continue_with_face_protection',
}

const UNAVAILABLE: TodayDecision = {
  state: 'unavailable',
  title: 'Cargando tu información',
  explanation: 'Espera un momento mientras Bronze IQ reúne tus datos.',
  bestNextAction: 'Esperar',
  reasons: [],
  disclaimer: DISCLAIMER,
  recommendationLevel: null,
  weeklyExposureLoad: null,
  uvCategory: null,
  uvIndexNow: null,
  minutesToBurnEstimate: null,
  tanPlan: null,
  hasActivePlan: false,
  planGoal: null,
  safetyStreak: 0,
  hasLocationPermission: false,
  todayMinutes: 0,
  recoveryStatus: NULL_RECOVERY,
  planAdherence: null,
  calibrationProfile: null,
  faceGuard: NULL_FACE_GUARD,
}

// ── mainGoal-aware CTA ────────────────────────────────────────────────────────

/**
 * Adjusts the primary CTA label based on the user's stated goal.
 * Users who want to avoid overexposure see "Ver mi historial" in the ready
 * state — reinforcing that checking their history is the meaningful action,
 * not immediately adding more exposure.
 */
function resolveCtaLabel(
  mainGoal: MainGoal,
  defaultCta: string,
  state: TodayDecisionState
): string {
  if (state === 'ready' && mainGoal === 'avoid_overexposure') return 'Ver mi historial'
  return defaultCta
}

// ── Location-needed copy ──────────────────────────────────────────────────────

const LOCATION_COPY = {
  title: 'Activa la ubicación para orientación completa',
  explanation:
    'Sin datos UV de tu zona, Bronze IQ aplica una estimación prudente basada en tu historial. No es consejo médico.',
} as const

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Composes the recommendation engine, UV data, burn-time model, tan plan, and
 * safety streak into a single deterministic Today Decision object.
 *
 * Pure function — no side effects, no network calls. Safe to call in useMemo.
 */
export function buildTodayDecision(input: TodayDecisionInput): TodayDecision {
  const {
    profile,
    recentSessions,
    todaySessions,
    historySessions,
    uvForecast,
    locationStatus,
    planGoal,
    planCurrentLevel,
    planStartDate,
    today,
    now = new Date(),
  } = input

  if (profile === null) return UNAVAILABLE

  // 1. Run the recommendation engine
  const uvIndexNow = uvForecast?.current.uvIndex ?? null
  const recommendation = generateRecommendation({
    profile: {
      mainGoal: profile.mainGoal,
      sunSensitivity: profile.sunSensitivity,
      skinType: profile.skinType,
    },
    sessionsLast7Days: recentSessions,
    today: { uvIndexNow },
    now,
  })

  // 2. Derive the driving state
  const state = deriveState(
    recommendation.level,
    recommendation.reasons,
    locationStatus,
    uvIndexNow
  )

  // 3. UV category label
  const uvCategory = uvIndexNow !== null ? classifyUv(uvIndexNow) : null

  // 4. Burn-time estimate — SPF 30 baseline, conservative
  const burnResult =
    uvIndexNow !== null
      ? calculateBurnTime({ skinType: profile.skinType, uvIndex: uvIndexNow, spf: 30 })
      : null

  // 5. Recovery status from recent skin response
  const recoveryStatus = buildRecoveryStatus({ recentSessions, today })
  const hasRecentOverexposure =
    recoveryStatus.level === 'recovery_recommended' ||
    recoveryStatus.level === 'avoid_direct_exposure'

  // 6. Tan plan (only when the user has set a goal)
  const tanPlan =
    planGoal !== null
      ? generateTanPlan({
          skinType: profile.skinType,
          currentLevel: planCurrentLevel,
          goalLevel: planGoal,
          hasRecentOverexposure,
          ...(uvForecast !== null ? { typicalUvIndex: uvForecast.maxToday } : {}),
        })
      : null

  // 7. Safety streak from all-time history
  const safetyStreak = calculateSafetyStreak(
    historySessions.map((s) => ({
      sessionDate: s.sessionDate,
      sensationAfter: s.sensationAfter,
      context: s.context,
    })),
    today
  )

  // 8. Today's total recorded exposure
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0)

  // 9. Plan adherence — compare actual session history to the plan's cadence
  const planAdherence =
    tanPlan !== null && planStartDate !== null
      ? buildPlanAdherence({
          plan: tanPlan,
          planStartDate,
          historySessions,
          recoveryStatus,
          today,
        })
      : null

  // 10. Calibration profile from skin type + sensitivity
  const calibrationProfile = buildCalibrationProfile({
    skinType: profile.skinType,
    sunSensitivity: profile.sunSensitivity,
  })

  // 11. Face Guard — face-specific protection guidance
  const faceGuard = buildFaceGuard({
    skinType: profile.skinType,
    sunSensitivity: profile.sunSensitivity,
    uvCategory,
    recoveryLevel: recoveryStatus.level,
  })

  // 12. Copy — location_needed overrides the recommendation title and explanation
  //     so the user knows the decision is less accurate without UV data.
  const title = state === 'location_needed' ? LOCATION_COPY.title : recommendation.title
  const explanation =
    state === 'location_needed' ? LOCATION_COPY.explanation : recommendation.message
  const bestNextAction = resolveCtaLabel(profile.mainGoal, recommendation.ctaLabel, state)

  return {
    state,
    title,
    explanation,
    bestNextAction,
    reasons: recommendation.reasons,
    disclaimer: recommendation.disclaimer,
    recommendationLevel: recommendation.level,
    weeklyExposureLoad: recommendation.weeklyExposureLoad,
    uvCategory,
    uvIndexNow,
    minutesToBurnEstimate: burnResult?.minutesToBurn ?? null,
    tanPlan,
    hasActivePlan: planGoal !== null,
    planGoal,
    safetyStreak,
    hasLocationPermission: locationStatus === 'ready',
    todayMinutes,
    recoveryStatus,
    planAdherence,
    calibrationProfile,
    faceGuard,
  }
}
