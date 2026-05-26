import type { MainGoal, SunSensitivity, SkinType } from './profile.types'

export const MAIN_GOAL_LABELS: Record<MainGoal, string> = {
  gradual_bronze: 'Mantener un bronceado gradual',
  avoid_overexposure: 'Evitar pasarme con el sol',
  track_sessions: 'Registrar mis sesiones',
  conscious_routine: 'Crear una rutina más consciente',
}

export const SUN_SENSITIVITY_LABELS: Record<SunSensitivity, string> = {
  very_high: 'Me quemo con facilidad',
  high: 'A veces me irrito si me paso',
  medium: 'Normalmente tolero exposiciones moderadas',
  low: 'Suelo tolerarlo bien, pero quiero controlarlo',
}

export const SKIN_TYPE_LABELS: Record<number, string> = {
  1: 'I — Muy clara',
  2: 'II — Clara',
  3: 'III — Intermedia',
  4: 'IV — Morena clara',
  5: 'V — Morena',
  6: 'VI — Muy oscura',
}

export function getSkinTypeLabel(skinType: SkinType | null): string {
  if (skinType === null) return 'No indicado'
  return SKIN_TYPE_LABELS[skinType] ?? 'No indicado'
}
