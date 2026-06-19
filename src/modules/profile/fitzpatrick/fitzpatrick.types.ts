import type { SkinType } from '../profile.types'

// The three scientific domains of the validated Fitzpatrick self-assessment.
// - genetics: constitutional traits (fixed, hereditary) → baseline UV protection.
// - reaction: how the skin responds to UV → the most direct sensitivity signal.
// - habits:   recent tanning status → calibrates the estimate to the present moment.
export type FitzpatrickSection = 'genetics' | 'reaction' | 'habits'

// Each answer is scored on the standard 0–4 scale, where 0 = most sun-sensitive
// (Type I end) and 4 = most sun-resistant (Type VI end).
export type FitzpatrickScore = 0 | 1 | 2 | 3 | 4

export type FitzpatrickOption = {
  /** Stable identifier, persisted/analysable independently of label wording. */
  value: string
  label: string
  /** Optional clarifying microcopy shown under the label. */
  help?: string | undefined
  score: FitzpatrickScore
}

export type FitzpatrickQuestion = {
  id: string
  section: FitzpatrickSection
  prompt: string
  /** Optional one-line guidance so the user knows exactly how to answer. */
  help?: string | undefined
  options: FitzpatrickOption[]
}

/** Map of questionId → chosen score. */
export type FitzpatrickAnswers = Record<string, FitzpatrickScore>

export type FitzpatrickResult = {
  /** Sum of all answer scores (0–40 for the 10-item instrument). */
  totalScore: number
  skinType: SkinType
}
