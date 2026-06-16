import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, spacing, radius } from '@/design'

type Variant = 'normal' | 'danger'

type Props = {
  title: string
  description?: string
  onPress: () => void
  variant?: Variant
  accessibilityLabel?: string
  disabled?: boolean
}

export function SettingsRow({
  title,
  description,
  onPress,
  variant = 'normal',
  accessibilityLabel,
  disabled = false,
}: Props) {
  const isDanger = variant === 'danger'

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
    >
      <View style={styles.textGroup}>
        <AppText variant="body" color={isDanger ? 'danger' : 'textPrimary'}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" color="textMuted" style={styles.description}>
            {description}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color="textMuted">
        ›
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  description: {
    marginTop: 2,
  },
})
