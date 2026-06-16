import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, radius, spacing } from '@/design'
import { FACE_GUARD_ACTION_LABELS } from '@/modules/face-guard'
import type { FaceGuard, FaceGuardLevel } from '@/modules/face-guard'

type Props = {
  faceGuard: FaceGuard
}

const CONTAINER_COLORS: Record<Exclude<FaceGuardLevel, 'standard'>, string> = {
  elevated: colors.warningSoft,
  strong: colors.dangerSoft,
}

const TITLE_COLORS: Record<Exclude<FaceGuardLevel, 'standard'>, string> = {
  elevated: colors.warning,
  strong: colors.danger,
}

const TITLES: Record<Exclude<FaceGuardLevel, 'standard'>, string> = {
  elevated: 'Face Guard activo',
  strong: 'Face Guard activo',
}

/**
 * Shows face-specific guidance when Face Guard level is elevated or strong.
 * Returns null at standard level — standard is the baseline and does not warrant
 * a separate card on Home.
 */
export function FaceGuardCard({ faceGuard }: Props) {
  if (faceGuard.level === 'standard') return null

  const containerColor = CONTAINER_COLORS[faceGuard.level]
  const titleColor = TITLE_COLORS[faceGuard.level]
  const title = TITLES[faceGuard.level]
  const actionLabel = FACE_GUARD_ACTION_LABELS[faceGuard.suggestedAction]

  return (
    <View
      style={[styles.container, { backgroundColor: containerColor }]}
      accessibilityRole="alert"
      accessibilityLabel={`Face Guard: ${faceGuard.summary}`}
    >
      <AppText variant="bodyStrong" style={[styles.title, { color: titleColor }]}>
        {title}
      </AppText>
      <AppText variant="caption" style={styles.summary}>
        {faceGuard.summary}
      </AppText>
      <AppText variant="caption" style={[styles.action, { color: titleColor }]}>
        → {actionLabel}
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
  summary: {
    lineHeight: 18,
    color: colors.textSecondary,
  },
  action: {
    lineHeight: 18,
    marginTop: spacing.xs,
  },
})
