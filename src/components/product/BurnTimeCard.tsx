import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { spacing } from '@/design'
import { calculateBurnTime, formatMinutes } from '@/modules/sun'
import type { SkinType } from '@/modules/profile/profile.types'

type Props = {
  skinType: SkinType | null
  uvIndex: number
}

/**
 * "Reloj de piel": shows the conservative safe exposure time and the estimated
 * sunburn threshold for the current UV index and the user's skin type.
 */
export function BurnTimeCard({ skinType, uvIndex }: Props) {
  const result = calculateBurnTime({ skinType, uvIndex })

  return (
    <Card variant="outlined">
      <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
        Tu reloj de piel
      </AppText>

      <AppText variant="display">{formatMinutes(result.safeMinutes)}</AppText>
      <AppText variant="caption" color="textMuted">
        sin protección, antes de acercarte al riesgo
      </AppText>

      <View style={styles.detailRow}>
        <AppText variant="caption" color="textSecondary">
          Umbral estimado de quemadura
        </AppText>
        <AppText variant="caption" color="textPrimary" style={styles.detailValue}>
          {formatMinutes(result.minutesToBurn)}
        </AppText>
      </View>

      <AppText variant="caption" color="textMuted" style={styles.note}>
        Estimación orientativa. Un protector solar alarga este tiempo de forma significativa.
      </AppText>
    </Card>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  detailValue: {
    fontWeight: '600',
  },
  note: {
    marginTop: spacing.sm,
    lineHeight: 18,
  },
})
