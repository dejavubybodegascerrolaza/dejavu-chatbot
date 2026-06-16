import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText, Card } from '@/components/ui'
import { spacing } from '@/design'
import { formatStreakMessage } from '@/modules/gamification'

type Props = {
  streak: number
}

/**
 * Hero card for the safety streak — consecutive days caring for the skin.
 * Rewards safe behaviour (no burns), never more sun exposure.
 */
export function StreakCard({ streak }: Props) {
  return (
    <Card variant="elevated">
      <View style={styles.row}>
        <AppText variant="display" color="brand">
          {streak}
        </AppText>
        <View style={styles.text}>
          <AppText variant="bodyStrong">{formatStreakMessage(streak)}</AppText>
          <AppText variant="caption" color="textMuted" style={styles.subtext}>
            {streak > 0
              ? 'Sigue así: descansar también cuenta.'
              : 'Anota tu exposición de hoy o tómate un descanso.'}
          </AppText>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  subtext: {
    marginTop: 2,
    lineHeight: 18,
  },
})
