import type { AgeRange, BlisteringSunburns, TanningBedUse, MoleCount } from '../profile.types'

// ─────────────────────────────────────────────────────────────────────────────
// Optional "sensitivity & care" layer — evidence-based modifiers that sit ON TOP
// of the Fitzpatrick phototype (they do NOT change the phototype score). Each
// factor is a recognised influence on how a skin tolerates UV. Sources are cited
// per question and documented in docs/science/fitzpatrick-assessment.md.
//
// This layer is OPTIONAL and skippable.
// ─────────────────────────────────────────────────────────────────────────────

export type SensitivityFieldKey = 'ageRange' | 'blisteringSunburns' | 'tanningBedUse' | 'moleCount'

export type SensitivityOption = {
  value: string
  label: string
}

export type SensitivityQuestion = {
  field: SensitivityFieldKey
  prompt: string
  help?: string | undefined
  /** Short citation shown subtly under the question to build trust. */
  source?: string | undefined
  options: SensitivityOption[]
}

const AGE_OPTIONS: Array<{ value: AgeRange; label: string }> = [
  { value: '18_25', label: '18–25 años' },
  { value: '26_35', label: '26–35 años' },
  { value: '36_50', label: '36–50 años' },
  { value: '51_plus', label: 'Más de 50 años' },
]

const BLISTERING_OPTIONS: Array<{ value: BlisteringSunburns; label: string }> = [
  { value: 'none', label: 'Nunca' },
  { value: 'adult', label: 'Sí, siendo adulto/a' },
  { value: 'childhood', label: 'Sí, de niño/a o adolescente' },
]

const TANNING_BED_OPTIONS: Array<{ value: TanningBedUse; label: string }> = [
  { value: 'never', label: 'Nunca' },
  { value: 'past', label: 'Las usé en el pasado' },
  { value: 'regular', label: 'Las uso con regularidad' },
]

const MOLE_OPTIONS: Array<{ value: MoleCount; label: string }> = [
  { value: 'few', label: 'Pocos' },
  { value: 'some', label: 'Bastantes' },
  { value: 'many', label: 'Muchos' },
]

export const SENSITIVITY_QUESTIONS: SensitivityQuestion[] = [
  {
    field: 'ageRange',
    prompt: '¿En qué rango de edad estás?',
    help: 'La edad influye en cómo responde la piel y en el daño solar acumulado.',
    options: AGE_OPTIONS,
  },
  {
    field: 'blisteringSunburns',
    prompt: '¿Has sufrido quemaduras solares con ampollas?',
    help: 'Las quemaduras intensas, sobre todo en la infancia, son un factor de riesgo reconocido.',
    source: 'Dennis LK et al., Ann Epidemiol 2008',
    options: BLISTERING_OPTIONS,
  },
  {
    field: 'tanningBedUse',
    prompt: '¿Has usado cabinas de bronceado (rayos UVA artificiales)?',
    help: 'La OMS/IARC clasifica las cabinas UVA como cancerígenas para el ser humano.',
    source: 'IARC Monograph Vol. 100D',
    options: TANNING_BED_OPTIONS,
  },
  {
    field: 'moleCount',
    prompt: '¿Cuántos lunares dirías que tienes en el cuerpo?',
    help: 'Tener muchos lunares se asocia a una mayor sensibilidad cutánea.',
    source: 'Gandini S et al., Eur J Cancer 2005',
    options: MOLE_OPTIONS,
  },
]
