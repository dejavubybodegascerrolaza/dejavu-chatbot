import React from 'react'
import { StyleSheet } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { spacing } from '@/design'
import { calculateVitaminD, formatVitaminDIu } from '@/modules/sun'
import type { BodyExposure } from '@/modules/sun'
import type { SkinType } from '@/modules/profile/profile.types'

type Props = {
  skinType: SkinType | null
  uvIndex: number
  minutes: number
  exposure?: BodyExposure
}

/**
 * Shows an estimate of the vitamin D synthesised today from logged exposure —
 * the positive, health-forward framing of sun time.
 */
export function VitaminDCard({ skinType, uvIndex, minutes, exposure = 'arms_legs' }: Props) {
  const result = calculateVitaminD({ skinType, uvIndex, minutes, exposure })

  return (
    <Card variant="outlined">
      <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
        Vitamina D estimada hoy
      </AppText>

      <AppText variant="display">{formatVitaminDIu(result.estimatedIu)}</AppText>

      <AppText variant="caption" color="textMuted" style={styles.note}>
        {result.saturated
          ? 'Has alcanzado la síntesis máxima práctica del día. Más exposición apenas añade vitamina D y sí aumenta el riesgo.'
          : 'Estimación de bienestar a partir de tus sesiones de hoy, no una medición clínica.'}
      </AppText>
    </Card>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  note: {
    marginTop: spacing.sm,
    lineHeight: 18,
  },
})
