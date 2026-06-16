import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, AppText } from '@/components/ui'
import { spacing } from '@/design'
import type { HistoryInsights, SafetyTrend } from '@/modules/history'

type Props = {
  insights: HistoryInsights
}

const TITLE_COLOR: Record<SafetyTrend, 'success' | 'warning' | 'danger' | 'textPrimary'> = {
  stable: 'success',
  caution: 'warning',
  recovery_needed: 'danger',
  insufficient_data: 'textPrimary',
}

const NOTE_COLOR: Record<SafetyTrend, 'warning' | 'danger' | 'textSecondary'> = {
  stable: 'textSecondary',
  caution: 'warning',
  recovery_needed: 'danger',
  insufficient_data: 'textSecondary',
}

/**
 * Compact "recent insight" card shown at the top of History. Conservative,
 * non-medical summary derived from the pure history-insights engine.
 */
export function HistoryInsightCard({ insights }: Props) {
  const { metrics } = insights

  return (
    <Card variant="outlined">
      <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
        Últimos 7 días
      </AppText>
      <AppText variant="bodyStrong" color={TITLE_COLOR[insights.trend]}>
        {insights.title}
      </AppText>
      <AppText variant="caption" color="textSecondary" style={styles.explanation}>
        {insights.explanation}
      </AppText>

      <View style={styles.metrics}>
        <MetricRow label="Sesiones" value={String(metrics.sessionsLoggedLast7Days)} />
        <MetricRow
          label="Minutos registrados"
          value={
            metrics.totalEstimatedMinutesLast7Days > 0
              ? `${metrics.totalEstimatedMinutesLast7Days} min`
              : '—'
          }
        />
        <MetricRow label="Días sin señales de quemadura" value={String(metrics.burnFreeDays)} />
      </View>

      {insights.cautionNote !== null ? (
        <AppText
          variant="caption"
          color={NOTE_COLOR[insights.trend]}
          style={styles.note}
          accessibilityRole="alert"
        >
          {insights.cautionNote}
        </AppText>
      ) : null}
    </Card>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textSecondary" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="caption" color="textPrimary" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  explanation: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  metrics: {
    marginTop: spacing.md,
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    fontWeight: '600',
    textAlign: 'right',
  },
  note: {
    marginTop: spacing.md,
    lineHeight: 18,
  },
})
