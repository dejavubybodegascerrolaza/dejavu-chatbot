import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, AppText } from '@/components/ui'
import { spacing } from '@/design'

type Props = {
  alias: string
  goalLabel: string
  sensitivityLabel: string
  skinTypeLabel: string
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textMuted" style={styles.label}>
        {label}
      </AppText>
      <AppText variant="body" color="textPrimary" style={styles.value}>
        {value}
      </AppText>
    </View>
  )
}

export function ProfileSummaryCard({ alias, goalLabel, sensitivityLabel, skinTypeLabel }: Props) {
  return (
    <Card variant="outlined" style={styles.card}>
      <AppText variant="bodyStrong" style={styles.alias}>
        {alias}
      </AppText>
      <SummaryRow label="Objetivo" value={goalLabel} />
      <SummaryRow label="Sensibilidad" value={sensitivityLabel} />
      <SummaryRow label="Fototipo" value={skinTypeLabel} />
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  alias: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
})
