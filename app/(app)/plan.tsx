import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, Card } from '@/components/ui'
import { PlanStatusCard, ProfileOptionCard } from '@/components/product'
import { resolvePlanStatus, PLAN_ADJUSTMENT_NOTES } from '@/modules/plan/plan.presentation'
import { colors, spacing } from '@/design'
import { formatDisplayDate, getTodayISODate } from '@/utils/date'
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
import { useSessionStore } from '@/modules/sessions/session.store'
import { buildRecoveryStatus } from '@/modules/recovery'
import { buildPlanAdherence } from '@/modules/adherence'

const SELECTABLE_GOALS: TanLevel[] = TAN_LEVEL_ORDER.filter((l) => l !== 'natural')

export default function PlanScreen() {
  const profile = useProfileStore((s) => s.profile)
  const skinType = profile?.skinType ?? null

  const goalLevel = usePlanStore((s) => s.goalLevel)
  const currentLevel = usePlanStore((s) => s.currentLevel)
  const startDate = usePlanStore((s) => s.startDate)
  const planStoreError = usePlanStore((s) => s.error)
  const setGoal = usePlanStore((s) => s.setGoal)

  const currentUv = useUvStore((s) => s.forecast?.maxToday ?? null)

  const historySessions = useSessionStore((s) => s.historySessions)
  const recentSessions = useSessionStore((s) => s.recentSessions)

  const today = getTodayISODate()

  const plan = useMemo(() => {
    if (goalLevel === null) return null
    const recoveryStatus = buildRecoveryStatus({ recentSessions, today })
    const hasRecentOverexposure =
      recoveryStatus.level === 'recovery_recommended' ||
      recoveryStatus.level === 'avoid_direct_exposure'
    return generateTanPlan({
      skinType,
      currentLevel,
      goalLevel,
      hasRecentOverexposure,
      ...(currentUv !== null ? { typicalUvIndex: currentUv } : {}),
    })
  }, [skinType, currentLevel, goalLevel, currentUv, recentSessions, today])

  const adherence = useMemo(() => {
    if (plan === null || startDate === null) return null
    const recoveryStatus = buildRecoveryStatus({ recentSessions, today })
    return buildPlanAdherence({
      plan,
      planStartDate: startDate,
      historySessions,
      recoveryStatus,
      today,
    })
  }, [plan, startDate, historySessions, recentSessions, today])

  // At-a-glance plan state — pure mapping from existing plan + adherence outputs.
  const planStatus = resolvePlanStatus(plan, adherence)
  // The detailed result card already explains "goal already reached"; avoid a
  // contradictory top status card in that one edge case.
  const showStatusCard = plan === null || plan.status !== 'goal_below_current'

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showStatusCard ? <PlanStatusCard summary={planStatus} /> : null}

        {planStoreError !== null ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <AppText variant="caption" color="danger">
              {planStoreError}
            </AppText>
          </View>
        ) : null}

        <AppText variant="body" color="textSecondary">
          Elige tu objetivo de tono. Bronze IQ estima el número de sesiones y el tiempo orientativo
          que puede llevarte lograrlo según tu fototipo. Es una proyección, no una garantía.
        </AppText>

        {/* Goal picker */}
        <View style={styles.options}>
          {SELECTABLE_GOALS.map((level) => (
            <ProfileOptionCard
              key={level}
              label={TAN_LEVEL_LABELS[level]}
              description={TAN_LEVEL_DESCRIPTIONS[level]}
              selected={goalLevel === level}
              onPress={() => void setGoal(level)}
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

            {plan.etaDate !== null &&
            plan.status !== 'goal_below_current' &&
            plan.status !== 'paused_recovery' ? (
              <>
                <AppText variant="label" color="textMuted" style={styles.etaLabel}>
                  {adherence?.status === 'slightly_behind' && adherence.adjustedEtaDate !== null
                    ? 'ETA ajustada (orientativa)'
                    : 'ETA orientativa'}
                </AppText>
                <AppText variant="title" color="brand" style={styles.eta}>
                  {adherence?.status === 'slightly_behind' && adherence.adjustedEtaDate !== null
                    ? formatEtaDate(adherence.adjustedEtaDate)
                    : formatEtaDate(plan.etaDate)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  Llegas a {TAN_LEVEL_LABELS[plan.reachableLevel]} en{' '}
                  {formatPlanDuration(plan.totalDays)} ({plan.sessionDays} sesiones estimadas)
                </AppText>
                <AppText variant="caption" color="textMuted" style={styles.etaDisclaimer}>
                  Estimación, no garantía. Se ajusta con tus sesiones registradas y tu piel.
                </AppText>

                <View style={styles.metaRow}>
                  <AppText variant="caption" color="textSecondary">
                    Tiempo diario estimado
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

                {/* Adherence summary */}
                {adherence != null && adherence.status !== 'unknown' && adherence.summary !== '' ? (
                  <AppText variant="caption" color="textMuted" style={styles.adherenceSummary}>
                    {adherence.summary}
                  </AppText>
                ) : null}
              </>
            ) : null}
          </Card>
        ) : null}

        {/* How Bronze IQ adjusts this plan */}
        <Card variant="outlined">
          <AppText variant="label" color="textSecondary" style={styles.resultLabel}>
            Cómo se ajusta tu plan
          </AppText>
          <View style={styles.adjustList}>
            {PLAN_ADJUSTMENT_NOTES.map((note) => (
              <View key={note} style={styles.adjustRow}>
                <AppText variant="caption" color="textMuted" style={styles.adjustBullet}>
                  ·
                </AppText>
                <AppText variant="caption" color="textSecondary" style={styles.adjustText}>
                  {note}
                </AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* Science / safety note */}
        <Card variant="outlined">
          <AppText variant="label" color="textSecondary" style={styles.resultLabel}>
            Cómo lo calculamos
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.scienceText}>
            Cada sesión utiliza un tiempo estimado para tu fototipo (una fracción del umbral de
            quemadura), distribuido en días con descanso para que la piel se recupere. Es una
            proyección orientativa de bienestar, no una promesa médica ni un diagnóstico.
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
  etaLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  eta: {
    marginTop: spacing.xs,
  },
  adherenceSummary: {
    marginTop: spacing.md,
    lineHeight: 18,
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
  etaDisclaimer: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  adjustList: {
    gap: spacing.xs,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  adjustBullet: {
    lineHeight: 18,
  },
  adjustText: {
    flex: 1,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    padding: spacing.md,
  },
})
