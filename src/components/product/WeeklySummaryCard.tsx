import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, AppText } from '@/components/ui'
import { spacing } from '@/design'
import { LEVEL_LABELS } from '@/modules/recommendations/recommendation.labels'
import type { RecommendationLevel } from '@/modules/recommendations/recommendation.types'

type Props = {
  sessionsCount: number
  totalMinutes: number
  lastSensationLabel: string | null
  recommendationLevel: RecommendationLevel
}

export function WeeklySummaryCard({
  sessionsCount,
  totalMinutes,
  lastSensationLabel,
  recommendationLevel,
}: Props) {
  return (
    <Card variant="outlined">
      <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
        Últimos 7 días
      </AppText>
      <View style={styles.rows}>
        <SummaryRow label="Sesiones" value={String(sessionsCount)} />
        <SummaryRow
          label="Minutos registrados"
          value={totalMinutes > 0 ? `${totalMinutes} min` : '—'}
        />
        <SummaryRow label="Última sensación" value={lastSensationLabel ?? 'Sin datos'} />
        <SummaryRow label="Nivel de prudencia" value={LEVEL_LABELS[recommendationLevel]} />
      </View>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <AppText variant="caption" color="textPrimary" style={styles.value}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  rows: {
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  value: {
    fontWeight: '600',
    textAlign: 'right',
  },
})
