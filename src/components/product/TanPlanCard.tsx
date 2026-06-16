import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { colors, spacing } from '@/design'
import { formatEtaDate, formatPlanDuration, TAN_LEVEL_LABELS } from '@/modules/plan'
import type { TanPlanResult } from '@/modules/plan'
import { formatMinutes } from '@/modules/sun'
import { ADHERENCE_STATUS_LABELS } from '@/modules/adherence'
import type { PlanAdherence } from '@/modules/adherence'

type Props = {
  plan: TanPlanResult | null
  onPress: () => void
  adherence?: PlanAdherence | null
}

/**
 * Home entry point for the tanning plan. Shows the goal, ETA and estimated
 * cadence when a plan exists, or an invitation to create one.
 *
 * ETA is always framed as an estimate, never as a guaranteed date.
 */
export function TanPlanCard({ plan, onPress, adherence }: Props) {
  if (plan === null) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Crear mi plan">
        <Card variant="outlined">
          <AppText variant="bodyStrong">Crea tu plan de bronceado</AppText>
          <AppText variant="caption" color="textSecondary" style={styles.subtext}>
            Define tu objetivo y Bronze IQ estimará el ritmo orientativo para lograrlo.
          </AppText>
        </Card>
      </Pressable>
    )
  }

  const goalReached = plan.status === 'goal_below_current'
  const isPaused = plan.status === 'paused_recovery'

  // When slightly_behind: show adjusted ETA. Otherwise show original.
  const displayEta =
    adherence?.status === 'slightly_behind' && adherence.adjustedEtaDate !== null
      ? adherence.adjustedEtaDate
      : plan.etaDate

  const etaLabel =
    adherence?.status === 'slightly_behind' && adherence.adjustedEtaDate !== null
      ? 'ETA ajustada (orientativa):'
      : 'ETA orientativa:'

  const adherenceLabel =
    adherence != null && adherence.status !== 'unknown'
      ? ADHERENCE_STATUS_LABELS[adherence.status]
      : null

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Ver mi plan">
      <Card variant="elevated">
        <View style={styles.header}>
          <AppText variant="label" color="textSecondary">
            Tu plan de bronceado
          </AppText>
          <AppText variant="caption" color="brand">
            Ver plan ›
          </AppText>
        </View>

        <AppText variant="heading" style={styles.goal}>
          Meta: {TAN_LEVEL_LABELS[plan.goalLevel]}
        </AppText>

        {goalReached ? (
          <AppText variant="body" color="textSecondary">
            Ya has alcanzado este tono. ¡Elige una meta más intensa para seguir!
          </AppText>
        ) : isPaused ? (
          <AppText variant="caption" color="textSecondary" style={styles.pausedNote}>
            Plan pausado mientras tu piel se recupera. Retoma cuando te encuentres bien.
          </AppText>
        ) : (
          <>
            <View style={styles.row}>
              <AppText variant="caption" color="textSecondary">
                {etaLabel}
              </AppText>
              <AppText variant="bodyStrong" color="brand">
                {formatEtaDate(displayEta)}
              </AppText>
            </View>
            <View style={styles.row}>
              <AppText variant="caption" color="textSecondary">
                Duración estimada
              </AppText>
              <AppText variant="caption" color="textPrimary">
                {formatPlanDuration(plan.totalDays)}
              </AppText>
            </View>
            <View style={styles.row}>
              <AppText variant="caption" color="textSecondary">
                Tiempo diario estimado
              </AppText>
              <AppText variant="caption" color="textPrimary">
                {formatMinutes(plan.dailySafeMinutes)}
              </AppText>
            </View>
          </>
        )}

        {/* Adherence status line — shows only when meaningful */}
        {adherenceLabel !== null ? (
          <AppText variant="caption" color="textMuted" style={styles.adherenceStatus}>
            {adherenceLabel}
          </AppText>
        ) : null}
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  subtext: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  pausedNote: {
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goal: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adherenceStatus: {
    marginTop: spacing.sm,
    lineHeight: 18,
  },
})
