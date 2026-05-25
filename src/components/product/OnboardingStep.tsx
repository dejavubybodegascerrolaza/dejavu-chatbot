import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Screen, AppText, Button } from '@/components/ui'
import { spacing } from '@/design'

type Props = {
  title: string
  message: string
  children?: React.ReactNode
  primaryLabel: string
  onPrimaryPress: () => void
  primaryDisabled?: boolean | undefined
  primaryLoading?: boolean | undefined
  secondaryLabel?: string | undefined
  onSecondaryPress?: (() => void) | undefined
}

export function OnboardingStep({
  title,
  message,
  children,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryPress,
}: Props) {
  return (
    <Screen scroll padded>
      <View style={styles.container}>
        <View style={styles.content}>
          <AppText variant="title">{title}</AppText>
          <AppText variant="body" color="textSecondary" style={styles.message}>
            {message}
          </AppText>
          {children ? <View style={styles.children}>{children}</View> : null}
        </View>

        <View style={styles.actions}>
          <Button
            label={primaryLabel}
            variant="primary"
            size="lg"
            fullWidth
            disabled={primaryDisabled}
            loading={primaryLoading}
            onPress={onPrimaryPress}
            accessibilityLabel={primaryLabel}
          />
          {secondaryLabel !== undefined && onSecondaryPress !== undefined ? (
            <Button
              label={secondaryLabel}
              variant="ghost"
              size="md"
              fullWidth
              disabled={primaryLoading}
              onPress={onSecondaryPress}
              accessibilityLabel={secondaryLabel}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  message: {
    marginTop: spacing.sm,
  },
  children: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
})
