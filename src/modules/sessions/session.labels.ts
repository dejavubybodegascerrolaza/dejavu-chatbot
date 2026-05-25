import type { ExposureContext, ProtectionLevel, SensationAfter } from './session.types'

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
