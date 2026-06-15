import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Card } from '@/components/ui'
import { ProfileOptionCard } from '@/components/product'
import { colors, spacing } from '@/design'
import { formatDisplayDate } from '@/utils/date'
import { useProfileStore } from '@/modules/profile/profile.store'
import { useUvStore } from '@/modules/uv'
import {
  formatEtaDate,
  formatPlanDuration,
  generateTanPlan,
  PLAN_STATUS_MESSAGES,
  TAN_LEVEL_DESCRIPTIONS,
  TAN_LEVEL_LABELS,
  TAN_LEVEL_ORDER,
  usePlanStore,
} from '@/modules/plan'
import type { TanLevel } from '@/modules/plan'
import { formatMinutes } from '@/modules/sun'

const SELECTABLE_GOALS: TanLevel[] = TAN_LEVEL_ORDER.filter((l) => l !== 'natural')

export default function PlanScreen() {
  const profile = useProfileStore((s) => s.profile)
  const skinType = profile?.skinType ?? null

  const goalLevel = usePlanStore((s) => s.goalLevel)
  const currentLevel = usePlanStore((s) => s.currentLevel)
  const setGoal = usePlanStore((s) => s.setGoal)

  const currentUv = useUvStore((s) => s.forecast?.maxToday ?? null)

  const plan = useMemo(() => {
    if (goalLevel === null) return null
    return generateTanPlan({
      skinType,
      currentLevel,
      goalLevel,
      ...(currentUv !== null ? { typicalUvIndex: currentUv } : {}),
    })
  }, [skinType, currentLevel, goalLevel, currentUv])

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" color="textSecondary">
          Elige tu objetivo de tono. Bronze IQ calcula el camino más rápido que tu piel puede seguir{' '}
          <AppText variant="bodyStrong" color="textSecondary">
            sin quemarse
          </AppText>
          , y el día en que lo alcanzas.
        </AppText>

        {/* Goal picker */}
        <View style={styles.options}>
          {SELECTABLE_GOALS.map((level) => (
            <ProfileOptionCard
              key={level}
              label={TAN_LEVEL_LABELS[level]}
              description={TAN_LEVEL_DESCRIPTIONS[level]}
              selected={goalLevel === level}
              onPress={() => setGoal(level)}
            />
          ))}
        </View>

        {/* Plan result */}
        {plan !== null ? (
          <Card variant="elevated">
            <AppText variant="label" color="textSecondary" style={styles.resultLabel}>
              {plan.status === 'ok' ? 'Tu plan' : 'Plan ajustado a tu piel'}
            </AppText>

            {plan.status !== 'ok' ? (
              <AppText variant="caption" color="textSecondary" style={styles.statusNote}>
                {PLAN_STATUS_MESSAGES[plan.status]}
              </AppText>
            ) : null}

            {plan.etaDate !== null && plan.status !== 'goal_below_current' ? (
              <>
                <AppText variant="title" color="brand" style={styles.eta}>
                  {formatEtaDate(plan.etaDate)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  Llegas a {TAN_LEVEL_LABELS[plan.reachableLevel]} en{' '}
                  {formatPlanDuration(plan.totalDays)} ({plan.sessionDays} sesiones)
                </AppText>

                <View style={styles.metaRow}>
                  <AppText variant="caption" color="textSecondary">
                    Dosis diaria segura
                  </AppText>
                  <AppText variant="caption" color="textPrimary">
                    {formatMinutes(plan.dailySafeMinutes)}
                  </AppText>
                </View>

                {/* Milestone timeline */}
                {plan.milestones.length > 0 ? (
                  <View style={styles.timeline}>
                    {plan.milestones.map((m) => (
                      <View key={m.level} style={styles.milestone}>
                        <View style={styles.milestoneDot} />
                        <View style={styles.milestoneText}>
                          <AppText variant="bodyStrong">{TAN_LEVEL_LABELS[m.level]}</AppText>
                          <AppText variant="caption" color="textMuted">
                            {formatDisplayDate(m.date)}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </Card>
        ) : null}

        {/* Science / safety note */}
        <Card variant="outlined">
          <AppText variant="label" color="textSecondary" style={styles.resultLabel}>
            Cómo lo calculamos
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.scienceText}>
            Cada sesión usa solo la dosis segura para tu fototipo (una fracción de tu umbral de
            quemadura), repartida en días con descanso para que la piel se recupere. El plan nunca
            recomienda superar ese límite. Es una proyección orientativa de bienestar, no una
            promesa médica ni un diagnóstico.
          </AppText>
        </Card>

        <Button
          label="Registrar sesión de hoy"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(app)/session-log')}
          accessibilityLabel="Registrar la sesión de exposición de hoy"
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  options: {
    gap: spacing.sm,
  },
  resultLabel: {
    marginBottom: spacing.sm,
  },
  statusNote: {
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  eta: {
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeline: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  milestoneText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scienceText: {
    lineHeight: 18,
  },
})
