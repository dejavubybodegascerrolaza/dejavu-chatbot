import React from 'react'
import { StyleSheet, View } from 'react-native'
import { spacing } from '@/design'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'

type Props = {
  title: string
  description?: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({ title, description, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="heading" color="textPrimary" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" color="textSecondary" align="center" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {ctaLabel && onCta ? <Button label={ctaLabel} onPress={onCta} style={styles.cta} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  description: { maxWidth: 280 },
  cta: { marginTop: spacing.sm },
})
