import type { BodyExposure } from './sun.types'

export const BODY_EXPOSURE_LABELS: Record<BodyExposure, string> = {
  face_hands: 'Cara y manos',
  arms_legs: 'Brazos y piernas',
  most_body: 'Gran parte del cuerpo',
  full_body: 'Cuerpo completo',
}

/** Human-readable minutes, e.g. 95 → "1 h 35 min". */
export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return 'Sin límite práctico'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/** Formats an IU estimate, e.g. 3825 → "≈ 3.825 UI". */
export function formatVitaminDIu(iu: number): string {
  if (iu <= 0) return 'Sin síntesis estimada'
  return `≈ ${iu.toLocaleString('es-ES')} UI`
}
