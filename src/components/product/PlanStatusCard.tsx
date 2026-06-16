import React from 'react'
import { StyleSheet } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { spacing } from '@/design'
import type { PlanStatusSummary, PlanStatusTone } from '@/modules/plan/plan.presentation'

type Props = {
  summary: PlanStatusSummary
  testID?: string | undefined
}

const TITLE_COLOR: Record<PlanStatusTone, 'success' | 'warning' | 'textPrimary'> = {
  positive: 'success',
  caution: 'warning',
  neutral: 'textPrimary',
}

/**
 * Compact "plan status at a glance" card shown at the top of the Plan screen.
 * Purely presentational — all state mapping happens in resolvePlanStatus.
 */
export function PlanStatusCard({ summary, testID }: Props) {
  return (
    <Card variant="outlined" testID={testID}>
      <AppText variant="label" color="textSecondary" style={styles.label}>
        Estado del plan
      </AppText>
      <AppText variant="bodyStrong" color={TITLE_COLOR[summary.tone]}>
        {summary.title}
      </AppText>
      <AppText variant="caption" color="textSecondary" style={styles.detail}>
        {summary.detail}
      </AppText>
    </Card>
  )
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
  },
  detail: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
})
