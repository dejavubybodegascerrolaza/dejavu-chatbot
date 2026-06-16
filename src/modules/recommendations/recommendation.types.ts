import type { MainGoal, SkinType, SunSensitivity } from '../profile/profile.types'
import type { ExposureContext, ProtectionLevel, SensationAfter } from '../sessions/session.types'

export type RecommendationLevel = 'low' | 'moderate' | 'caution' | 'high_caution' | 'rest'

export type RecommendationProfileInput = {
  mainGoal: MainGoal
  sunSensitivity: SunSensitivity
  skinType: SkinType | null
}

export type RecommendationSessionInput = {
  sessionDate: string
  durationMinutes: number
  context: ExposureContext
  uvIndexManual: number | null
  protectionLevel: ProtectionLevel
  sensationAfter: SensationAfter
}

export type RecommendationInput = {
  profile: RecommendationProfileInput
  sessionsLast7Days: RecommendationSessionInput[]
  today?: {
    uvIndexManual?: number | null
    /** Real-time UV index from the UV service; takes precedence over manual. */
    uvIndexNow?: number | null
  }
  now?: Date
}

/**
 * Semantic intent of the primary CTA, so the presentation layer can route the
 * button to the screen that matches its label (logging vs. reviewing history)
 * instead of hard-coding a single destination.
 */
export type RecommendationCtaAction = 'register' | 'history'

export type Recommendation = {
  level: RecommendationLevel
  title: string
  message: string
  reasons: string[]
  ctaLabel: string
  /** What the CTA should do, derived from the recommendation intent. */
  ctaAction: RecommendationCtaAction
  disclaimer: string
  weeklyExposureLoad: number
}
