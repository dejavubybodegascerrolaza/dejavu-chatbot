import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, radius, spacing } from '@/design'
import { ACHIEVEMENT_DESCRIPTIONS, ACHIEVEMENT_LABELS } from '@/modules/gamification'
import type { Achievement } from '@/modules/gamification'

type Props = {
  achievement: Achievement
}

export function AchievementBadge({ achievement }: Props) {
  const { id, unlocked, current, target } = achievement
  const progress = target > 0 ? Math.min(current / target, 1) : 0

  return (
    <View
      style={[styles.card, unlocked ? styles.unlocked : styles.locked]}
      accessibilityLabel={`${ACHIEVEMENT_LABELS[id]}${unlocked ? ', conseguido' : `, ${current} de ${target}`}`}
    >
      <View style={styles.header}>
        <AppText variant="bodyStrong" color={unlocked ? 'brand' : 'textPrimary'}>
          {ACHIEVEMENT_LABELS[id]}
        </AppText>
        <AppText variant="caption" color={unlocked ? 'brand' : 'textMuted'}>
          {unlocked ? '✓' : `${current}/${target}`}
        </AppText>
      </View>

      <AppText variant="caption" color="textSecondary" style={styles.description}>
        {ACHIEVEMENT_DESCRIPTIONS[id]}
      </AppText>

      {!unlocked ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  unlocked: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  locked: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    lineHeight: 18,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundMuted,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
})
