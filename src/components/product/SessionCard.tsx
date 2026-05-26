import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Card, AppText } from '@/components/ui'
import { spacing } from '@/design'
import {
  CONTEXT_LABELS,
  PROTECTION_LABELS,
  SENSATION_LABELS,
} from '@/modules/sessions/session.labels'
import type { ExposureSession } from '@/modules/sessions/session.types'

type Props = {
  session: ExposureSession
  onPress?: () => void
}

export function SessionCard({ session, onPress }: Props) {
  const content = (
    <Card variant="outlined">
      <View style={styles.header}>
        <AppText variant="bodyStrong">
          {session.durationMinutes} min · {CONTEXT_LABELS[session.context]}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {session.sessionDate}
        </AppText>
      </View>
      <View style={styles.details}>
        <AppText variant="caption" color="textSecondary">
          Sensación: {SENSATION_LABELS[session.sensationAfter]}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          Protección: {PROTECTION_LABELS[session.protectionLevel]}
        </AppText>
        {session.uvIndexManual !== null ? (
          <AppText variant="caption" color="textSecondary">
            UV: {session.uvIndexManual}
          </AppText>
        ) : (
          <AppText variant="caption" color="textMuted">
            UV: No indicado
          </AppText>
        )}
      </View>
      {session.notes !== null ? (
        <AppText variant="caption" color="textMuted" style={styles.notes} numberOfLines={2}>
          {session.notes}
        </AppText>
      ) : null}
    </Card>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    )
  }
  return content
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  details: {
    gap: 2,
    marginTop: spacing.xs,
  },
  notes: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
})
