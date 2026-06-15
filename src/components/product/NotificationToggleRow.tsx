import React from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { AppText } from '@/components/ui'
import { colors, spacing, radius } from '@/design'

type Props = {
  title: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

export function NotificationToggleRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <AppText variant="body" color={disabled ? 'textMuted' : 'textPrimary'}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" color="textMuted" style={styles.description}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.brand }}
        thumbColor={colors.surface}
        accessibilityLabel={title}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
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
  textGroup: {
    flex: 1,
    gap: 2,
  },
  description: {
    marginTop: 2,
  },
})
