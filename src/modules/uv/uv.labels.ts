import type { BadgeLevel } from '@/components/ui'
import type { UvCategory, UvPeakWindow } from './uv.types'

export const UV_CATEGORY_LABELS: Record<UvCategory, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
  very_high: 'Muy alto',
  extreme: 'Extremo',
}

export const UV_CATEGORY_ADVICE: Record<UvCategory, string> = {
  low: 'Riesgo bajo. Puedes exponerte con precaución básica.',
  moderate: 'Usa protección y busca sombra en las horas centrales.',
  high: 'Protección necesaria. Reduce la exposición directa al mediodía.',
  very_high: 'Riesgo alto. Evita el sol en las horas centrales y extrema la protección.',
  extreme: 'Riesgo extremo. Evita la exposición directa; prioriza sombra y protección total.',
}

export const UV_CATEGORY_TO_BADGE: Record<UvCategory, BadgeLevel> = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  very_high: 'high',
  extreme: 'avoid',
}

/** Formats a peak window, e.g. { 11, 16 } → "de 11:00 a 16:00". */
export function formatPeakWindow(peak: UvPeakWindow): string {
  if (peak === null) return 'Sin pico de riesgo alto hoy'
  return `de ${pad(peak.startHour)}:00 a ${pad(peak.endHour)}:00`
}

function pad(hour: number): string {
  return hour < 10 ? `0${hour}` : String(hour)
}
