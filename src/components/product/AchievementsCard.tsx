import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { spacing } from '@/design'
import { ACHIEVEMENT_LABELS } from '@/modules/gamification'
import type { GamificationSummary } from '@/modules/gamification'

type Props = {
  summary: GamificationSummary
  onPress: () => void
}

/** Compact Home entry to the achievements screen. */
export function AchievementsCard({ summary, onPress }: Props) {
  const { unlockedCount, totalCount, nextAchievement } = summary

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Ver mis logros">
      <Card variant="outlined">
        <View style={styles.header}>
          <AppText variant="label" color="textSecondary">
            Logros
          </AppText>
          <AppText variant="caption" color="brand">
            {unlockedCount}/{totalCount} ›
          </AppText>
        </View>

        {nextAchievement !== null ? (
          <AppText variant="caption" color="textSecondary" style={styles.next}>
            Próximo: {ACHIEVEMENT_LABELS[nextAchievement.id]} ({nextAchievement.current}/
            {nextAchievement.target})
          </AppText>
        ) : (
          <AppText variant="caption" color="brand" style={styles.next}>
            ¡Has desbloqueado todos los logros!
          </AppText>
        )}
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  next: {
    marginTop: spacing.xs,
  },
})
