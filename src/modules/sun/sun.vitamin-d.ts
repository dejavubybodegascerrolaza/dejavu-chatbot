import {
  BODY_EXPOSURE_FRACTION,
  UV_INDEX_TO_DOSE_PER_MINUTE,
  VITAMIN_D_MAX_IU_FULL_BODY,
  VITAMIN_D_SATURATION_DOSE,
  VITAMIN_D_SKIN_FACTOR,
  VITAMIN_D_SKIN_FACTOR_UNKNOWN,
} from './sun.rules'
import type { VitaminDInput, VitaminDResult } from './sun.types'

/**
 * Estimates vitamin D synthesised during a sun exposure, in International Units.
 *
 * Model: IU = maxFullBody × doseFraction × skinFactor × exposedFraction, where
 * doseFraction = min(UV dose / saturation dose, 1). Vitamin D production needs
 * UVB and plateaus after roughly 1–2 SED, which the saturation cap reflects.
 *
 * This is a wellness estimate, not a clinical measurement.
 */
export function calculateVitaminD(input: VitaminDInput): VitaminDResult {
  const uvIndex = Math.max(0, input.uvIndex)
  const minutes = Math.max(0, input.minutes)

  if (uvIndex === 0 || minutes === 0) {
    return { estimatedIu: 0, saturated: false }
  }

  const dose = uvIndex * UV_INDEX_TO_DOSE_PER_MINUTE * minutes
  const doseFraction = Math.min(dose / VITAMIN_D_SATURATION_DOSE, 1)
  const skinFactor =
    input.skinType !== null ? VITAMIN_D_SKIN_FACTOR[input.skinType] : VITAMIN_D_SKIN_FACTOR_UNKNOWN
  const exposedFraction = BODY_EXPOSURE_FRACTION[input.exposure]

  const iu = VITAMIN_D_MAX_IU_FULL_BODY * doseFraction * skinFactor * exposedFraction

  return {
    estimatedIu: Math.round(iu),
    saturated: doseFraction >= 1,
  }
}
