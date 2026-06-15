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

export type Recommendation = {
  level: RecommendationLevel
  title: string
  message: string
  reasons: string[]
  ctaLabel: string
  disclaimer: string
  weeklyExposureLoad: number
}
