import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText, Badge, Card } from '@/components/ui'
import { spacing } from '@/design'
import {
  classifyUv,
  formatPeakWindow,
  UV_CATEGORY_ADVICE,
  UV_CATEGORY_LABELS,
  UV_CATEGORY_TO_BADGE,
} from '@/modules/uv'
import type { UvForecast } from '@/modules/uv'

type Props = {
  forecast: UvForecast
}

export function UvIndexCard({ forecast }: Props) {
  const category = classifyUv(forecast.current.uvIndex)

  return (
    <Card variant="elevated">
      <View style={styles.header}>
        <AppText variant="label" color="textSecondary">
          Índice UV ahora
        </AppText>
        <Badge level={UV_CATEGORY_TO_BADGE[category]} label={UV_CATEGORY_LABELS[category]} />
      </View>

      <View style={styles.valueRow}>
        <AppText variant="display">{formatUv(forecast.current.uvIndex)}</AppText>
        <AppText variant="caption" color="textMuted" style={styles.maxText}>
          Máx. hoy {formatUv(forecast.maxToday)}
        </AppText>
      </View>

      <AppText variant="body" color="textSecondary" style={styles.advice}>
        {UV_CATEGORY_ADVICE[category]}
      </AppText>

      <AppText variant="caption" color="textMuted" style={styles.peak}>
        Pico de riesgo alto {formatPeakWindow(forecast.peakWindow)}
      </AppText>
    </Card>
  )
}

function formatUv(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  maxText: {
    marginBottom: spacing.xs,
  },
  advice: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  peak: {
    marginTop: spacing.sm,
  },
})
