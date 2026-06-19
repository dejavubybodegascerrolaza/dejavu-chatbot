import type { AgeRange, BlisteringSunburns, TanningBedUse, MoleCount } from '../profile.types'

/** A partial sensitivity profile — every field is optional/skippable. */
export type SensitivityProfile = {
  ageRange?: AgeRange | null
  blisteringSunburns?: BlisteringSunburns | null
  tanningBedUse?: TanningBedUse | null
  moleCount?: MoleCount | null
}

export type CareFlag = 'childhood_burns' | 'many_moles' | 'regular_tanning_beds'

// Plain-language, NON-DIAGNOSTIC guidance per flag. The app never diagnoses;
// it nudges towards prudence and professional follow-up where evidence supports.
const CARE_NOTE: Record<CareFlag, string> = {
  childhood_burns:
    'Tus quemaduras con ampollas en edades tempranas aconsejan extremar la prudencia y hacer revisiones dermatológicas periódicas.',
  many_moles:
    'Tener muchos lunares aconseja vigilar cambios (tamaño, forma o color) y consultar a un dermatólogo ante cualquier lunar que evolucione.',
  regular_tanning_beds:
    'El uso regular de cabinas UVA aumenta el riesgo cutáneo; reducirlo o dejarlo es lo más recomendable.',
}

/** Returns the care flags raised by a sensitivity profile, in priority order. */
export function getCareFlags(profile: SensitivityProfile): CareFlag[] {
  const flags: CareFlag[] = []
  if (profile.blisteringSunburns === 'childhood') flags.push('childhood_burns')
  if (profile.moleCount === 'many') flags.push('many_moles')
  if (profile.tanningBedUse === 'regular') flags.push('regular_tanning_beds')
  return flags
}

/** Maps care flags to their guidance notes. */
export function getCareNotes(profile: SensitivityProfile): string[] {
  return getCareFlags(profile).map((flag) => CARE_NOTE[flag])
}

/**
 * True when the profile warrants extra caution. Used to make the app's guidance
 * more conservative — never to make a clinical determination.
 */
export function hasElevatedCaution(profile: SensitivityProfile): boolean {
  return getCareFlags(profile).length > 0
}
