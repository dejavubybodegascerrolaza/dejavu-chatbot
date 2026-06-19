export type MainGoal =
  | 'gradual_bronze'
  | 'avoid_overexposure'
  | 'track_sessions'
  | 'conscious_routine'

export type SunSensitivity = 'low' | 'medium' | 'high' | 'very_high'

export type SkinType = 1 | 2 | 3 | 4 | 5 | 6

// ─── Optional sensitivity & care profile (evidence-based modifiers) ───────────
// These do NOT alter the Fitzpatrick score; they let the app be more prudent.
// See docs/science/fitzpatrick-assessment.md for sources.

export type AgeRange = '18_25' | '26_35' | '36_50' | '51_plus'

/** History of blistering sunburns; childhood burns carry the highest risk. */
export type BlisteringSunburns = 'none' | 'adult' | 'childhood'

export type TanningBedUse = 'never' | 'past' | 'regular'

export type MoleCount = 'few' | 'some' | 'many'

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
  // Optional sensitivity layer (present once the row is mapped; may be null).
  ageRange?: AgeRange | null
  blisteringSunburns?: BlisteringSunburns | null
  tanningBedUse?: TanningBedUse | null
  moleCount?: MoleCount | null
}
