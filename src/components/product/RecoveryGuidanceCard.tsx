import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, radius, spacing } from '@/design'
import type { RecoveryLevel, RecoveryStatus } from '@/modules/recovery'

type Props = {
  recovery: RecoveryStatus
}

const TITLES: Record<Exclude<RecoveryLevel, 'none'>, string> = {
  caution: 'Escucha las señales de tu piel',
  recovery_recommended: 'Tu piel pide un descanso',
  avoid_direct_exposure: 'Evita la exposición directa',
}

const CONTAINER_COLORS: Record<Exclude<RecoveryLevel, 'none'>, string> = {
  caution: colors.warningSoft,
  recovery_recommended: colors.warningSoft,
  avoid_direct_exposure: colors.dangerSoft,
}

const TEXT_COLORS: Record<Exclude<RecoveryLevel, 'none'>, string> = {
  caution: colors.warning,
  recovery_recommended: colors.warning,
  avoid_direct_exposure: colors.danger,
}

export function RecoveryGuidanceCard({ recovery }: Props) {
  if (recovery.level === 'none') return null

  const title = TITLES[recovery.level]
  const containerColor = CONTAINER_COLORS[recovery.level]
  const textColor = TEXT_COLORS[recovery.level]

  return (
    <View
      style={[styles.container, { backgroundColor: containerColor }]}
      accessibilityRole="alert"
      accessibilityLabel={`Aviso de recuperación: ${title}`}
      testID="recovery-guidance-card"
    >
      <AppText variant="bodyStrong" style={[styles.title, { color: textColor }]}>
        {title}
      </AppText>
      <AppText variant="caption" style={styles.message}>
        {recovery.message}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    lineHeight: 22,
  },
  message: {
    lineHeight: 18,
    color: colors.textSecondary,
  },
})
