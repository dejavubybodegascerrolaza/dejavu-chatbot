export type MainGoal =
  | 'gradual_bronze'
  | 'avoid_overexposure'
  | 'track_sessions'
  | 'conscious_routine'

export type SunSensitivity = 'low' | 'medium' | 'high' | 'very_high'

export type SkinType = 1 | 2 | 3 | 4 | 5 | 6

export type Profile = {
  id: string
  alias: string
  mainGoal: MainGoal
  sunSensitivity: SunSensitivity
  skinType: SkinType | null
  onboardingCompleted: boolean
  disclaimerAcceptedAt: string | null
  createdAt: string
  updatedAt: string
}
