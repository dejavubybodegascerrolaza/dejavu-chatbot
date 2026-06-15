export type CalibrationConfidence = 'low' | 'medium' | 'high'

export type CalibrationTier = 'conservative' | 'standard'

export type CalibrationProfile = {
  confidence: CalibrationConfidence
  tier: CalibrationTier
  missingSkinType: boolean
  summary: string
}

export type CalibrationInput = {
  skinType: number | null
  sunSensitivity: string
}
