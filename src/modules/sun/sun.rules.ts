import type { SkinType } from '../profile/profile.types'
import type { BodyExposure } from './sun.types'

/**
 * Minimal Erythema Dose (MED) per Fitzpatrick skin type, expressed in J/m² of
 * erythemally-weighted UV. Values follow commonly cited dermatological ranges
 * (≈2 SED for type I up to ≈10 SED for type VI; 1 SED = 100 J/m²).
 */
export const MED_BY_SKIN_TYPE: Record<SkinType, number> = {
  1: 200,
  2: 250,
  3: 350,
  4: 450,
  5: 600,
  6: 1000,
}

/** Used when the skin type is unknown — conservative (closer to type II). */
export const MED_UNKNOWN = 250

/**
 * Conversion from UV Index to erythemal dose rate.
 * 1 UV Index unit = 0.025 W/m² of erythemal irradiance = 1.5 J/m² per minute.
 */
export const UV_INDEX_TO_DOSE_PER_MINUTE = 1.5

/**
 * Fraction of 1 MED treated as the conservative "stay under this" limit, so the
 * recommended time sits clearly below the sunburn threshold.
 */
export const SAFE_MED_FRACTION = 0.6

/** Approximate fraction of total skin surface exposed for each body-exposure level. */
export const BODY_EXPOSURE_FRACTION: Record<BodyExposure, number> = {
  face_hands: 0.1,
  arms_legs: 0.3,
  most_body: 0.6,
  full_body: 0.9,
}

/**
 * Relative vitamin D synthesis efficiency per skin type. Darker skin produces
 * less vitamin D for the same UV dose because melanin absorbs UVB.
 */
export const VITAMIN_D_SKIN_FACTOR: Record<SkinType, number> = {
  1: 1.0,
  2: 1.0,
  3: 0.85,
  4: 0.65,
  5: 0.5,
  6: 0.35,
}

export const VITAMIN_D_SKIN_FACTOR_UNKNOWN = 0.85

/** IU of vitamin D produced at saturation with full-body exposure (reference). */
export const VITAMIN_D_MAX_IU_FULL_BODY = 20000

/**
 * Erythemal dose (J/m²) at which vitamin D synthesis is treated as saturated.
 * Synthesis plateaus around 1–2 SED of exposure.
 */
export const VITAMIN_D_SATURATION_DOSE = 200
