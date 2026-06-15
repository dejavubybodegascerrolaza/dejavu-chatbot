import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/components/ui'
import { AchievementBadge, StreakCard } from '@/components/product'
import { colors, spacing } from '@/design'
import { getTodayISODate } from '@/utils/date'
import { useAuthStore } from '@/modules/auth/auth.store'
import { useSessionStore } from '@/modules/sessions/session.store'
import { usePlanStore } from '@/modules/plan'
import { buildGamificationSummary } from '@/modules/gamification'

export default function AchievementsScreen() {
  const user = useAuthStore((s) => s.user)
  const historySessions = useSessionStore((s) => s.historySessions)
  const planGoal = usePlanStore((s) => s.goalLevel)

  const summary = useMemo(
    () =>
      buildGamificationSummary({
        sessions: historySessions.map((s) => ({
          sessionDate: s.sessionDate,
          sensationAfter: s.sensationAfter,
          context: s.context,
        })),
        today: getTodayISODate(),
        hasPlan: planGoal !== null,
      }),
    [historySessions, planGoal]
  )

  // user is guaranteed by the auth guard; referenced to keep the screen scoped.
  void user

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StreakCard streak={summary.safetyStreak} />

        <View style={styles.headingRow}>
          <AppText variant="heading">Tus logros</AppText>
          <AppText variant="caption" color="textSecondary">
            {summary.unlockedCount}/{summary.totalCount}
          </AppText>
        </View>

        <View style={styles.list}>
          {summary.achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </View>

        <AppText variant="caption" color="textMuted" style={styles.note}>
          Tu racha premia los días que cuidas tu piel —sin quemaduras—, y descansar también suma. No
          recompensamos más exposición.
        </AppText>
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
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  note: {
    lineHeight: 18,
  },
})
