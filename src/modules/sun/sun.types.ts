import type { SkinType } from '../profile/profile.types'

/**
 * Inputs for the burn-time engine. `uvIndex` is the current real UV index,
 * `spf` is the protection factor applied to bare skin (1 = no protection).
 */
export type BurnTimeInput = {
  skinType: SkinType | null
  uvIndex: number
  spf?: number
}

export type BurnTimeResult = {
  /** Minutes of bare-skin exposure to reach 1 MED (erythema / sunburn threshold). */
  minutesToBurn: number | null
  /** Conservative recommended limit before risk rises (a fraction of MED). */
  safeMinutes: number | null
  /** The SPF applied to the calculation (1 when none). */
  spf: number
}

/** Fraction of the body surface exposed to the sun. */
export type BodyExposure = 'face_hands' | 'arms_legs' | 'most_body' | 'full_body'

export type VitaminDInput = {
  skinType: SkinType | null
  uvIndex: number
  minutes: number
  exposure: BodyExposure
}

export type VitaminDResult = {
  /** Estimated vitamin D synthesised, in International Units. */
  estimatedIu: number
  /** True when synthesis has reached its practical daily saturation. */
  saturated: boolean
}
