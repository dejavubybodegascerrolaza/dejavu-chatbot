import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { colors, spacing } from '@/design'
import { formatEtaDate, formatPlanDuration, TAN_LEVEL_LABELS } from '@/modules/plan'
import type { TanPlanResult } from '@/modules/plan'
import { formatMinutes } from '@/modules/sun'

type Props = {
  plan: TanPlanResult | null
  onPress: () => void
}

/**
 * Home entry point for the tanning plan. Shows the goal, ETA and safe daily
 * dose when a plan exists, or an invitation to create one.
 */
export function TanPlanCard({ plan, onPress }: Props) {
  if (plan === null) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Crear mi plan">
        <Card variant="outlined">
          <AppText variant="bodyStrong">Crea tu plan de bronceado</AppText>
          <AppText variant="caption" color="textSecondary" style={styles.subtext}>
            Define tu objetivo y calcula el día en que lo alcanzas de forma sana.
          </AppText>
        </Card>
      </Pressable>
    )
  }

  const goalReached = plan.status === 'goal_below_current'
  const isPaused = plan.status === 'paused_recovery'

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
                Lo alcanzas el
              </AppText>
              <AppText variant="bodyStrong" color="brand">
                {formatEtaDate(plan.etaDate)}
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
})
