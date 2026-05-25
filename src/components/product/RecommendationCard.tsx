import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Card, AppText, Badge, Button } from '@/components/ui'
import type { BadgeLevel } from '@/components/ui'
import { spacing } from '@/design'
import { getReasonLabel } from '@/modules/recommendations/recommendation.labels'
import type { RecommendationLevel } from '@/modules/recommendations/recommendation.types'

type Props = {
  title: string
  message: string
  level: RecommendationLevel
  reasons: string[]
  ctaLabel: string
  onCtaPress: () => void
}

const LEVEL_TO_BADGE: Record<RecommendationLevel, BadgeLevel> = {
  low: 'low',
  moderate: 'moderate',
  caution: 'moderate',
  high_caution: 'high',
  rest: 'avoid',
}

const BADGE_LABELS: Record<RecommendationLevel, string> = {
  low: 'Baja acumulación',
  moderate: 'Moderada',
  caution: 'Ir con calma',
  high_caution: 'Prudencia alta',
  rest: 'Descanso',
}

export function RecommendationCard({
  title,
  message,
  level,
  reasons,
  ctaLabel,
  onCtaPress,
}: Props) {
  return (
    <Card variant="elevated">
      <View style={styles.header}>
        <Badge level={LEVEL_TO_BADGE[level]} label={BADGE_LABELS[level]} />
      </View>

      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.message}>
        {message}
      </AppText>

      {reasons.length > 0 ? (
        <View style={styles.reasons}>
          {reasons.map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <AppText variant="caption" color="textMuted" style={styles.bullet}>
                ·
              </AppText>
              <AppText variant="caption" color="textMuted" style={styles.reasonText}>
                {getReasonLabel(reason)}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        label={ctaLabel}
        variant="primary"
        size="md"
        onPress={onCtaPress}
        style={styles.cta}
        accessibilityLabel={ctaLabel}
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  message: {
    lineHeight: 22,
  },
  reasons: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bullet: {
    lineHeight: 20,
  },
  reasonText: {
    flex: 1,
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
})
