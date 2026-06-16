import type { ExposureContext, ProtectionLevel, SensationAfter } from './session.types'
import type { UvCategory } from '../uv/uv.types'

export const CONTEXT_LABELS: Record<ExposureContext, string> = {
  beach: 'Playa',
  pool: 'Piscina',
  urban: 'Ciudad / paseo',
  terrace_garden: 'Terraza / jardín',
  outdoor_sport: 'Deporte exterior',
  other: 'Otro',
}

export const PROTECTION_LABELS: Record<ProtectionLevel, string> = {
  unknown: 'No indicado',
  high: 'Sí, protección alta',
  medium: 'Sí, protección media',
  none: 'No',
  not_sure: 'No lo recuerdo',
}

export const SENSATION_LABELS: Record<SensationAfter, string> = {
  great: 'Bien',
  normal: 'Normal',
  warm_tight: 'Piel caliente o tirante',
  slightly_red: 'Ligero enrojecimiento',
  burned: 'Quemadura o molestia clara',
}

/**
 * Short, non-medical explainers shown under each skin-response option so the
 * user can pick accurately and without alarmism. These describe observations,
 * not diagnoses.
 */
export const SENSATION_DESCRIPTIONS: Record<SensationAfter, string> = {
  great: 'Sin molestias ni cambios en la piel.',
  normal: 'Exposición sin señales destacables.',
  warm_tight: 'Notas la piel caliente o algo tirante.',
  slightly_red: 'Aparece algo de rojez que después baja.',
  burned: 'Rojez marcada, escozor o molestia clara.',
}

export type UvBucket = { category: UvCategory; value: number; label: string }

/**
 * Single source of truth for the Session Log UV buckets. Shared by the form's
 * UV options and the live-session prefill mapping so the two never drift apart.
 * Values intentionally sit inside each WHO category (see classifyUv).
 */
export const UV_BUCKETS: readonly UvBucket[] = [
  { category: 'low', value: 1, label: '0–2 Bajo' },
  { category: 'moderate', value: 4, label: '3–5 Moderado' },
  { category: 'high', value: 6, label: '6–7 Alto' },
  { category: 'very_high', value: 9, label: '8–10 Muy alto' },
  { category: 'extreme', value: 11, label: '11 Extremo' },
]
